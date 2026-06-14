'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { Alert } from '../../../../components/alert';
import { fieldInputClass, fieldLabelClass } from '../../../../components/field-styles';
import { primaryButtonClass } from '../../../../components/primary-button';
import { parseNumeric } from '../../../../domain/coins';
import type { EventKind } from '../../../../domain/types';
import { settleEventAction } from '../../actions';

export function SettleForm({
  eventId,
  kind,
  unit,
  options,
}: {
  eventId: string;
  kind: EventKind;
  unit: string;
  options: string[] | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState('');
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const numeric = kind === 'over_under' || kind === 'closest';

  function submit() {
    setError(null);

    let outcome: { result: number | null; resultText: string | null };
    let summary: string;

    if (numeric) {
      const n = parseNumeric(result);
      if (n === null) {
        setError('Enter the final number.');
        return;
      }
      outcome = { result: n, resultText: null };
      summary = `${n} ${unit}`;
    } else {
      if (!text) {
        setError(kind === 'yes_no' ? 'Choose YES or NO.' : 'Choose the winning option.');
        return;
      }
      outcome = { result: null, resultText: text };
      summary = text;
    }

    if (!window.confirm(`Settle with "${summary}"? This pays out winners and can't be undone.`)) {
      return;
    }

    startTransition(async () => {
      const res = await settleEventAction(eventId, outcome);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const choices = kind === 'yes_no' ? ['yes', 'no'] : (options ?? []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-outline bg-surface-container-high space-y-3 rounded-2xl border p-4"
    >
      <h2 className="text-title-lg">Settle this event</h2>
      {error ? <Alert variant="error">{error}</Alert> : null}

      {numeric ? (
        <div>
          <label className={fieldLabelClass} htmlFor="result">
            Final result ({unit})
          </label>
          <div className="flex items-end gap-2">
            <input
              id="result"
              inputMode="decimal"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className={fieldInputClass}
            />
            <button type="submit" className={primaryButtonClass()} disabled={pending}>
              Settle &amp; pay out
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <span className={fieldLabelClass}>Winning {kind === 'yes_no' ? 'answer' : 'option'}</span>
          <div className="grid grid-cols-2 gap-2">
            {choices.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={text === opt}
                onClick={() => setText(opt)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  text === opt
                    ? 'border-primary bg-primary-container text-on-primary-container'
                    : 'border-outline text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {kind === 'yes_no' ? opt.toUpperCase() : opt}
              </button>
            ))}
          </div>
          <button type="submit" className={primaryButtonClass()} disabled={pending}>
            Settle &amp; pay out
          </button>
        </div>
      )}
    </form>
  );
}
