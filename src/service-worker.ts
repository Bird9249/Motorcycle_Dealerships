/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "app-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      // ลบ cache เก่า (optional แต่แนะนำ)
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) =>
          k !== CACHE_NAME ? caches.delete(k) : Promise.resolve(),
        ),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Don't cache API requests
  if (url.pathname.startsWith("/api")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request: Request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response?.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      const offline = await cache.match("/");
      if (offline) return offline;
    }

    throw error;
  }
}

async function cacheFirst(request: Request) {
  const cache = await caches.open(CACHE_NAME);

  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response?.ok) {
    cache.put(request, response.clone());
  }

  return response;
}

type ShowNotificationPayload = {
  title: string;
  body?: string;
  tag?: string;
  to?: string;
  icon?: string;
};

function showNotification(payload: ShowNotificationPayload) {
  const { title, body, tag, to, icon } = payload;
  return self.registration.showNotification(title, {
    body,
    tag,
    icon: icon ?? "/logo.svg",
    badge: "/logo.svg",
    data: { to },
  });
}

// Listen for messages from clients
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "SHOW_NOTIFICATION" && data.payload) {
    event.waitUntil(showNotification(data.payload as ShowNotificationPayload));
  }
});

// Web Push (server-driven) — used when a real push backend is wired up later.
self.addEventListener("push", (event: PushEvent) => {
  let payload: ShowNotificationPayload = { title: "ການແຈ້ງເຕືອນ" };
  try {
    if (event.data) payload = event.data.json() as ShowNotificationPayload;
  } catch {
    if (event.data) payload = { title: event.data.text() };
  }
  event.waitUntil(showNotification(payload));
});

// Focus or open the app when a notification is clicked, then navigate.
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const to = (event.notification.data as { to?: string } | null)?.to;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const client = clientList.find((c) => "focus" in c);
      if (client) {
        await (client as WindowClient).focus();
        if (to) {
          client.postMessage({ type: "NOTIFICATION_NAVIGATE", to });
        }
        return;
      }

      const url = to ?? "/";
      await self.clients.openWindow(url);
    })(),
  );
});
