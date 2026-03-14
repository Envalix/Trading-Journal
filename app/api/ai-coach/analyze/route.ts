import { NextResponse } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch last 50 closed trades
  const { data: trades, error: tradesErr } = await supabase
    .from("trades")
    .select("id, pnl, emotional_state, setup_type, entry_date")
    .eq("user_id", user.id)
    .eq("status", "closed")
    .order("entry_date", { ascending: false })
    .limit(50);

  if (tradesErr) {
    return NextResponse.json({ error: tradesErr.message }, { status: 500 });
  }

  if (!trades || trades.length === 0) {
    return NextResponse.json({ error: "No closed trades found to analyze." }, { status: 400 });
  }

  // Fetch discipline grades for these trades
  const tradeIds = trades.map((t) => t.id);
  const { data: grades } = await supabase
    .from("trade_playbook_grades")
    .select("trade_id, grade_score")
    .in("trade_id", tradeIds);

  const gradeByTrade = new Map<string, number | null>();
  for (const g of grades ?? []) {
    if (!gradeByTrade.has(g.trade_id)) {
      gradeByTrade.set(g.trade_id, g.grade_score);
    }
  }

  // Build compact trade summary
  const tradeSummary = trades
    .map((t, i) => {
      const pnl = t.pnl != null ? `PnL: ${t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}` : "PnL: N/A";
      const emotion = t.emotional_state ?? "Unknown";
      const setup = t.setup_type ?? "None";
      const grade = gradeByTrade.get(t.id);
      const discipline = grade != null ? `Discipline: ${grade.toFixed(0)}%` : "No playbook";
      return `${i + 1}. Date: ${t.entry_date.slice(0, 10)} | ${pnl} | Emotion: ${emotion} | Setup: ${setup} | ${discipline}`;
    })
    .join("\n");

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system:
      "You are an expert trading coach and behavioral analyst. Analyze the provided trade history and identify behavioral patterns — correlations between emotional state, discipline scores, and profitability. Be specific, data-driven, and actionable. Format your response using markdown with clear section headers (##). Focus on: 1) Emotional patterns, 2) Discipline impact, 3) Setup performance, 4) Concrete recommendations.",
    messages: [
      {
        role: "user",
        content: `Here are my last ${trades.length} closed trades. Please analyze my patterns and give me coaching:\n\n${tradeSummary}`,
      },
    ],
  });

  return result.toTextStreamResponse();
}
