import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import { getInitials } from "@/shared/lib/utils";
import { bookingStatusMeta, recentBookings } from "../data/mock";

export function RecentBookings() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>ການຈອງຫຼ້າສຸດ</CardTitle>
        <CardDescription>5 ລາຍການລ່າສຸດ</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {recentBookings.map((booking) => {
          const status = bookingStatusMeta[booking.status];
          return (
            <div
              key={booking.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Avatar className="size-9">
                <AvatarFallback>{getInitials(booking.guest)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{booking.guest}</p>
                <p className="truncate text-muted-foreground text-xs">
                  {booking.room} · {booking.checkIn}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-medium text-sm tabular-nums">
                  {booking.amount}
                </span>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
