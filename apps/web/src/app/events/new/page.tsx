import { redirect } from 'next/navigation';

import { currentPlayer } from '../../../lib/session';
import { NewEventForm } from './_components/new-event-form';

export const dynamic = 'force-dynamic';

export default async function NewEventPage() {
  const player = await currentPlayer();
  if (!player) redirect('/');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg">Post a bet</h1>
        <p className="text-on-surface-variant">
          Pick a bet type, set it up, and let family and friends play. You (or anyone) can settle it
          later.
        </p>
      </div>
      <NewEventForm />
    </div>
  );
}
