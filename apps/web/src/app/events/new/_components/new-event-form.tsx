'use client';

import { useState, useTransition } from 'react';

import { Alert } from '../../../../components/alert';
import {
  fieldHintClass,
  fieldInputClass,
  fieldLabelClass,
} from '../../../../components/field-styles';
import { primaryButtonClass } from '../../../../components/primary-button';
import { parseMultiplier, parseNumeric } from '../../../../domain/coins';
import { createEventAction } from '../../actions';

export function NewEventForm() {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('points');
  const [line, setLine] = useState('');
  const [multiplier, setMultiplier] = useState('2');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!title.trim()) {
      setError('Give the event a title.');
      return;
    }
    const parsedLine = parseNumeric(line);
    if (parsedLine === null) {
      setError('Enter a number for the line (e.g. 2.5).');
      return;
    }
    const parsedMultiplier = parseMultiplier(multiplier);
    if (parsedMultiplier === null) {
      setError('Payout multiplier must be a number greater than 1 (2 = even money).');
      return;
    }
    startTransition(async () => {
      const res = await createEventAction({
        title,
        description,
        unit,
        line: parsedLine,
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
      className="space-y-4"
    >
      {error ? <Alert variant="error">{error}</Alert> : null}

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
        <p className={fieldHintClass}>
          A winning bet returns stake × this. 2 = even money; 3 = triple your coins.
        </p>
      </div>

      <button type="submit" className={primaryButtonClass()} disabled={pending}>
        Post event
      </button>
    </form>
  );
}
