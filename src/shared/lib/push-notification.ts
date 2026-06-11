/**
 * Helpers for showing OS-level notifications through the service worker.
 * The service worker displays them (via `registration.showNotification`),
 * which keeps notifications working even when the tab is unfocused.
 */

export type SystemNotificationPayload = {
  title: string;
  body?: string;
  tag?: string;
  to?: string;
  icon?: string;
};

export function isNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export async function showSystemNotification(
  payload: SystemNotificationPayload,
): Promise<void> {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    const registration = await navigator.serviceWorker.ready;
    // Prefer messaging the active worker so a single code path renders it.
    if (registration.active) {
      registration.active.postMessage({
        type: "SHOW_NOTIFICATION",
        payload,
      });
      return;
    }
    await registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: payload.icon ?? "/logo.svg",
      data: { to: payload.to },
    });
  } catch {
    // ignore — notification is best-effort
  }
}
