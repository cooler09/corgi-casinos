'use client';

import { useState } from 'react';

import { secondaryButtonClass } from './primary-button';

// One-tap share: uses the native share sheet on mobile (iMessage/WhatsApp/etc.),
// and falls back to copying the link on desktop.
export function ShareButton({ path, title, text }: { path: string; title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: text ?? title, url });
        return;
      } catch (err) {
        // User dismissed the share sheet — don't fall through to a copy.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  }

  return (
    <button type="button" onClick={share} className={secondaryButtonClass('sm')}>
      {copied ? '✓ Link copied' : '🔗 Share'}
    </button>
  );
}
