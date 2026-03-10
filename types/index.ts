// Re-export DB-aligned primitive types
export type { MarketType, TradeDirection, TradeStatus, TradeWithRelations } from "./database";

export interface DashboardStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
}

// Form data used by react-hook-form (camelCase, UI-friendly)
export interface TradeFormData {
  instrumentId: string;
  direction: "long" | "short";
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  fees?: number;
  notesPre?: string;
  notesPost?: string;
  emotionalState?: string;
  setupType?: string;
  tagIds?: string[];
}
