import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { trade_id?: string };
  const { trade_id } = body;
  if (!trade_id) {
    return NextResponse.json({ error: "trade_id is required" }, { status: 400 });
  }

  // Fetch trade with images, junction playbooks, and rule checks
  const { data: trade, error: tradeErr } = await supabase
    .from("trades")
    .select(`
      id,
      trade_images(image_url),
      trade_playbooks(playbook_id, playbooks(name, playbook_rules(id, rule_text, is_required, order_index))),
      trade_rule_checks(rule_id, is_followed),
      trade_playbook_grades(id, playbook_id)
    `)
    .eq("id", trade_id)
    .eq("user_id", user.id)
    .single();

  if (tradeErr || !trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  type PlaybookJoin = {
    playbook_id: string;
    playbooks: { name: string; playbook_rules: Array<{ id: string; rule_text: string; is_required: boolean; order_index: number }> };
  };

  const tradePlaybooks = (trade.trade_playbooks as unknown as PlaybookJoin[]) ?? [];

  if (tradePlaybooks.length === 0) {
    return NextResponse.json({ error: "Trade has no playbooks assigned" }, { status: 400 });
  }

  const images = (trade.trade_images as unknown as Array<{ image_url: string }>) ?? [];
  const ruleChecks = (trade.trade_rule_checks as unknown as Array<{ rule_id: string; is_followed: boolean }>) ?? [];
  const ruleChecksMap = new Map(ruleChecks.map((rc) => [rc.rule_id, rc.is_followed]));

  // Build rule compliance section per playbook
  const playbookSections = tradePlaybooks.map(({ playbooks: pb }) => {
    const rules = [...pb.playbook_rules].sort((a, b) => a.order_index - b.order_index);
    const rulesText = rules
      .map((r, i) => {
        const followed = ruleChecksMap.get(r.id) ?? false;
        const status = followed ? "✓ Followed" : "✗ Not followed";
        const required = r.is_required ? " [REQUIRED]" : " [optional]";
        return `  ${i + 1}. ${r.rule_text}${required} — ${status}`;
      })
      .join("\n");
    return `Playbook: "${pb.name}"\n${rulesText}`;
  });

  const complianceSummary = playbookSections.join("\n\n");

  type MessagePart = { type: "text"; text: string } | { type: "image"; image: string };
  const contentParts: MessagePart[] = [
    {
      type: "text",
      text: `Rule Compliance:\n\n${complianceSummary}\n\nPlease analyze whether the trade entry shown in the chart is consistent with these rules. Be objective and specific.`,
    },
  ];

  if (images.length > 0) {
    contentParts.push({ type: "image", image: images[0].image_url });
  }

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system:
      "You are a strict trading risk manager and coach. Review the chart screenshot (if provided) and the user's stated rule compliance across all assigned playbooks. Identify discrepancies between what they claimed to follow and what the chart shows. If no chart is provided, evaluate only the stated rule compliance. Be direct, objective, and specific. Format your response in markdown.",
    messages: [{ role: "user", content: contentParts }],
  });

  // Save feedback to the first playbook's grade record
  const firstPlaybookId = tradePlaybooks[0].playbook_id;
  const grades = (trade.trade_playbook_grades as unknown as Array<{ id: string; playbook_id: string }>) ?? [];
  const existingGrade = grades.find((g) => g.playbook_id === firstPlaybookId);

  if (existingGrade) {
    await supabase
      .from("trade_playbook_grades")
      .update({ ai_feedback: text })
      .eq("id", existingGrade.id);
  } else {
    await supabase
      .from("trade_playbook_grades")
      .insert({ trade_id, playbook_id: firstPlaybookId, ai_feedback: text });
  }

  return NextResponse.json({ feedback: text });
}
