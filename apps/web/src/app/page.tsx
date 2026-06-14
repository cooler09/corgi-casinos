import { redirect } from 'next/navigation';

import { listPlayers } from '../lib/db/players';
import { safeRedirectPath } from '../lib/navigation';
import { currentPlayer } from '../lib/session';
import { LoginScreen } from './_components/login-screen';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // A shared link (e.g. /events/123) bounces logged-out visitors here with ?next=…
  const next = safeRedirectPath((await searchParams).next);

  const player = await currentPlayer();
  if (player) redirect(next);

  // PINs are public in this family game, so it's fine to send them to the client.
  const roster = (await listPlayers()).map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    pin: p.pin,
  }));

  return <LoginScreen roster={roster} next={next} />;
}
