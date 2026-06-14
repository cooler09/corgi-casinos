'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { Alert } from '../../../components/alert';
import { Coins } from '../../../components/coins-badge';
import { fieldInputClass, fieldLabelClass } from '../../../components/field-styles';
import {
  primaryButtonClass,
  secondaryButtonClass,
  tonalButtonClass,
} from '../../../components/primary-button';
import { createPlayerAction, setPinAction } from '../../actions';

interface Member {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  // Private PIN — only whether one is set is exposed to the client.
  hasPin: boolean;
}

const EMOJI_CHOICES = ['🐶', '🐕', '🦴', '🐾', '👑', '⭐', '🍀', '🎲', '🦊', '🐱', '🐢', '🦄'];

export function RosterManager({ members }: { members: Member[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🐶');
  const [pin, setPin] = useState('');

  function addMember() {
    setError(null);
    startTransition(async () => {
      const res = await createPlayerAction({ name, emoji, pin });
      if ('error' in res) {
        setError(res.error);
        return;
      }
      setName('');
      setEmoji('🐶');
      setPin('');
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            pending={pending}
            onSaved={() => router.refresh()}
            onError={setError}
          />
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addMember();
        }}
        className="border-outline bg-surface-container space-y-4 rounded-2xl border p-4"
      >
        <h2 className="text-title-lg">Add family or a friend</h2>
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div>
          <label className={fieldLabelClass} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldInputClass}
          />
        </div>

        <div>
          <span className={fieldLabelClass}>Emoji</span>
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
          <label className={fieldLabelClass} htmlFor="pin">
            PIN (optional, 1–4 digits)
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className={fieldInputClass}
            placeholder="leave blank for no PIN"
          />
          <p className="text-on-surface-variant mt-1 text-xs">
            ⚠️ Don&apos;t use a real PIN — make one up just for this game.
          </p>
        </div>

        <button type="submit" className={primaryButtonClass()} disabled={pending}>
          Add member
        </button>
      </form>
    </div>
  );
}

function MemberRow({
  member,
  pending,
  onSaved,
  onError,
}: {
  member: Member;
  pending: boolean;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pin, setPin] = useState('');
  const [, startTransition] = useTransition();

  function savePin(value: string) {
    startTransition(async () => {
      const res = await setPinAction(member.id, value);
      if ('error' in res) {
        onError(res.error);
        return;
      }
      setEditing(false);
      setPin('');
      onSaved();
    });
  }

  return (
    <li className="border-outline bg-surface-container flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
      <span className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {member.emoji}
        </span>
        <span className="font-semibold">{member.name}</span>
        {member.hasPin ? <span className="text-on-surface-variant text-xs">🔒 PIN set</span> : null}
      </span>

      <span className="flex items-center gap-3">
        <Coins amount={member.balance} />
        {editing ? (
          <span className="flex items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="new PIN"
              className={`${fieldInputClass} w-24`}
            />
            <button
              type="button"
              className={primaryButtonClass('sm')}
              disabled={pending}
              onClick={() => savePin(pin)}
            >
              Save
            </button>
            {member.hasPin ? (
              <button
                type="button"
                className={secondaryButtonClass('sm')}
                disabled={pending}
                onClick={() => savePin('')}
              >
                Clear
              </button>
            ) : null}
          </span>
        ) : (
          <button
            type="button"
            className={tonalButtonClass('sm')}
            onClick={() => {
              setPin('');
              setEditing(true);
            }}
          >
            {member.hasPin ? 'Change PIN' : 'Set PIN'}
          </button>
        )}
      </span>
    </li>
  );
}
