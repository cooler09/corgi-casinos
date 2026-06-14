'use client';

import { useEffect, useRef, useState } from 'react';

import { fieldInputClass } from './field-styles';
import { primaryButtonClass, secondaryButtonClass } from './primary-button';

// Share control: click to reveal a panel with the full link in a selectable
// field + a Copy button (with feedback), plus the native share sheet on devices
// that support it. The link is the real URL the viewer is on.
export function ShareButton({ path, title, text }: { path: string; title: string; text?: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside the panel.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function toggle() {
    const next = !open;
    if (next) {
      setUrl(`${window.location.origin}${path}`);
      setCanShare(typeof navigator.share === 'function');
      setCopied(false);
    }
    setOpen(next);
  }

  async function copy() {
    const value = url || `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select(); // clipboard blocked — let them copy manually
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: text ?? title, url });
      setOpen(false);
    } catch (err) {
      if (err instanceof DOMException) return; // dismissed
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={secondaryButtonClass('sm')}
      >
        🔗 Share
      </button>

      {open ? (
        <div className="border-outline bg-surface-container-high absolute right-0 z-10 mt-2 w-72 space-y-2 rounded-xl border p-3 shadow-lg">
          <p className="text-on-surface-variant text-xs">
            Anyone with this link can view &amp; join the bet.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              autoFocus
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className={`${fieldInputClass} flex-1 text-xs`}
              aria-label="Shareable link"
            />
            <button type="button" onClick={copy} className={primaryButtonClass('sm')}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          {canShare ? (
            <button
              type="button"
              onClick={nativeShare}
              className={`${secondaryButtonClass('sm')} w-full`}
            >
              Share via…
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
