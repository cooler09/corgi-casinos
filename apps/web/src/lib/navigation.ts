// Guard against open redirects: only allow same-site absolute paths like
// "/events/123". Anything external (or missing) falls back to /play.
export function safeRedirectPath(value: string | string[] | undefined | null): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/play';
  return raw;
}
