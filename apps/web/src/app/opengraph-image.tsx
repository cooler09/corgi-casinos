import { corgiOgImage } from '../lib/og';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Corgi Casinos';

// Default social preview for the site (home / any page without its own image).
export default function Image() {
  return corgiOgImage('Corgi Casinos', 'Call OVER or UNDER and win fake coins');
}
