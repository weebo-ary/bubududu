const claimed = new Set();
export function soundtrackKey(url) {
  return `bubududu:soundtrack:v1:${url}`;
}
export function claimAutoplay(storage, url) {
  const key = soundtrackKey(url);
  if (claimed.has(key)) return false;
  try {
    if (storage?.getItem(key)) {
      claimed.add(key);
      return false;
    }
  } catch {
    /* In-memory protection still prevents duplicate attempts. */
  }
  claimed.add(key);
  try {
    storage?.setItem(
      key,
      JSON.stringify({ state: "attempted", attemptedAt: Date.now() }),
    );
  } catch {
    /* Storage may be disabled. */
  }
  return true;
}
export function rememberPlayback(storage, url) {
  claimed.add(soundtrackKey(url));
  try {
    storage?.setItem(
      soundtrackKey(url),
      JSON.stringify({ state: "played", playedAt: Date.now() }),
    );
  } catch {
    /* Keep playback usable without browser storage. */
  }
}
