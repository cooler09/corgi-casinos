import { redirect } from 'next/navigation';

import { Coins } from '../../components/coins-badge';
import { STARTING_BALANCE } from '../../domain/types';
import { getHouseBalance } from '../../lib/db/house';
import { listPlayers } from '../../lib/db/players';
import { listAllWagers } from '../../lib/db/wagers';
import { currentPlayer } from '../../lib/session';

export const dynamic = 'force-dynamic';

const MEDALS = ['🥇', '🥈', '🥉'];

export default async function ScoreboardPage() {
  const player = await currentPlayer();
  if (!player) redirect('/');

  const [players, wagers, houseBalance] = await Promise.all([
    listPlayers(),
    listAllWagers(),
    getHouseBalance(),
  ]);

  const ranked = players
    .map((p) => {
      const settled = wagers.filter((w) => w.playerId === p.id && w.outcome !== null);
      return {
        ...p,
        wins: settled.filter((w) => w.outcome === 'won').length,
        losses: settled.filter((w) => w.outcome === 'lost').length,
        pushes: settled.filter((w) => w.outcome === 'push').length,
        net: p.balance - STARTING_BALANCE,
      };
    })
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-6">
      <h1 className="text-headline-lg">🏆 Scoreboard</h1>

      <div className="border-outline bg-surface-container-high flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <span className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            🏦
          </span>
          <span>
            <span className="font-semibold">The House</span>
            <span className="text-on-surface-variant block text-xs">
              all-time take{' '}
              <span className={houseBalance >= 0 ? 'text-success' : 'text-error'}>
                {houseBalance >= 0 ? '+' : '−'}
                {Math.abs(houseBalance).toLocaleString('en-US')}
              </span>
            </span>
          </span>
        </span>
        <Coins amount={houseBalance} />
      </div>

      {ranked.length === 0 ? (
        <p className="text-on-surface-variant">No players yet.</p>
      ) : (
        <ol className="space-y-2">
          {ranked.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                p.id === player.id
                  ? 'border-primary bg-primary-container/40'
                  : 'border-outline bg-surface-container'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-center text-lg" aria-hidden>
                  {MEDALS[i] ?? i + 1}
                </span>
                <span className="text-2xl" aria-hidden>
                  {p.emoji}
                </span>
                <span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-on-surface-variant block text-xs">
                    {p.wins}W · {p.losses}L{p.pushes > 0 ? ` · ${p.pushes}P` : ''} ·{' '}
                    <span className={p.net >= 0 ? 'text-success' : 'text-error'}>
                      {p.net >= 0 ? '+' : '−'}
                      {Math.abs(p.net).toLocaleString('en-US')} all-time
                    </span>
                  </span>
                </span>
              </span>
              <Coins amount={p.balance} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
