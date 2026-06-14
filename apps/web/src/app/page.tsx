import { redirect } from 'next/navigation';

import { listPlayers } from '../lib/db/players';
import { currentPlayer } from '../lib/session';
import { LoginScreen } from './_components/login-screen';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const player = await currentPlayer();
  if (player) redirect('/play');

  // PINs are public in this family game, so it's fine to send them to the client.
  const roster = (await listPlayers()).map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    pin: p.pin,
  }));

  return <LoginScreen roster={roster} />;
}
