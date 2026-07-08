import { Download } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { OccupancyChart } from "../ui/OccupancyChart";
import { RecentBookings } from "../ui/RecentBookings";
import { RevenueChart } from "../ui/RevenueChart";
import { RoomStatus } from "../ui/RoomStatus";
import { StatCards } from "../ui/StatCards";
import { WarrantyExpiryAlert } from "../ui/WarrantyExpiryAlert";

export function DashboardPage() {
  return (
    <>
      <Header />

      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">ແຜງຄວບຄຸມ</h1>
            <p className="text-muted-foreground">ພາບລວມການດຳເນີນງານຂອງໂຮງແຮມ.</p>
          </div>
          <Button variant="outline">
            <Download />
            ດາວໂຫລດລາຍງານ
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <StatCards />
          <WarrantyExpiryAlert />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RevenueChart />
            <OccupancyChart />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RecentBookings />
            <RoomStatus />
          </div>
        </div>
      </Main>
    </>
  );
}
