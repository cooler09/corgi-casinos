import { ImageResponse } from 'next/og';

// Shared 1200×630 social-preview image (Open Graph / Twitter card). Rendered by
// the file-based `opengraph-image` routes. Inline styles only (Satori) — any
// element with more than one child needs `display: 'flex'`.
export const OG_SIZE = { width: 1200, height: 630 };

export function corgiOgImage(title: string, subtitle: string): ImageResponse {
  const safeTitle = title.length > 90 ? `${title.slice(0, 87)}…` : title;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#fdf8f3',
        padding: 72,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#c2591a' }} />
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 3, color: '#c2591a' }}>
          CORGI CASINOS
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 66, fontWeight: 800, color: '#221a13', lineHeight: 1.1 }}>
          {safeTitle}
        </div>
        <div style={{ fontSize: 34, color: '#6f6155' }}>{subtitle}</div>
      </div>

      <div style={{ fontSize: 26, color: '#6f6155' }}>
        Fake-money over/under bets for family &amp; friends
      </div>
    </div>,
    OG_SIZE,
  );
}
