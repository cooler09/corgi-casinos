import type { BettingEvent, EventStatus } from '../../domain/types';
import { db } from '../supabase/server';
import type { Database } from '../supabase/types';

type EventRow = Database['public']['Tables']['events']['Row'];

function toEvent(row: EventRow): BettingEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    unit: row.unit,
    line: row.line,
    payoutMultiplier: row.payout_multiplier,
    status: row.status as EventStatus,
    result: row.result,
    createdBy: row.created_by,
    settledBy: row.settled_by,
    createdAt: row.created_at,
    settledAt: row.settled_at,
  };
}

export async function listEvents(): Promise<BettingEvent[]> {
  const { data, error } = await db()
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toEvent);
}

export async function getEvent(id: string): Promise<BettingEvent | null> {
  const { data, error } = await db().from('events').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toEvent(data) : null;
}

export async function createEvent(input: {
  title: string;
  description: string | null;
  unit: string;
  line: number;
  payoutMultiplier: number;
  createdBy: string;
}): Promise<BettingEvent> {
  const { data, error } = await db()
    .from('events')
    .insert({
      title: input.title,
      description: input.description,
      unit: input.unit,
      line: input.line,
      payout_multiplier: input.payoutMultiplier,
      created_by: input.createdBy,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return toEvent(data);
}

export async function markEventSettled(
  id: string,
  result: number,
  settledBy: string,
): Promise<void> {
  const { error } = await db()
    .from('events')
    .update({
      status: 'settled',
      result,
      settled_by: settledBy,
      settled_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
