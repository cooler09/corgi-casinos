import { formatCoins } from '../domain/coins';

export function Coins({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2.5 py-1 text-sm font-semibold">
      <span aria-hidden>🪙</span>
      {formatCoins(amount)}
    </span>
  );
}
