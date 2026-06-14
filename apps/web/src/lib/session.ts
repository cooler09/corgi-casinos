import { cache } from 'react';

import { cookies } from 'next/headers';

import type { Player } from '../domain/types';
import { getPlayer } from './db/players';

// "Login" is intentionally lightweight: we store the chosen player's id in an
// httpOnly cookie. There is no real authentication — see docs and the schema.
const COOKIE = 'corgi_player';
const ONE_YEAR = 60 * 60 * 24 * 365;

// Wrapped in React `cache` so the layout and the page share one lookup per request.
export const currentPlayer = cache(async (): Promise<Player | null> => {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (!id) return null;
  return getPlayer(id);
});

export async function setCurrentPlayer(id: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR,
  });
}

export async function clearCurrentPlayer(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
