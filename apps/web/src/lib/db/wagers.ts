import type { Outcome, Wager } from '../../domain/types';
import { db } from '../supabase/server';
import type { Database } from '../supabase/types';

type WagerRow = Database['public']['Tables']['wagers']['Row'];

function toWager(row: WagerRow): Wager {
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    pick: row.pick,
    guess: row.guess,
    stake: row.stake,
    outcome: row.outcome as Outcome | null,
    payout: row.payout,
    createdAt: row.created_at,
  };
}

export async function listWagersByEvent(eventId: string): Promise<Wager[]> {
  const { data, error } = await db()
    .from('wagers')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toWager);
}

export async function listAllWagers(): Promise<Wager[]> {
  const { data, error } = await db().from('wagers').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toWager);
}

export async function getWager(eventId: string, playerId: string): Promise<Wager | null> {
  const { data, error } = await db()
    .from('wagers')
    .select('*')
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toWager(data) : null;
}

/** Insert or replace this player's bet on an event (one per player per event). */
export async function upsertWager(input: {
  eventId: string;
  playerId: string;
  pick: string | null;
  guess: number | null;
  stake: number;
}): Promise<Wager> {
  const { data, error } = await db()
    .from('wagers')
    .upsert(
      {
        event_id: input.eventId,
        player_id: input.playerId,
        pick: input.pick,
        guess: input.guess,
        stake: input.stake,
      },
      { onConflict: 'event_id,player_id' },
    )
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return toWager(data);
}

export async function setWagerOutcome(id: string, outcome: Outcome, payout: number): Promise<void> {
  const { error } = await db().from('wagers').update({ outcome, payout }).eq('id', id);
  if (error) throw new Error(error.message);
}
