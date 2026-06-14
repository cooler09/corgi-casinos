// Hand-written to match supabase/migrations/0001_init.sql. If you adopt the
// Supabase CLI, regenerate with:
//   supabase gen types typescript --linked > apps/web/src/lib/supabase/types.ts
// and commit the result so `typecheck` sees schema changes.

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
          emoji: string;
          pin: string | null;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          emoji?: string;
          pin?: string | null;
          balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          emoji?: string;
          pin?: string | null;
          balance?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          unit: string;
          kind: string;
          payout_mode: string;
          line: number | null;
          options: string[] | null;
          payout_multiplier: number;
          status: string;
          result: number | null;
          result_text: string | null;
          created_by: string;
          settled_by: string | null;
          created_at: string;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          unit?: string;
          kind?: string;
          payout_mode?: string;
          line?: number | null;
          options?: string[] | null;
          payout_multiplier?: number;
          status?: string;
          result?: number | null;
          result_text?: string | null;
          created_by: string;
          settled_by?: string | null;
          created_at?: string;
          settled_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          unit?: string;
          kind?: string;
          payout_mode?: string;
          line?: number | null;
          options?: string[] | null;
          payout_multiplier?: number;
          status?: string;
          result?: number | null;
          result_text?: string | null;
          created_by?: string;
          settled_by?: string | null;
          created_at?: string;
          settled_at?: string | null;
        };
        Relationships: [];
      };
      wagers: {
        Row: {
          id: string;
          event_id: string;
          player_id: string;
          pick: string | null;
          guess: number | null;
          stake: number;
          outcome: string | null;
          payout: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          player_id: string;
          pick?: string | null;
          guess?: number | null;
          stake: number;
          outcome?: string | null;
          payout?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          player_id?: string;
          pick?: string | null;
          guess?: number | null;
          stake?: number;
          outcome?: string | null;
          payout?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
