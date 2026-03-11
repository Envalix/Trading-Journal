// Auto-generated Supabase database types.
// To regenerate: npx supabase gen types typescript --project-id <project-id> > types/database.ts
//
// NOTE: Supabase v2.99+ requires `Relationships: []` on every table entry
// or the Insert/Update types collapse to `never`.

export type MarketType = "stock" | "crypto" | "forex" | "futures" | "options" | "cfd";
export type TradeDirection = "long" | "short";
export type TradeStatus = "open" | "closed" | "draft";
export type TakeProfitStatus = "pending" | "hit" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          default_currency: string;
          timezone: string;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          default_currency?: string;
          timezone?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          default_currency?: string;
          timezone?: string;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          exchange: string | null;
          currency: string;
          initial_balance: number;
          current_balance: number;
          reserved_margin: number;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          exchange?: string | null;
          currency?: string;
          initial_balance?: number;
          current_balance?: number;
          reserved_margin?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          exchange?: string | null;
          currency?: string;
          initial_balance?: number;
          current_balance?: number;
          reserved_margin?: number;
          is_default?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };

      instruments: {
        Row: {
          id: string;
          user_id: string | null;
          symbol: string;
          name: string;
          market_type: MarketType;
          is_system: boolean;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          symbol: string;
          name: string;
          market_type: MarketType;
          is_system?: boolean;
          is_favorite?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          symbol?: string;
          name?: string;
          market_type?: MarketType;
          is_system?: boolean;
          is_favorite?: boolean;
        };
        Relationships: [];
      };

      user_instrument_favorites: {
        Row: {
          user_id: string;
          instrument_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          instrument_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          instrument_id?: string;
        };
        Relationships: [];
      };

      trades: {
        Row: {
          id: string;
          user_id: string;
          instrument_id: string;
          account_id: string | null;
          direction: TradeDirection;
          status: TradeStatus;
          entry_price: number;
          exit_price: number | null;
          quantity: number;
          stop_loss: number | null;
          take_profit: number | null;
          leverage: number;
          margin_mode: string;
          fees: number;
          entry_date: string;
          exit_date: string | null;
          pnl: number | null;
          pnl_percentage: number | null;
          notes_pre: string | null;
          notes_post: string | null;
          emotional_state: string | null;
          setup_type: string | null;
          platform: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instrument_id: string;
          account_id?: string | null;
          direction: TradeDirection;
          status?: TradeStatus;
          entry_price: number;
          exit_price?: number | null;
          quantity: number;
          stop_loss?: number | null;
          take_profit?: number | null;
          leverage?: number;
          margin_mode?: string;
          fees?: number;
          entry_date: string;
          exit_date?: string | null;
          pnl?: number | null;
          pnl_percentage?: number | null;
          notes_pre?: string | null;
          notes_post?: string | null;
          emotional_state?: string | null;
          setup_type?: string | null;
          platform?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          instrument_id?: string;
          account_id?: string | null;
          direction?: TradeDirection;
          status?: TradeStatus;
          entry_price?: number;
          exit_price?: number | null;
          quantity?: number;
          stop_loss?: number | null;
          take_profit?: number | null;
          leverage?: number;
          margin_mode?: string;
          fees?: number;
          entry_date?: string;
          exit_date?: string | null;
          notes_pre?: string | null;
          notes_post?: string | null;
          emotional_state?: string | null;
          setup_type?: string | null;
          platform?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      trade_take_profits: {
        Row: {
          id: string;
          trade_id: string;
          level: number;
          price: number;
          quantity_pct: number;
          status: TakeProfitStatus;
          hit_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_id: string;
          level: number;
          price: number;
          quantity_pct?: number;
          status?: TakeProfitStatus;
          hit_date?: string | null;
          created_at?: string;
        };
        Update: {
          level?: number;
          price?: number;
          quantity_pct?: number;
          status?: TakeProfitStatus;
          hit_date?: string | null;
        };
        Relationships: [];
      };

      trade_images: {
        Row: {
          id: string;
          trade_id: string;
          image_url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_id: string;
          image_url: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          caption?: string | null;
        };
        Relationships: [];
      };

      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
        };
        Relationships: [];
      };

      trade_tags: {
        Row: {
          trade_id: string;
          tag_id: string;
        };
        Insert: {
          trade_id: string;
          tag_id: string;
        };
        Update: {
          trade_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      market_type: MarketType;
      trade_direction: TradeDirection;
      trade_status: TradeStatus;
    };
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Instrument = Database["public"]["Tables"]["instruments"]["Row"];
export type UserInstrumentFavorite =
  Database["public"]["Tables"]["user_instrument_favorites"]["Row"];
export type Trade = Database["public"]["Tables"]["trades"]["Row"];
export type TradeTakeProfit = Database["public"]["Tables"]["trade_take_profits"]["Row"];
export type TradeImage = Database["public"]["Tables"]["trade_images"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type TradeTag = Database["public"]["Tables"]["trade_tags"]["Row"];

// Insert types
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
export type InstrumentInsert = Database["public"]["Tables"]["instruments"]["Insert"];
export type TradeInsert = Database["public"]["Tables"]["trades"]["Insert"];
export type TradeTakeProfitInsert = Database["public"]["Tables"]["trade_take_profits"]["Insert"];
export type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];

// Update types
export type TradeUpdate = Database["public"]["Tables"]["trades"]["Update"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
export type InstrumentUpdate = Database["public"]["Tables"]["instruments"]["Update"];
export type TradeTakeProfitUpdate = Database["public"]["Tables"]["trade_take_profits"]["Update"];

// Joined types (for queries with relations)
export type TradeWithRelations = Trade & {
  instruments: Instrument | null;
  trade_tags: Array<{ tags: Tag }>;
  trade_images: TradeImage[];
  trade_take_profits: TradeTakeProfit[];
  accounts: Account | null;
};
