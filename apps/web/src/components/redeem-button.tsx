'use client';

import { useEffect, useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { redeemAllowanceAction } from '../app/actions';
import { ALLOWANCE_CAP } from '../domain/allowance';
import { formatCoins } from '../domain/coins';
import { primaryButtonClass } from './primary-button';

// Daily allowance claim. The page passes a fixed `redeemAt` (epoch ms the player
// becomes eligible) and `grant` (cap-trimmed coins they'd get) — both pure, so
// server + first client render agree. The cooldown is time-dependent, so until
// the client clock mounts we don't show it as elapsed (the server action
// re-checks on submit); once `now` is set we show the true state and tick a live
// countdown. `grant <= 0` means the player is at the cap.
export function RedeemButton({ redeemAt, grant }: { redeemAt: number; grant: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const capped = grant <= 0;
  const remaining = now === null ? 0 : Math.max(0, redeemAt - now);
  const onCooldown = now !== null && remaining > 0;

  function redeem() {
    setError(null);
    startTransition(async () => {
      const res = await redeemAllowanceAction();
      if ('error' in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={redeem}
        disabled={capped || onCooldown || pending}
        className={primaryButtonClass('sm')}
      >
        {capped ? '🎁 At cap' : `🎁 Redeem ${formatCoins(grant)} 🪙`}
      </button>
      {capped ? (
        <span className="text-on-surface-variant text-xs">
          at the {formatCoins(ALLOWANCE_CAP)} 🪙 cap
        </span>
      ) : onCooldown ? (
        <span className="text-on-surface-variant text-xs">
          next in {formatCountdown(remaining)}
        </span>
      ) : null}
      {error ? <span className="text-error text-xs">{error}</span> : null}
    </div>
  );
}

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
