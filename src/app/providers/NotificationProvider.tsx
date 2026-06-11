import type { LinkProps } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { router } from "@/app/router";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  showSystemNotification,
} from "@/shared/lib/push-notification";

export type NotificationType = "info" | "success" | "warning" | "error";

export type AppNotification = {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  to?: LinkProps["to"];
};

export type NotifyInput = {
  title: string;
  description?: string;
  type?: NotificationType;
  to?: LinkProps["to"];
};

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  notify: (input: NotifyInput) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  /** Whether the browser supports OS-level (service worker) notifications. */
  deviceSupported: boolean;
  /** Current OS notification permission. */
  devicePermission: NotificationPermission;
  /** Ask the user to allow OS-level notifications. */
  enableDeviceNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_KEY = "app-notifications";
const MAX_NOTIFICATIONS = 50;

function loadInitial(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppNotification[];
  } catch {
    // ignore malformed storage
  }
  return seed();
}

function seed(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: nanoid(),
      title: "ຍິນດີຕ້ອນຮັບສູ່ລະບົບ",
      description: "ນີ້ຄືສູນແຈ້ງເຕືອນ. ການແຈ້ງເຕືອນໃໝ່ຈະປາກົດຢູ່ນີ້.",
      type: "info",
      read: false,
      createdAt: new Date(now).toISOString(),
    },
  ];
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] =
    useState<AppNotification[]>(loadInitial);
  const [devicePermission, setDevicePermission] =
    useState<NotificationPermission>(() => getNotificationPermission());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore quota errors
    }
  }, [notifications]);

  // Navigate when the user clicks an OS notification (relayed by the SW).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === "NOTIFICATION_NAVIGATE" && data.to) {
        router.navigate({ to: data.to as LinkProps["to"] });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  const enableDeviceNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission();
    setDevicePermission(permission);
  }, []);

  const notify = useCallback((input: NotifyInput) => {
    const id = nanoid();
    setNotifications((prev) =>
      [
        {
          id,
          title: input.title,
          description: input.description,
          type: input.type ?? "info",
          read: false,
          createdAt: new Date().toISOString(),
          to: input.to,
        },
        ...prev,
      ].slice(0, MAX_NOTIFICATIONS),
    );

    // Mirror to an OS-level notification via the service worker.
    void showSystemNotification({
      title: input.title,
      body: input.description,
      tag: id,
      to: input.to as string | undefined,
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo<NotificationContextType>(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    return {
      notifications,
      unreadCount,
      notify,
      markAsRead,
      markAllAsRead,
      remove,
      clearAll,
      deviceSupported: isNotificationSupported(),
      devicePermission,
      enableDeviceNotifications,
    };
  }, [
    notifications,
    notify,
    markAsRead,
    markAllAsRead,
    remove,
    clearAll,
    devicePermission,
    enableDeviceNotifications,
  ]);

  return <NotificationContext value={value}>{children}</NotificationContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
