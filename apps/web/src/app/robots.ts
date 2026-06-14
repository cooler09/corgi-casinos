import type { MetadataRoute } from 'next';

// Allow crawling so link-preview bots (Slack, iMessage, WhatsApp, Twitter, etc.)
// can fetch the page and read its Open Graph tags. The site is kept OUT of search
// results by the per-page `noindex` meta tag (see app/layout.tsx) — that's the
// correct combination for "rich link previews, but not in Google."
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  };
}
