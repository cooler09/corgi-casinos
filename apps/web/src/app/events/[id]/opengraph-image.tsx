import { payoutLabel, summarizeBet } from '../../../domain/describe';
import { getEvent } from '../../../lib/db/events';
import { corgiOgImage } from '../../../lib/og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Corgi Casinos bet';

// Per-event social preview image — title + bet summary.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) {
    return corgiOgImage('Corgi Casinos', 'Fake-money bets for family & friends');
  }
  return corgiOgImage(event.title, `${summarizeBet(event)} · ${payoutLabel(event)}`);
}
