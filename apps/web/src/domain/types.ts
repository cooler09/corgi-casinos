// Pure domain model types. Framework-free: no Next, React, or Supabase imports.
// DB rows (snake_case) are mapped onto these (camelCase) at the repository
// boundary in src/lib/db/*.

export type Direction = 'over' | 'under';
export type Outcome = 'won' | 'lost' | 'push';
export type EventStatus = 'open' | 'settled';

export const STARTING_BALANCE = 1000;

export interface Player {
  id: string;
  name: string;
  emoji: string;
  pin: string | null;
  balance: number;
  createdAt: string;
}

export interface BettingEvent {
  id: string;
  title: string;
  description: string | null;
  unit: string;
  line: number;
  payoutMultiplier: number;
  status: EventStatus;
  result: number | null;
  createdBy: string;
  settledBy: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface Wager {
  id: string;
  eventId: string;
  playerId: string;
  direction: Direction;
  stake: number;
  outcome: Outcome | null;
  payout: number | null;
  createdAt: string;
}
