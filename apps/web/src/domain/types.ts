// Pure domain model types. Framework-free: no Next, React, or Supabase imports.
// DB rows (snake_case) are mapped onto these (camelCase) at the repository
// boundary in src/lib/db/*.

export type EventKind = 'over_under' | 'yes_no' | 'multiple_choice' | 'closest';
export type PayoutMode = 'fixed' | 'pool';
export type Outcome = 'won' | 'lost' | 'push';
export type EventStatus = 'open' | 'settled';

export const STARTING_BALANCE = 1000;

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  over_under: 'Over / Under',
  yes_no: 'Yes / No',
  multiple_choice: 'Multiple choice',
  closest: 'Closest guess',
};

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
  kind: EventKind;
  payoutMode: PayoutMode;
  /** Over/Under threshold; null for other kinds. */
  line: number | null;
  /** Multiple-choice options; null for other kinds. */
  options: string[] | null;
  /** Used in `fixed` payout mode (winning stake returns stake × this). */
  payoutMultiplier: number;
  status: EventStatus;
  /** Numeric result (over_under, closest). */
  result: number | null;
  /** Categorical result (yes_no → 'yes'/'no', multiple_choice → option). */
  resultText: string | null;
  createdBy: string;
  settledBy: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface Wager {
  id: string;
  eventId: string;
  playerId: string;
  /** Categorical choice: over/under, yes/no, or a multiple-choice option. */
  pick: string | null;
  /** Numeric guess (closest-guess events). */
  guess: number | null;
  stake: number;
  outcome: Outcome | null;
  payout: number | null;
  createdAt: string;
}
