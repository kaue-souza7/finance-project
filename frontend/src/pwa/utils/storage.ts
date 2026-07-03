const STORAGE_KEY = "pwa:ios-card-dismissed";
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldShowIOSCard(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;
    const dismissedAt = Number(stored);
    if (Number.isNaN(dismissedAt)) return true;
    return Date.now() - dismissedAt > DISMISSAL_DURATION_MS;
  } catch {
    return true;
  }
}

export function dismissIOSCard(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable
  }
}
