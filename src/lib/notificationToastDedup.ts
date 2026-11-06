// Avoid two foreground toasts when the same notification arrives via
// Supabase Realtime and Firebase FCM (or is repeated by the provider).
const seen = new Map<string, number>();
const WINDOW_MS = 60_000;
const MAX_ITEMS = 500;

export function shouldShowNotificationToast(notificationId: string | null | undefined): boolean {
  // Do not hide unrelated messages which lack an application notification id.
  if (!notificationId) return true;

  const now = Date.now();
  const lastSeenAt = seen.get(notificationId);
  if (lastSeenAt !== undefined && now - lastSeenAt < WINDOW_MS) return false;

  seen.delete(notificationId);
  seen.set(notificationId, now);
  // Bound memory even if notifications continue arriving over many hours.
  for (const [id, timestamp] of seen) {
    if (timestamp >= now - WINDOW_MS && seen.size <= MAX_ITEMS) break;
    seen.delete(id);
  }
  return true;
}
