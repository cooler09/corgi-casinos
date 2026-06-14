'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { placeWagerAction } from '../app/events/actions';
import { formatCoins, parseCoins } from '../domain/coins';
import type { Direction } from '../domain/types';
import { Alert } from './alert';
import { fieldInputClass } from './field-styles';
import { primaryButtonClass } from './primary-button';

export interface BetFormProps {
  eventId: string;
  unit: string;
  line: number;
  payoutMultiplier: number;
  current: { direction: Direction; stake: number } | null;
}

export function BetForm({ eventId, unit, line, payoutMultiplier, current }: BetFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [direction, setDirection] = useState<Direction | null>(current?.direction ?? null);
  const [stake, setStake] = useState(current ? String(current.stake) : '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const projectedWin =
    direction && parseCoins(stake) !== null
      ? Math.floor(parseCoins(stake)! * payoutMultiplier)
      : null;

  function submit() {
    setError(null);
    setSaved(false);
    if (!direction) {
      setError('Pick OVER or UNDER first.');
      return;
    }
    const parsed = parseCoins(stake);
    if (parsed === null) {
      setError('Enter a whole number of coins greater than zero.');
      return;
    }
    startTransition(async () => {
      const res = await placeWagerAction(eventId, direction, parsed);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <DirectionButton
          active={direction === 'over'}
          accent="over"
          onClick={() => setDirection('over')}
        >
          ▲ OVER {line} {unit}
        </DirectionButton>
        <DirectionButton
          active={direction === 'under'}
          accent="under"
          onClick={() => setDirection('under')}
        >
          ▼ UNDER {line} {unit}
        </DirectionButton>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="sr-only" htmlFor={`stake-${eventId}`}>
            Stake in coins
          </label>
          <input
            id={`stake-${eventId}`}
            inputMode="numeric"
            value={stake}
            onChange={(e) => setStake(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="coins"
            className={fieldInputClass}
          />
        </div>
        <button type="submit" className={primaryButtonClass()} disabled={pending}>
          {current ? 'Update bet' : 'Place bet'}
        </button>
      </div>

      {projectedWin !== null ? (
        <p className="text-xs text-on-surface-variant">
          Wins {formatCoins(projectedWin)} 🪙 if it hits ({payoutMultiplier}× your stake).
        </p>
      ) : null}

      {error ? <Alert variant="error">{error}</Alert> : null}
      {saved ? <Alert variant="success">Bet locked in! Good luck. 🍀</Alert> : null}
    </form>
  );
}

function DirectionButton({
  active,
  accent,
  onClick,
  children,
}: {
  active: boolean;
  accent: 'over' | 'under';
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeClass =
    accent === 'over' ? 'border-over bg-over/15 text-over' : 'border-under bg-under/15 text-under';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
        active ? activeClass : 'border-outline text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      {children}
    </button>
  );
}
