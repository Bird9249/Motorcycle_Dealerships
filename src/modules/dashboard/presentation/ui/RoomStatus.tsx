import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/kit";

const rooms = [
  { type: "Standard", used: 48, total: 60 },
  { type: "Deluxe", used: 34, total: 40 },
  { type: "Suite", used: 12, total: 20 },
  { type: "Family", used: 8, total: 15 },
];

export function RoomStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ສະຫຼຸບຫ້ອງພັກ</CardTitle>
        <CardDescription>ຕາມປະເພດຫ້ອງ</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rooms.map((room) => {
          const pct = Math.round((room.used / room.total) * 100);
          return (
            <div key={room.type} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{room.type}</span>
                <span className="text-muted-foreground tabular-nums">
                  {room.used}/{room.total} ({pct}%)
                </span>
              </div>
              <Progress value={pct} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
