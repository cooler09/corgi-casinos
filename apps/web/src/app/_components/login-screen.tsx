'use client';

import { useState, useTransition } from 'react';

import { Alert } from '../../components/alert';
import { fieldInputClass, fieldLabelClass } from '../../components/field-styles';
import {
  primaryButtonClass,
  secondaryButtonClass,
  tonalButtonClass,
} from '../../components/primary-button';
import { createPlayerAction, loginAction } from '../actions';

interface RosterEntry {
  id: string;
  name: string;
  emoji: string;
  hasPin: boolean;
}

const EMOJI_CHOICES = ['🐶', '🐕', '🦴', '🐾', '👑', '⭐', '🍀', '🎲', '🦊', '🐱', '🐢', '🦄'];

export function LoginScreen({ roster }: { roster: RosterEntry[] }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<RosterEntry | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(roster.length === 0);

  function login(id: string, pinValue: string) {
    setError(null);
    startTransition(async () => {
      const res = await loginAction(id, pinValue);
      // On success loginAction redirects to /play; only failure returns here.
      if (res && 'error' in res) setError(res.error);
    });
  }

  function choose(entry: RosterEntry) {
    setError(null);
    setPin('');
    if (entry.hasPin) {
      setSelected(entry);
    } else {
      login(entry.id, '');
    }
  }

  if (selected) {
    return (
      <PinPrompt
        entry={selected}
        pin={pin}
        onPin={setPin}
        pending={pending}
        error={error}
        onSubmit={() => login(selected.id, pin)}
        onBack={() => {
          setSelected(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-headline-lg">Who&apos;s playing?</h1>
        <p className="text-on-surface-variant">Pick your corgi to jump in.</p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {roster.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {roster.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => choose(entry)}
                className="border-outline bg-surface-container flex w-full flex-col items-center gap-1 rounded-2xl border p-4 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <span className="text-4xl" aria-hidden>
                  {entry.emoji}
                </span>
                <span className="font-semibold">{entry.name}</span>
                {entry.hasPin ? (
                  <span className="text-on-surface-variant text-xs">🔒 PIN</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {adding ? (
        <AddMemberForm
          pending={pending}
          {...(roster.length > 0 ? { onCancel: () => setAdding(false) } : {})}
          onCreate={(input) => {
            setError(null);
            startTransition(async () => {
              const res = await createPlayerAction(input);
              if ('error' in res) {
                setError(res.error);
                return;
              }
              login(res.id, '');
            });
          }}
        />
      ) : (
        <div className="text-center">
          <button type="button" className={tonalButtonClass()} onClick={() => setAdding(true)}>
            ➕ Add a family member
          </button>
        </div>
      )}
    </section>
  );
}

function PinPrompt({
  entry,
  pin,
  onPin,
  pending,
  error,
  onSubmit,
  onBack,
}: {
  entry: RosterEntry;
  pin: string;
  onPin: (value: string) => void;
  pending: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <section className="mx-auto max-w-xs space-y-4 text-center">
      <div className="text-5xl" aria-hidden>
        {entry.emoji}
      </div>
      <h1 className="text-headline-sm">Enter {entry.name}&apos;s PIN</h1>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
      >
        <input
          autoFocus
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          value={pin}
          onChange={(e) => onPin(e.target.value.replace(/\D/g, ''))}
          className={`${fieldInputClass} text-center text-2xl tracking-[0.5em]`}
          aria-label="PIN"
        />
        <div className="flex justify-center gap-2">
          <button type="button" className={secondaryButtonClass()} onClick={onBack}>
            Back
          </button>
          <button type="submit" className={primaryButtonClass()} disabled={pending}>
            Let&apos;s go
          </button>
        </div>
      </form>
    </section>
  );
}

function AddMemberForm({
  pending,
  onCreate,
  onCancel,
}: {
  pending: boolean;
  onCreate: (input: { name: string; emoji: string; pin: string }) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🐶');
  const [pin, setPin] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({ name, emoji, pin });
      }}
      className="border-outline bg-surface-container space-y-4 rounded-2xl border p-4"
    >
      <h2 className="text-title-lg">New family member</h2>

      <div>
        <label className={fieldLabelClass} htmlFor="new-name">
          Name
        </label>
        <input
          id="new-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldInputClass}
          autoFocus
        />
      </div>

      <div>
        <span className={fieldLabelClass}>Pick an emoji</span>
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setEmoji(choice)}
              aria-pressed={emoji === choice}
              className={`rounded-lg border p-2 text-2xl ${
                emoji === choice ? 'border-primary bg-primary-container' : 'border-outline'
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={fieldLabelClass} htmlFor="new-pin">
          PIN (optional, 4 digits)
        </label>
        <input
          id="new-pin"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className={fieldInputClass}
          placeholder="leave blank for no PIN"
        />
      </div>

      <div className="flex gap-2">
        {onCancel ? (
          <button type="button" className={secondaryButtonClass()} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className={primaryButtonClass()} disabled={pending}>
          Create &amp; play
        </button>
      </div>
    </form>
  );
}
