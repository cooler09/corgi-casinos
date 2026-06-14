'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { placeWagerAction } from '../app/events/actions';
import { formatCoins, parseCoins, parseNumeric } from '../domain/coins';
import type { EventKind, PayoutMode } from '../domain/types';
import { Alert } from './alert';
import { fieldInputClass } from './field-styles';
import { primaryButtonClass } from './primary-button';

export interface BetFormProps {
  eventId: string;
  kind: EventKind;
  payoutMode: PayoutMode;
  unit: string;
  line: number | null;
  options: string[] | null;
  payoutMultiplier: number;
  current: { pick: string | null; guess: number | null; stake: number } | null;
}

export function BetForm({
  eventId,
  kind,
  payoutMode,
  unit,
  line,
  options,
  payoutMultiplier,
  current,
}: BetFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pick, setPick] = useState<string | null>(current?.pick ?? null);
  const [guess, setGuess] = useState(current?.guess != null ? String(current.guess) : '');
  const [stake, setStake] = useState(current ? String(current.stake) : '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const stakeCoins = parseCoins(stake);
  const projectedWin =
    payoutMode === 'fixed' && stakeCoins !== null
      ? Math.floor(stakeCoins * payoutMultiplier)
      : null;

  function submit() {
    setError(null);
    setSaved(false);

    let selection: { pick: string | null; guess: number | null };
    if (kind === 'closest') {
      const g = parseNumeric(guess);
      if (g === null) {
        setError('Enter your guess.');
        return;
      }
      selection = { pick: null, guess: g };
    } else {
      if (!pick) {
        setError('Make a pick first.');
        return;
      }
      selection = { pick, guess: null };
    }

    const parsed = parseCoins(stake);
    if (parsed === null) {
      setError('Enter a whole number of coins greater than zero.');
      return;
    }

    startTransition(async () => {
      const res = await placeWagerAction(eventId, selection, parsed);
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
      <SelectionInput
        eventId={eventId}
        kind={kind}
        line={line}
        unit={unit}
        options={options}
        pick={pick}
        onPick={setPick}
        guess={guess}
        onGuess={setGuess}
      />

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

      {payoutMode === 'pool' ? (
        <p className="text-on-surface-variant text-xs">
          Winnings are split from the shared pot among everyone who&apos;s right. 🪙
        </p>
      ) : projectedWin !== null ? (
        <p className="text-on-surface-variant text-xs">
          Wins {formatCoins(projectedWin)} 🪙 if it hits ({payoutMultiplier}× your stake).
        </p>
      ) : (
        <p className="text-on-surface-variant text-xs">
          Winning bets pay {payoutMultiplier}× your stake.
        </p>
      )}

      {error ? <Alert variant="error">{error}</Alert> : null}
      {saved ? <Alert variant="success">Bet locked in! Good luck. 🍀</Alert> : null}
    </form>
  );
}

function SelectionInput({
  eventId,
  kind,
  line,
  unit,
  options,
  pick,
  onPick,
  guess,
  onGuess,
}: {
  eventId: string;
  kind: EventKind;
  line: number | null;
  unit: string;
  options: string[] | null;
  pick: string | null;
  onPick: (value: string) => void;
  guess: string;
  onGuess: (value: string) => void;
}) {
  if (kind === 'closest') {
    return (
      <div>
        <label className="sr-only" htmlFor={`guess-${eventId}`}>
          Your guess
        </label>
        <input
          id={`guess-${eventId}`}
          inputMode="decimal"
          value={guess}
          onChange={(e) => onGuess(e.target.value)}
          placeholder={`your guess (${unit})`}
          className={fieldInputClass}
        />
      </div>
    );
  }

  if (kind === 'multiple_choice') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {(options ?? []).map((opt) => (
          <ChoiceButton key={opt} active={pick === opt} onClick={() => onPick(opt)}>
            {opt}
          </ChoiceButton>
        ))}
      </div>
    );
  }

  const left =
    kind === 'over_under'
      ? { value: 'over', label: `▲ OVER ${line} ${unit}`, accent: 'over' as const }
      : { value: 'yes', label: '✓ YES', accent: 'over' as const };
  const right =
    kind === 'over_under'
      ? { value: 'under', label: `▼ UNDER ${line} ${unit}`, accent: 'under' as const }
      : { value: 'no', label: '✗ NO', accent: 'under' as const };

  return (
    <div className="grid grid-cols-2 gap-2">
      <DirectionButton
        active={pick === left.value}
        accent={left.accent}
        onClick={() => onPick(left.value)}
      >
        {left.label}
      </DirectionButton>
      <DirectionButton
        active={pick === right.value}
        accent={right.accent}
        onClick={() => onPick(right.value)}
      >
        {right.label}
      </DirectionButton>
    </div>
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
        active
          ? activeClass
          : 'border-outline text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      {children}
    </button>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'border-primary bg-primary-container text-on-primary-container'
          : 'border-outline text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      {children}
    </button>
  );
}
