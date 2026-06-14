import { redirect } from 'next/navigation';

import { listPlayers } from '../lib/db/players';
import { currentPlayer } from '../lib/session';
import { LoginScreen } from './_components/login-screen';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const player = await currentPlayer();
  if (player) redirect('/play');

  const roster = (await listPlayers()).map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    hasPin: p.pin !== null,
  }));

  return <LoginScreen roster={roster} />;
}
