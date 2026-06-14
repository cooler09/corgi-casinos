'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { settle } from '../../domain/settlement';
import type { Direction } from '../../domain/types';
import { validateWager, WAGER_ERROR_MESSAGES } from '../../domain/wager-rules';
import { createEvent, getEvent, markEventSettled } from '../../lib/db/events';
import { adjustBalance } from '../../lib/db/players';
import {
  getWager,
  listWagersByEvent,
  setWagerOutcome,
  upsertWager,
} from '../../lib/db/wagers';
import { currentPlayer } from '../../lib/session';

type ActionResult = { error: string } | { ok: true };

function revalidateEvent(eventId: string): void {
  revalidatePath('/play');
  revalidatePath('/scoreboard');
  revalidatePath(`/events/${eventId}`);
}

/** Place or replace the current player's OVER/UNDER bet on an open event. */
export async function placeWagerAction(
  eventId: string,
  direction: Direction,
  stake: number,
): Promise<ActionResult> {
  const player = await currentPlayer();
  if (!player) return { error: 'Log in first.' };

  const event = await getEvent(eventId);
  if (!event) return { error: 'That event no longer exists.' };

  const existing = await getWager(eventId, player.id);
  const existingStake = existing?.stake ?? 0;

  const validation = validateWager({ event, player, stake, existingStake });
  if (validation) return { error: WAGER_ERROR_MESSAGES[validation] };

  // Stake is escrowed: refund any prior escrow, then debit the new stake.
  await adjustBalance(player.id, existingStake - stake);
  await upsertWager({ eventId, playerId: player.id, direction, stake });

  revalidateEvent(eventId);
  return { ok: true };
}

/** Settle an open event with its real result, awarding payouts to winners. */
export async function settleEventAction(eventId: string, result: number): Promise<ActionResult> {
  const player = await currentPlayer();
  if (!player) return { error: 'Log in first.' };

  const event = await getEvent(eventId);
  if (!event) return { error: 'That event no longer exists.' };
  if (event.status !== 'open') return { error: 'This event is already settled.' };

  const wagers = await listWagersByEvent(eventId);
  const settlements = settle(event.line, result, event.payoutMultiplier, wagers);

  for (const s of settlements) {
    if (s.payout > 0) await adjustBalance(wagerPlayerId(wagers, s.wagerId), s.payout);
    await setWagerOutcome(s.wagerId, s.outcome, s.payout);
  }

  await markEventSettled(eventId, result, player.id);

  revalidateEvent(eventId);
  return { ok: true };
}

function wagerPlayerId(
  wagers: ReadonlyArray<{ id: string; playerId: string }>,
  wagerId: string,
): string {
  const w = wagers.find((x) => x.id === wagerId);
  if (!w) throw new Error('Settlement referenced an unknown wager');
  return w.playerId;
}

/** Create a new over/under event, then go to its page. */
export async function createEventAction(input: {
  title: string;
  description: string;
  unit: string;
  line: number;
  payoutMultiplier: number;
}): Promise<{ error: string } | void> {
  const player = await currentPlayer();
  if (!player) return { error: 'Log in first.' };

  const title = input.title.trim();
  if (!title) return { error: 'Give the event a title.' };

  const event = await createEvent({
    title,
    description: input.description.trim() || null,
    unit: input.unit.trim() || 'points',
    line: input.line,
    payoutMultiplier: input.payoutMultiplier,
    createdBy: player.id,
  });

  revalidatePath('/play');
  redirect(`/events/${event.id}`);
}
