import { redirect } from 'next/navigation';

import { listPlayers } from '../../lib/db/players';
import { currentPlayer } from '../../lib/session';
import { RosterManager } from './_components/roster-manager';

export const dynamic = 'force-dynamic';

export default async function RosterPage() {
  const player = await currentPlayer();
  if (!player) redirect('/');

  const members = (await listPlayers()).map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    balance: p.balance,
    pin: p.pin,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg">Family &amp; friends roster</h1>
        <p className="text-on-surface-variant">
          Add family or friends and manage PINs. New players start with 1,000 🪙.
        </p>
      </div>
      <RosterManager members={members} />
    </div>
  );
}
