import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BetForm } from '../../components/bet-form';
import { Coins } from '../../components/coins-badge';
import { primaryButtonClass } from '../../components/primary-button';
import { ShareButton } from '../../components/share-button';
import { formatCoins } from '../../domain/coins';
import type { Wager } from '../../domain/types';
import { listEvents } from '../../lib/db/events';
import { listAllWagers } from '../../lib/db/wagers';
import { currentPlayer } from '../../lib/session';

export const dynamic = 'force-dynamic';

export default async function PlayPage() {
  const player = await currentPlayer();
  if (!player) redirect('/');

  const [events, wagers] = await Promise.all([listEvents(), listAllWagers()]);
  const open = events.filter((e) => e.status === 'open');
  const settled = events.filter((e) => e.status === 'settled').slice(0, 8);

  const myWager = (eventId: string): Wager | null =>
    wagers.find((w) => w.eventId === eventId && w.playerId === player.id) ?? null;
  const betCount = (eventId: string): number => wagers.filter((w) => w.eventId === eventId).length;

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-lg">
            Hey {player.emoji} {player.name}!
          </h1>
          <p className="text-on-surface-variant flex items-center gap-2">
            Your bankroll: <Coins amount={player.balance} />
          </p>
        </div>
        <Link href="/events/new" className={primaryButtonClass()}>
          ➕ New event
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-headline-sm">Open bets</h2>
        {open.length === 0 ? (
          <p className="border-outline text-on-surface-variant rounded-xl border border-dashed p-6 text-center">
            Nothing to bet on yet.{' '}
            <Link href="/events/new" className="text-primary underline">
              Post the first event
            </Link>
            !
          </p>
        ) : (
          <ul className="space-y-4">
            {open.map((event) => {
              const mine = myWager(event.id);
              return (
                <li
                  key={event.id}
                  className="border-outline bg-surface-container space-y-3 rounded-2xl border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/events/${event.id}`}
                        className="text-title-lg hover:text-primary"
                      >
                        {event.title}
                      </Link>
                      {event.description ? (
                        <p className="text-on-surface-variant text-sm">{event.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-on-surface-variant text-xs whitespace-nowrap">
                        {betCount(event.id)} bet{betCount(event.id) === 1 ? '' : 's'}
                      </span>
                      <ShareButton
                        path={`/events/${event.id}`}
                        title={`Corgi Casinos: ${event.title}`}
                        text={`🐶 Bet OVER or UNDER on "${event.title}" (line ${event.line} ${event.unit}) — Corgi Casinos`}
                      />
                    </div>
                  </div>

                  {mine ? (
                    <p className="text-sm">
                      Your bet:{' '}
                      <span className={mine.direction === 'over' ? 'text-over' : 'text-under'}>
                        {mine.direction.toUpperCase()} {event.line}
                      </span>{' '}
                      for {formatCoins(mine.stake)} 🪙
                    </p>
                  ) : null}

                  <BetForm
                    eventId={event.id}
                    unit={event.unit}
                    line={event.line}
                    payoutMultiplier={event.payoutMultiplier}
                    current={mine ? { direction: mine.direction, stake: mine.stake } : null}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {settled.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-headline-sm">Recently settled</h2>
          <ul className="space-y-2">
            {settled.map((event) => {
              const mine = myWager(event.id);
              return (
                <li
                  key={event.id}
                  className="border-outline bg-surface-container flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                >
                  <Link href={`/events/${event.id}`} className="hover:text-primary">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-on-surface-variant">
                      {' '}
                      — final {event.result} {event.unit}
                    </span>
                  </Link>
                  <OutcomeBadge wager={mine} stake={mine?.stake ?? 0} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function OutcomeBadge({ wager, stake }: { wager: Wager | null; stake: number }) {
  if (!wager || wager.outcome === null) {
    return <span className="text-on-surface-variant text-xs">no bet</span>;
  }
  if (wager.outcome === 'push') {
    return <span className="text-on-surface-variant text-xs">push (refunded)</span>;
  }
  if (wager.outcome === 'won') {
    const net = (wager.payout ?? 0) - stake;
    return <span className="text-success text-xs font-semibold">won +{formatCoins(net)} 🪙</span>;
  }
  return <span className="text-error text-xs font-semibold">lost −{formatCoins(stake)} 🪙</span>;
}
