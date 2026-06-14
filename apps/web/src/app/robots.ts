import type { MetadataRoute } from 'next';

// Generates /robots.txt telling well-behaved crawlers not to crawl anything.
// The per-page `noindex` meta tag (see app/layout.tsx) is the stronger guarantee
// that nothing lands in a search index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
