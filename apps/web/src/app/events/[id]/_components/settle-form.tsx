'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { Alert } from '../../../../components/alert';
import { fieldInputClass, fieldLabelClass } from '../../../../components/field-styles';
import { primaryButtonClass } from '../../../../components/primary-button';
import { parseNumeric } from '../../../../domain/coins';
import { settleEventAction } from '../../actions';

export function SettleForm({ eventId, unit }: { eventId: string; unit: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const parsed = parseNumeric(result);
    if (parsed === null) {
      setError('Enter the final number.');
      return;
    }
    if (
      !window.confirm(
        `Settle with a final of ${parsed} ${unit}? This pays out winners and can't be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await settleEventAction(eventId, parsed);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3 rounded-2xl border border-outline bg-surface-container-high p-4"
    >
      <h2 className="text-title-lg">Settle this event</h2>
      {error ? <Alert variant="error">{error}</Alert> : null}
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
    </form>
  );
}
