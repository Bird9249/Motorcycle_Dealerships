import { Header } from "@/web/app/layout/Header";
import { Main } from "@/web/app/layout/Main";
import { Button } from "@devhop/ui";

export function DashboardPage() {
  return (
    <>
      <Header />

      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <h1 className="font-bold text-2xl tracking-tight">ແຜງຄວບຄຸມ</h1>
          <div className="flex items-center space-x-2">
            <Button>ດາວໂຫລດ</Button>
          </div>
        </div>
      </Main>
    </>
  );
}
