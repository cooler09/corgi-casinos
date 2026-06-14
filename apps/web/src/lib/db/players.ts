import type { Player } from '../../domain/types';
import { db } from '../supabase/server';
import type { Database } from '../supabase/types';

type PlayerRow = Database['public']['Tables']['players']['Row'];

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    pin: row.pin,
    balance: row.balance,
    createdAt: row.created_at,
  };
}

export async function listPlayers(): Promise<Player[]> {
  const { data, error } = await db().from('players').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toPlayer);
}

export async function getPlayer(id: string): Promise<Player | null> {
  const { data, error } = await db().from('players').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPlayer(data) : null;
}

/** Case-insensitive name lookup, used to keep the roster free of duplicates. */
export async function getPlayerByName(name: string): Promise<Player | null> {
  const { data, error } = await db()
    .from('players')
    .select('*')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPlayer(data) : null;
}

export async function createPlayer(input: {
  name: string;
  emoji: string;
  pin: string | null;
}): Promise<Player> {
  const { data, error } = await db()
    .from('players')
    .insert({ name: input.name, emoji: input.emoji, pin: input.pin })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return toPlayer(data);
}

export async function setPlayerPin(id: string, pin: string | null): Promise<void> {
  const { error } = await db().from('players').update({ pin }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Read-modify-write a balance by a signed delta; returns the new balance. */
export async function adjustBalance(id: string, delta: number): Promise<number> {
  const player = await getPlayer(id);
  if (!player) throw new Error('Player not found');
  const next = player.balance + delta;
  const { error } = await db().from('players').update({ balance: next }).eq('id', id);
  if (error) throw new Error(error.message);
  return next;
}
