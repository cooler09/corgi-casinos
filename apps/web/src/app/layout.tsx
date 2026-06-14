import type { Metadata } from 'next';
import Link from 'next/link';

import { Coins } from '../components/coins-badge';
import { secondaryButtonClass } from '../components/primary-button';
import { currentPlayer } from '../lib/session';
import { logoutAction } from './actions';

import './globals.css';

export const metadata: Metadata = {
  title: 'Corgi Casinos',
  description: 'A family-friendly, fake-money over/under betting game.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const player = await currentPlayer();

  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-outline bg-surface-container">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href={player ? '/play' : '/'} className="text-headline-sm">
              🐶 Corgi Casinos
            </Link>

            {player ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link href="/play" className="hover:text-primary">
                  Play
                </Link>
                <Link href="/scoreboard" className="hover:text-primary">
                  Scoreboard
                </Link>
                <Link href="/roster" className="hover:text-primary">
                  Family
                </Link>
                <span className="flex items-center gap-1 font-semibold">
                  <span aria-hidden>{player.emoji}</span>
                  {player.name}
                </span>
                <Coins amount={player.balance} />
                <form action={logoutAction}>
                  <button type="submit" className={secondaryButtonClass('sm')}>
                    Switch
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
