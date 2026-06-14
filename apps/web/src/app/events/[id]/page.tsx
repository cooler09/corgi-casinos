import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { BetForm } from '../../../components/bet-form';
import { ShareButton } from '../../../components/share-button';
import { formatCoins } from '../../../domain/coins';
import type { Player, Wager } from '../../../domain/types';
import { getEvent } from '../../../lib/db/events';
import { listPlayers } from '../../../lib/db/players';
import { listWagersByEvent } from '../../../lib/db/wagers';
import { currentPlayer } from '../../../lib/session';
import { SettleForm } from './_components/settle-form';

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await currentPlayer();
  // Preserve the destination so a shared link lands here after login.
  if (!player) redirect(`/?next=${encodeURIComponent(`/events/${id}`)}`);

  const event = await getEvent(id);
  if (!event) notFound();

  const [wagers, players] = await Promise.all([listWagersByEvent(id), listPlayers()]);
  const byId = new Map<string, Player>(players.map((p) => [p.id, p]));
  const mine = wagers.find((w) => w.playerId === player.id) ?? null;
  const isOpen = event.status === 'open';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href="/play" className="text-on-surface-variant hover:text-primary text-sm">
              ← Back to play
            </Link>
            <h1 className="text-headline-lg mt-1">{event.title}</h1>
          </div>
          <ShareButton
            path={`/events/${event.id}`}
            title={`Corgi Casinos: ${event.title}`}
            text={`🐶 Bet OVER or UNDER on "${event.title}" (line ${event.line} ${event.unit}) — Corgi Casinos`}
          />
        </div>
        {event.description ? <p className="text-on-surface-variant">{event.description}</p> : null}
        <p className="text-on-surface-variant mt-2 text-sm">
          Line <span className="text-on-surface font-semibold">{event.line}</span> {event.unit} ·
          payout {event.payoutMultiplier}× ·{' '}
          {isOpen ? (
            <span className="text-primary">open for bets</span>
          ) : (
            <span>
              settled — final <span className="text-on-surface font-semibold">{event.result}</span>{' '}
              {event.unit}
            </span>
          )}
        </p>
      </div>

      {isOpen ? (
        <section className="border-outline bg-surface-container space-y-3 rounded-2xl border p-4">
          <h2 className="text-title-lg">Your bet</h2>
          <BetForm
            eventId={event.id}
            unit={event.unit}
            line={event.line}
            payoutMultiplier={event.payoutMultiplier}
            current={mine ? { direction: mine.direction, stake: mine.stake } : null}
          />
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-title-lg">
          {wagers.length} bet{wagers.length === 1 ? '' : 's'} on the table
        </h2>
        {wagers.length === 0 ? (
          <p className="text-on-surface-variant">No bets yet.</p>
        ) : (
          <ul className="divide-outline border-outline divide-y overflow-hidden rounded-xl border">
            {wagers.map((w) => (
              <WagerRow key={w.id} wager={w} player={byId.get(w.playerId)} settled={!isOpen} />
            ))}
          </ul>
        )}
      </section>

      {isOpen ? <SettleForm eventId={event.id} unit={event.unit} /> : null}
    </div>
  );
}

function WagerRow({
  wager,
  player,
  settled,
}: {
  wager: Wager;
  player: Player | undefined;
  settled: boolean;
}) {
  return (
    <li className="bg-surface-container flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex items-center gap-2">
        <span aria-hidden>{player?.emoji ?? '🐶'}</span>
        <span className="font-medium">{player?.name ?? 'Unknown'}</span>
        <span className={wager.direction === 'over' ? 'text-over' : 'text-under'}>
          {wager.direction.toUpperCase()}
        </span>
        <span className="text-on-surface-variant">{formatCoins(wager.stake)} 🪙</span>
      </span>
      {settled ? <SettledOutcome wager={wager} /> : null}
    </li>
  );
}

function SettledOutcome({ wager }: { wager: Wager }) {
  if (wager.outcome === 'won') {
    const net = (wager.payout ?? 0) - wager.stake;
    return <span className="text-success text-sm font-semibold">won +{formatCoins(net)} 🪙</span>;
  }
  if (wager.outcome === 'push') {
    return <span className="text-on-surface-variant text-sm">push</span>;
  }
  return (
    <span className="text-error text-sm font-semibold">lost −{formatCoins(wager.stake)} 🪙</span>
  );
}
