import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCheck,
  CircleCheck,
  Info,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import {
  type AppNotification,
  type NotificationType,
  useNotifications,
} from "@/app/providers/NotificationProvider";
import {
  Badge,
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Separator,
} from "@/components/kit";

const typeStyles: Record<
  NotificationType,
  { icon: React.ElementType; className: string }
> = {
  info: { icon: Info, className: "bg-primary/10 text-primary" },
  success: {
    icon: CircleCheck,
    className: "bg-emerald-600/10 text-emerald-600",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-500/10 text-amber-600",
  },
  error: { icon: XCircle, className: "bg-destructive/10 text-destructive" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "ຫາກໍ່ນີ້";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} ນາທີກ່ອນ`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} ຊົ່ວໂມງກ່ອນ`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} ມື້ກ່ອນ`;
  return new Date(iso).toLocaleDateString();
}

function NotificationRow({
  notification,
  onRead,
  onRemove,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { icon: Icon, className } = typeStyles[notification.type];

  const body = (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full [&>svg]:size-4",
          className,
        )}
      >
        <Icon />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate font-medium text-sm">{notification.title}</p>
        {notification.description ? (
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {notification.description}
          </p>
        ) : null}
        <span className="text-muted-foreground text-xs">
          {relativeTime(notification.createdAt)}
        </span>
      </div>
      {!notification.read ? (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        "group/notif relative rounded-md p-2 transition-colors hover:bg-muted/60",
        !notification.read && "bg-muted/30",
      )}
    >
      {notification.to ? (
        <Link to={notification.to} onClick={() => onRead(notification.id)}>
          {body}
        </Link>
      ) : (
        <button
          type="button"
          className="w-full text-left"
          onClick={() => onRead(notification.id)}
        >
          {body}
        </button>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="ລຶບການແຈ້ງເຕືອນ"
        className="absolute top-1 right-1 opacity-0 transition-opacity group-hover/notif:opacity-100"
        onClick={() => onRemove(notification.id)}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    remove,
    clearAll,
    deviceSupported,
    devicePermission,
    enableDeviceNotifications,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const showEnableDevice = deviceSupported && devicePermission === "default";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="ການແຈ້ງເຕືອນ"
        >
          <Bell />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 size-4 min-w-4 justify-center rounded-full px-1 py-0 text-[10px] tabular-nums"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">ການແຈ້ງເຕືອນ</span>
            {unreadCount > 0 ? (
              <Badge variant="secondary" className="tabular-nums">
                {unreadCount}
              </Badge>
            ) : null}
          </div>
          {notifications.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck />
              ອ່ານທັງໝົດ
            </Button>
          ) : null}
        </div>
        <Separator />

        {showEnableDevice ? (
          <button
            type="button"
            onClick={enableDeviceNotifications}
            className="flex w-full items-center gap-2 bg-primary/5 px-3 py-2 text-left text-primary text-xs transition-colors hover:bg-primary/10"
          >
            <BellRing className="size-4 shrink-0" />
            <span>ເປີດການແຈ້ງເຕືອນເຂົ້າເຄື່ອງ ເພື່ອຮັບແຈ້ງເຕືອນທັນທີ</span>
          </button>
        ) : null}

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-5">
              <Bell />
            </span>
            <p className="text-muted-foreground text-sm">ຍັງບໍ່ມີການແຈ້ງເຕືອນ</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-80">
              <div className="flex flex-col gap-1 p-2">
                {notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onRead={markAsRead}
                    onRemove={remove}
                  />
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground text-xs"
                onClick={clearAll}
              >
                <Trash2 />
                ລ້າງທັງໝົດ
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
