'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createPlayer, getPlayer, getPlayerByName, setPlayerPin } from '../lib/db/players';
import { clearCurrentPlayer, setCurrentPlayer } from '../lib/session';

// PINs are not secret here — they're a public "tap to confirm it's you" gate for
// a family game, shown openly in the UI. Keep them short and forgiving: 1–4 digits.
const PIN_PATTERN = /^\d{1,4}$/;

/** Log in as a roster member, checking the PIN if one is set. */
export async function loginAction(
  playerId: string,
  pin: string,
): Promise<{ error: string } | void> {
  const player = await getPlayer(playerId);
  if (!player) return { error: 'That player no longer exists.' };
  if (player.pin && player.pin !== pin.trim()) return { error: 'Incorrect PIN.' };
  await setCurrentPlayer(player.id);
  redirect('/play');
}

export async function logoutAction(): Promise<void> {
  await clearCurrentPlayer();
  redirect('/');
}

/** Add a family member to the roster. */
export async function createPlayerAction(input: {
  name: string;
  emoji: string;
  pin: string;
}): Promise<{ error: string } | { ok: true; id: string }> {
  const name = input.name.trim();
  if (!name) return { error: 'Enter a name.' };
  if (name.length > 24) return { error: 'That name is a bit long.' };

  const pin = input.pin.trim();
  if (pin && !PIN_PATTERN.test(pin)) return { error: 'PIN must be 1–4 digits.' };

  const existing = await getPlayerByName(name);
  if (existing) return { error: 'Someone already has that name.' };

  const emoji = input.emoji.trim() || '🐶';
  const player = await createPlayer({ name, emoji, pin: pin || null });

  revalidatePath('/');
  revalidatePath('/roster');
  return { ok: true, id: player.id };
}

/** Set or clear a member's PIN (empty string clears it). */
export async function setPinAction(
  playerId: string,
  pin: string,
): Promise<{ error: string } | { ok: true }> {
  const trimmed = pin.trim();
  if (trimmed && !PIN_PATTERN.test(trimmed)) return { error: 'PIN must be 1–4 digits.' };
  await setPlayerPin(playerId, trimmed || null);
  revalidatePath('/roster');
  return { ok: true };
}
