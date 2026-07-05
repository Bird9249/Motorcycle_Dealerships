import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/kit";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  DatabaseIcon,
  HelpCircleIcon,
  LandmarkIcon,
  PaletteIcon,
  TagIcon,
} from "lucide-react";
import { MasterDataTour, useMasterDataTour } from "../tour";
import { BrandsTab } from "../ui/BrandsTab";
import { ColorsTab } from "../ui/ColorsTab";
import { FinanceCompaniesTab } from "../ui/FinanceCompaniesTab";
import { ModelsTab } from "../ui/ModelsTab";

const tabs = [
  { value: "brands", label: "ຍີ່ຫໍ້", icon: TagIcon },
  { value: "models", label: "ລຸ່ນ", icon: DatabaseIcon },
  { value: "colors", label: "ສີ", icon: PaletteIcon },
  { value: "finance-companies", label: "ໄຟແນນ", icon: LandmarkIcon },
] as const;

type MasterDataTab = (typeof tabs)[number]["value"];

export function MasterDataPage() {
  const nav = useNavigate({ from: "/app/master-data" });
  const search = useSearch({ from: "/app/master-data" });
  const tab = (search.tab ?? "brands") as MasterDataTab;
  const { run, handleJoyrideCallback, startTour } = useMasterDataTour();

  return (
    <>
      <Header />

      <Main>
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-2xl tracking-tight">ຂໍ້ມູນຫຼັກ</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={startTour}
              className="size-7"
              title="ເລີ່ມທົດລອງການນຳທາງ"
            >
              <HelpCircleIcon className="size-4" />
            </Button>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            ຈັດການຍີ່ຫໍ້, ລຸ່ນ ແລະ ສີທີ່ໃຊ້ໃນລະບົບສິນຄ້າຄົງຄັງ.
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) =>
            nav({ search: { tab: value as MasterDataTab } })
          }
          className="gap-6"
        >
          <TabsList
            className="h-auto flex-wrap justify-start"
            data-tourid="master-data-tabs"
          >
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}>
                <Icon className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="brands">
            <BrandsTab />
          </TabsContent>
          <TabsContent value="models">
            <ModelsTab />
          </TabsContent>
          <TabsContent value="colors">
            <ColorsTab />
          </TabsContent>
          <TabsContent value="finance-companies">
            <FinanceCompaniesTab />
          </TabsContent>
        </Tabs>

        <MasterDataTour run={run} onCallback={handleJoyrideCallback} />
      </Main>
    </>
  );
}
