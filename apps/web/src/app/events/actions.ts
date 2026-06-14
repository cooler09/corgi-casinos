'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { settle } from '../../domain/settlement';
import type { BettingEvent, EventKind, PayoutMode } from '../../domain/types';
import { validateWager, WAGER_ERROR_MESSAGES } from '../../domain/wager-rules';
import { createEvent, getEvent, markEventSettled } from '../../lib/db/events';
import { adjustBalance } from '../../lib/db/players';
import { getWager, listWagersByEvent, setWagerOutcome, upsertWager } from '../../lib/db/wagers';
import { currentPlayer } from '../../lib/session';

type ActionResult = { error: string } | { ok: true };

// Local (not exported) — a "use server" module may only export async functions.
type Selection = { pick: string | null; guess: number | null };
type SettleResult = { result: number | null; resultText: string | null };

function revalidateEvent(eventId: string): void {
  revalidatePath('/play');
  revalidatePath('/scoreboard');
  revalidatePath(`/events/${eventId}`);
}

/** Validate that a wager's selection fits the event kind. */
function validateSelection(event: BettingEvent, sel: Selection): string | null {
  switch (event.kind) {
    case 'over_under':
      return sel.pick === 'over' || sel.pick === 'under' ? null : 'Pick OVER or UNDER first.';
    case 'yes_no':
      return sel.pick === 'yes' || sel.pick === 'no' ? null : 'Pick YES or NO first.';
    case 'multiple_choice':
      return event.options?.includes(sel.pick ?? '') ? null : 'Pick one of the options.';
    case 'closest':
      return sel.guess !== null && Number.isFinite(sel.guess) ? null : 'Enter your guess.';
  }
}

/** Validate that a settle result fits the event kind. */
function validateResult(event: BettingEvent, outcome: SettleResult): string | null {
  switch (event.kind) {
    case 'over_under':
    case 'closest':
      return outcome.result !== null && Number.isFinite(outcome.result)
        ? null
        : 'Enter the final number.';
    case 'yes_no':
      return outcome.resultText === 'yes' || outcome.resultText === 'no'
        ? null
        : 'Choose YES or NO.';
    case 'multiple_choice':
      return event.options?.includes(outcome.resultText ?? '')
        ? null
        : 'Choose the winning option.';
  }
}

/** Place or replace the current player's bet on an open event. */
export async function placeWagerAction(
  eventId: string,
  selection: Selection,
  stake: number,
): Promise<ActionResult> {
  const player = await currentPlayer();
  if (!player) return { error: 'Log in first.' };

  const event = await getEvent(eventId);
  if (!event) return { error: 'That event no longer exists.' };

  const selectionError = validateSelection(event, selection);
  if (selectionError) return { error: selectionError };

  const existing = await getWager(eventId, player.id);
  const existingStake = existing?.stake ?? 0;

  const validation = validateWager({ event, player, stake, existingStake });
  if (validation) return { error: WAGER_ERROR_MESSAGES[validation] };

  // Stake is escrowed: refund any prior escrow, then debit the new stake.
  await adjustBalance(player.id, existingStake - stake);
  await upsertWager({
    eventId,
    playerId: player.id,
    pick: selection.pick,
    guess: selection.guess,
    stake,
  });

  revalidateEvent(eventId);
  return { ok: true };
}

/** Settle an open event with its result, awarding payouts to winners. */
export async function settleEventAction(
  eventId: string,
  outcome: SettleResult,
): Promise<ActionResult> {
  const player = await currentPlayer();
  if (!player) return { error: 'Log in first.' };

  const event = await getEvent(eventId);
  if (!event) return { error: 'That event no longer exists.' };
  if (event.status !== 'open') return { error: 'This event is already settled.' };

  const resultError = validateResult(event, outcome);
  if (resultError) return { error: resultError };

  const wagers = await listWagersByEvent(eventId);
  const settlements = settle(
    { ...event, result: outcome.result, resultText: outcome.resultText },
    wagers,
  );

  for (const s of settlements) {
    if (s.payout > 0) await adjustBalance(wagerPlayerId(wagers, s.wagerId), s.payout);
    await setWagerOutcome(s.wagerId, s.outcome, s.payout);
  }

  await markEventSettled(eventId, {
    result: outcome.result,
    resultText: outcome.resultText,
    settledBy: player.id,
  });

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

/** Create a new event of any kind, then go to its page. */
export async function createEventAction(input: {
  title: string;
  description: string;
  kind: EventKind;
  payoutMode: PayoutMode;
  unit: string;
  line: number | null;
  options: string[];
  payoutMultiplier: number;
}): Promise<{ error: string } | void> {
  const player = await currentPlayer();
  if (!player) return { error: 'Log in first.' };

  const title = input.title.trim();
  if (!title) return { error: 'Give the event a title.' };

  let line: number | null = null;
  let options: string[] | null = null;
  let payoutMode = input.payoutMode;

  if (input.kind === 'over_under') {
    if (input.line === null || !Number.isFinite(input.line)) {
      return { error: 'Enter a number for the line (e.g. 2.5).' };
    }
    line = input.line;
  } else if (input.kind === 'multiple_choice') {
    const cleaned = input.options.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) return { error: 'Add at least two options.' };
    options = cleaned;
  } else if (input.kind === 'closest') {
    payoutMode = 'pool'; // closest guess is always a shared pot
  }

  if (payoutMode === 'fixed' && !(input.payoutMultiplier > 1)) {
    return { error: 'Payout multiplier must be greater than 1 (2 = even money).' };
  }

  const event = await createEvent({
    title,
    description: input.description.trim() || null,
    unit: input.unit.trim() || 'points',
    kind: input.kind,
    payoutMode,
    line,
    options,
    payoutMultiplier: input.payoutMultiplier,
    createdBy: player.id,
  });

  revalidatePath('/play');
  redirect(`/events/${event.id}`);
}
