import { db } from '../supabase/server';

// "The House" is the universal betting counterparty: at settlement it funds every
// winning payout and keeps every losing stake. A single row (id = true) holds its
// running balance, which MAY go negative — a large fixed-odds win is coins the
// House owes. It's reconciled in settleEventAction.

export async function getHouseBalance(): Promise<number> {
  const { data, error } = await db().from('house').select('balance').eq('id', true).single();
  if (error) throw new Error(error.message);
  return data.balance;
}

/** Read-modify-write the House balance by a signed delta; returns the new balance. */
export async function adjustHouseBalance(delta: number): Promise<number> {
  const current = await getHouseBalance();
  const next = current + delta;
  const { error } = await db()
    .from('house')
    .update({ balance: next, updated_at: new Date().toISOString() })
    .eq('id', true);
  if (error) throw new Error(error.message);
  return next;
}
