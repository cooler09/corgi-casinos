'use client';

import { useState, useTransition } from 'react';

import { Alert } from '../../../../components/alert';
import {
  fieldHintClass,
  fieldInputClass,
  fieldLabelClass,
} from '../../../../components/field-styles';
import { primaryButtonClass, secondaryButtonClass } from '../../../../components/primary-button';
import { parseMultiplier, parseNumeric } from '../../../../domain/coins';
import { EVENT_KIND_LABELS, type EventKind, type PayoutMode } from '../../../../domain/types';
import { createEventAction } from '../../actions';

const KINDS: EventKind[] = ['over_under', 'yes_no', 'multiple_choice', 'closest'];

const KIND_HINTS: Record<EventKind, string> = {
  over_under: 'Bet whether a number lands over or under your line.',
  yes_no: 'A simple yes-or-no proposition.',
  multiple_choice: 'Pick the winner from a list of options.',
  closest: 'Everyone guesses a number; closest to the result wins the pot.',
};

function selectableClass(active: boolean): string {
  return `rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
    active
      ? 'border-primary bg-primary-container text-on-primary-container'
      : 'border-outline text-on-surface-variant hover:bg-surface-container-high'
  }`;
}

export function NewEventForm() {
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<EventKind>('over_under');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('points');
  const [line, setLine] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [payoutMode, setPayoutMode] = useState<PayoutMode>('fixed');
  const [multiplier, setMultiplier] = useState('2');
  const [error, setError] = useState<string | null>(null);

  const usesLine = kind === 'over_under';
  const usesOptions = kind === 'multiple_choice';
  const choosesPayout = kind !== 'closest'; // closest is always a shared pot
  const effectiveMode: PayoutMode = choosesPayout ? payoutMode : 'pool';

  function setOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function submit() {
    setError(null);
    if (!title.trim()) {
      setError('Give the event a title.');
      return;
    }

    let parsedLine: number | null = null;
    if (usesLine) {
      const n = parseNumeric(line);
      if (n === null) {
        setError('Enter a number for the line (e.g. 2.5).');
        return;
      }
      parsedLine = n;
    }

    if (usesOptions && options.map((o) => o.trim()).filter(Boolean).length < 2) {
      setError('Add at least two options.');
      return;
    }

    let parsedMultiplier = 2;
    if (effectiveMode === 'fixed') {
      const m = parseMultiplier(multiplier);
      if (m === null) {
        setError('Payout multiplier must be greater than 1 (2 = even money).');
        return;
      }
      parsedMultiplier = m;
    }

    startTransition(async () => {
      const res = await createEventAction({
        title,
        description,
        kind,
        payoutMode: effectiveMode,
        unit,
        line: parsedLine,
        options,
        payoutMultiplier: parsedMultiplier,
      });
      // On success createEventAction redirects to the new event page.
      if (res && 'error' in res) setError(res.error);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5"
    >
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div>
        <span className={fieldLabelClass}>Bet type</span>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={selectableClass(kind === k)}
            >
              {EVENT_KIND_LABELS[k]}
            </button>
          ))}
        </div>
        <p className={fieldHintClass}>{KIND_HINTS[kind]}</p>
      </div>

      <div>
        <label className={fieldLabelClass} htmlFor="title">
          What&apos;s the bet?
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Total goals in tonight's game"
          className={fieldInputClass}
          autoFocus
        />
      </div>

      <div>
        <label className={fieldLabelClass} htmlFor="description">
          Details (optional)
        </label>
        <input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldInputClass}
        />
      </div>

      {usesLine ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabelClass} htmlFor="line">
              Line
            </label>
            <input
              id="line"
              inputMode="decimal"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="2.5"
              className={fieldInputClass}
            />
            <p className={fieldHintClass}>Use a half (e.g. 2.5) to avoid pushes.</p>
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="unit">
              Unit
            </label>
            <input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="points"
              className={fieldInputClass}
            />
          </div>
        </div>
      ) : null}

      {kind === 'closest' ? (
        <div>
          <label className={fieldLabelClass} htmlFor="unit">
            Unit
          </label>
          <input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="minutes"
            className={fieldInputClass}
          />
        </div>
      ) : null}

      {usesOptions ? (
        <div>
          <span className={fieldLabelClass}>Options</span>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className={fieldInputClass}
                />
                {options.length > 2 ? (
                  <button
                    type="button"
                    className={secondaryButtonClass('sm')}
                    onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label="Remove option"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <button
              type="button"
              className={secondaryButtonClass('sm')}
              onClick={() => setOptions((prev) => [...prev, ''])}
            >
              ➕ Add option
            </button>
          </div>
        </div>
      ) : null}

      {choosesPayout ? (
        <div>
          <span className={fieldLabelClass}>Payout</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={payoutMode === 'fixed'}
              onClick={() => setPayoutMode('fixed')}
              className={selectableClass(payoutMode === 'fixed')}
            >
              Fixed odds
            </button>
            <button
              type="button"
              aria-pressed={payoutMode === 'pool'}
              onClick={() => setPayoutMode('pool')}
              className={selectableClass(payoutMode === 'pool')}
            >
              Shared pot
            </button>
          </div>
          <p className={fieldHintClass}>
            {payoutMode === 'fixed'
              ? 'Winners get a multiple of their stake.'
              : 'Winners split all the stakes (pari-mutuel).'}
          </p>
        </div>
      ) : (
        <p className={fieldHintClass}>
          Closest-guess always splits the shared pot among the closest guesses.
        </p>
      )}

      {effectiveMode === 'fixed' ? (
        <div>
          <label className={fieldLabelClass} htmlFor="multiplier">
            Payout multiplier
          </label>
          <input
            id="multiplier"
            inputMode="decimal"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className={fieldInputClass}
          />
          <p className={fieldHintClass}>2 = even money; 3 = triple your coins.</p>
        </div>
      ) : null}

      <button type="submit" className={primaryButtonClass()} disabled={pending}>
        Post event
      </button>
    </form>
  );
}
