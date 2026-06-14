import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BetForm } from '../../../components/bet-form';
import { primaryButtonClass } from '../../../components/primary-button';
import { ShareButton } from '../../../components/share-button';
import { formatCoins } from '../../../domain/coins';
import { payoutLabel, summarizeBet } from '../../../domain/describe';
import type { BettingEvent, Player, Wager } from '../../../domain/types';
import { getEvent } from '../../../lib/db/events';
import { listPlayers } from '../../../lib/db/players';
import { listWagersByEvent } from '../../../lib/db/wagers';
import { currentPlayer } from '../../../lib/session';
import { SettleForm } from './_components/settle-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: 'Corgi Casinos' };

  const description = `${summarizeBet(event)} · ${payoutLabel(event)} — bet fake coins with family & friends on Corgi Casinos.`;
  return {
    title: `${event.title} · Corgi Casinos`,
    description,
    openGraph: { title: event.title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title: event.title, description },
  };
}

function describeResult(event: BettingEvent): string {
  if (event.kind === 'yes_no') return (event.resultText ?? '').toUpperCase();
  if (event.kind === 'multiple_choice') return event.resultText ?? '';
  return `${event.result} ${event.unit}`;
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Public preview: don't redirect logged-out visitors (so shared links unfurl
  // and the page is viewable). The bet/settle actions are gated below.
  const player = await currentPlayer();

  const event = await getEvent(id);
  if (!event) notFound();

  const [wagers, players] = await Promise.all([listWagersByEvent(id), listPlayers()]);
  const byId = new Map<string, Player>(players.map((p) => [p.id, p]));
  const mine = player ? (wagers.find((w) => w.playerId === player.id) ?? null) : null;
  const isOpen = event.status === 'open';
  const loginHref = `/?next=${encodeURIComponent(`/events/${event.id}`)}`;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={player ? '/play' : '/'}
              className="text-on-surface-variant hover:text-primary text-sm"
            >
              ← {player ? 'Back to play' : 'Home'}
            </Link>
            <h1 className="text-headline-lg mt-1">{event.title}</h1>
          </div>
          <ShareButton
            path={`/events/${event.id}`}
            title={event.title}
            text={`${summarizeBet(event)} — place your bet on Corgi Casinos 🐶`}
          />
        </div>
        {event.description ? <p className="text-on-surface-variant">{event.description}</p> : null}
        <p className="text-on-surface-variant mt-2 text-sm">
          {summarizeBet(event)} · {payoutLabel(event)} ·{' '}
          {isOpen ? (
            <span className="text-primary">open for bets</span>
          ) : (
            <span>
              settled —{' '}
              <span className="text-on-surface font-semibold">{describeResult(event)}</span>
            </span>
          )}
        </p>
      </div>

      {player ? (
        isOpen ? (
          <section className="border-outline bg-surface-container space-y-3 rounded-2xl border p-4">
            <h2 className="text-title-lg">Your bet</h2>
            <BetForm
              eventId={event.id}
              kind={event.kind}
              payoutMode={event.payoutMode}
              unit={event.unit}
              line={event.line}
              options={event.options}
              payoutMultiplier={event.payoutMultiplier}
              current={mine ? { pick: mine.pick, guess: mine.guess, stake: mine.stake } : null}
            />
          </section>
        ) : null
      ) : (
        <section className="border-outline bg-surface-container space-y-3 rounded-2xl border p-4 text-center">
          <p className="text-on-surface-variant">Want in on this one?</p>
          <Link href={loginHref} className={primaryButtonClass()}>
            🐶 Pick your player to bet
          </Link>
        </section>
      )}

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

      {player && isOpen ? (
        <SettleForm
          eventId={event.id}
          kind={event.kind}
          unit={event.unit}
          options={event.options}
        />
      ) : null}
    </div>
  );
}

function PickBadge({ wager }: { wager: Wager }) {
  if (wager.guess !== null) {
    return <span className="text-on-surface">guessed {wager.guess}</span>;
  }
  const pick = wager.pick ?? '';
  if (pick === 'over' || pick === 'yes') {
    return <span className="text-over">{pick.toUpperCase()}</span>;
  }
  if (pick === 'under' || pick === 'no') {
    return <span className="text-under">{pick.toUpperCase()}</span>;
  }
  return <span className="text-on-surface">{pick}</span>;
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
        <PickBadge wager={wager} />
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
