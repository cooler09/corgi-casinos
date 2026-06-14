import type { Metadata } from 'next';
import Link from 'next/link';

import { Coins } from '../components/coins-badge';
import { secondaryButtonClass } from '../components/primary-button';
import { currentPlayer } from '../lib/session';
import { logoutAction } from './actions';

import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const DESCRIPTION = 'A fake-money over/under betting game for family and friends.';

export const metadata: Metadata = {
  // Absolute base so social-preview (og:image) URLs resolve correctly.
  metadataBase: new URL(SITE_URL),
  title: 'Corgi Casinos',
  description: DESCRIPTION,
  // Private app — keep it out of search results (noindex), while still letting
  // link-preview bots fetch the Open Graph tags below (see app/robots.ts). Emits
  // <meta name="robots" content="noindex, nofollow"> on every page.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    siteName: 'Corgi Casinos',
    title: 'Corgi Casinos',
    description: DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Corgi Casinos',
    description: DESCRIPTION,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const player = await currentPlayer();

  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-outline bg-surface-container border-b">
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
                  Family &amp; Friends
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
