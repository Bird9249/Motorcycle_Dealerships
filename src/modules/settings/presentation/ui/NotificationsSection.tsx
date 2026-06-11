import { BellRing, Trash2 } from "lucide-react";
import { useNotifications } from "@/app/providers/NotificationProvider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  toast,
} from "@/components/kit";

const permissionLabel: Record<NotificationPermission, string> = {
  granted: "ເປີດໃຊ້ງານແລ້ວ",
  denied: "ຖືກປະຕິເສດ",
  default: "ຍັງບໍ່ໄດ້ອະນຸຍາດ",
};

const permissionVariant: Record<
  NotificationPermission,
  "success" | "destructive" | "secondary"
> = {
  granted: "success",
  denied: "destructive",
  default: "secondary",
};

export function NotificationsSection() {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
    deviceSupported,
    devicePermission,
    enableDeviceNotifications,
  } = useNotifications();

  return (
    <Card>
      <CardHeader>
        <CardTitle>ການແຈ້ງເຕືອນ</CardTitle>
        <CardDescription>
          ຈັດການການແຈ້ງເຕືອນເຂົ້າເຄື່ອງ ແລະ ປະຫວັດໃນແອັບ.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">ການແຈ້ງເຕືອນເຂົ້າເຄື່ອງ</span>
              {deviceSupported ? (
                <Badge variant={permissionVariant[devicePermission]}>
                  {permissionLabel[devicePermission]}
                </Badge>
              ) : (
                <Badge variant="secondary">ບໍ່ຮອງຮັບ</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              ຮັບການແຈ້ງເຕືອນຈາກລະບົບປະຕິບັດການ ເຖິງແມ່ນບໍ່ໄດ້ເປີດແທັບໄວ້.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={!deviceSupported || devicePermission !== "default"}
            onClick={enableDeviceNotifications}
          >
            <BellRing />
            {devicePermission === "granted" ? "ເປີດໃຊ້ງານແລ້ວ" : "ເປີດໃຊ້ງານ"}
          </Button>
        </div>

        {devicePermission === "denied" ? (
          <p className="text-muted-foreground text-xs">
            ທ່ານໄດ້ປະຕິເສດການແຈ້ງເຕືອນໄວ້ ກະລຸນາເປີດໃໝ່ຜ່ານການຕັ້ງຄ່າຂອງ browser.
          </p>
        ) : null}

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">ປະຫວັດໃນແອັບ</span>
            <p className="text-muted-foreground text-sm">
              ມີທັງໝົດ {notifications.length} ລາຍການ ({unreadCount} ຍັງບໍ່ໄດ້ອ່ານ)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
            >
              ໝາຍວ່າອ່ານທັງໝົດ
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={notifications.length === 0}
              onClick={() => {
                clearAll();
                toast.success("ລ້າງປະຫວັດການແຈ້ງເຕືອນແລ້ວ");
              }}
            >
              <Trash2 />
              ລ້າງທັງໝົດ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
