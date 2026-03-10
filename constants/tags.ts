export const TAG_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#6366F1", // indigo
  "#84CC16", // lime
  "#06B6D4", // cyan
  "#A855F7", // purple
] as const;

export const SUGGESTED_TAGS = [
  // Trade duration
  { name: "Scalp", color: "#3B82F6" },
  { name: "Day Trade", color: "#6366F1" },
  { name: "Swing", color: "#8B5CF6" },
  { name: "Position", color: "#A855F7" },
  // Setup
  { name: "Breakout", color: "#10B981" },
  { name: "Pullback", color: "#14B8A6" },
  { name: "Reversal", color: "#F59E0B" },
  { name: "Trend Following", color: "#84CC16" },
  // Catalyst
  { name: "News Event", color: "#F97316" },
  { name: "Technical", color: "#06B6D4" },
  { name: "Fundamental", color: "#EC4899" },
  // Outcome
  { name: "Winner", color: "#10B981" },
  { name: "Loser", color: "#EF4444" },
  { name: "Break-even", color: "#6B7280" },
] as const;
