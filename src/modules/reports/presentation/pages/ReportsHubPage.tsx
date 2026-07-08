import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bike,
  ChevronRight,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@/components/kit";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { REPORT_HUB_CARDS } from "../lib/labels";

const ICONS = {
  sales: BarChart3,
  inventory: Bike,
  payments: Wallet,
  "after-sales": ShieldCheck,
} as const;

export function ReportsHubPage() {
  return (
    <>
      <Header />
      <Main>
        <div className="mb-6">
          <h1 className="font-bold text-2xl tracking-tight">ລາຍງານ</h1>
          <p className="text-muted-foreground">
            ເລືອກປະເພດລາຍງານເພື່ອເບິ່ງສະຫຼຸບທຸລະກິດ
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {REPORT_HUB_CARDS.map((card) => {
            const Icon = ICONS[card.key];
            const content = (
              <Card
                className={cn(
                  "transition-colors",
                  card.available
                    ? "hover:border-primary/40 hover:bg-muted/30"
                    : "opacity-70",
                )}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border bg-muted/40 p-2">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{card.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {card.description}
                      </CardDescription>
                      {!card.available ? (
                        <Badge variant="secondary" className="mt-2">
                          ຈະມາໃນ Phase 5.3
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {card.available ? (
                    <ChevronRight className="mt-1 size-5 text-muted-foreground" />
                  ) : null}
                </CardHeader>
              </Card>
            );

            if (!card.available) {
              return <div key={card.key}>{content}</div>;
            }

            return (
              <Link key={card.key} to={card.href} className="block">
                {content}
              </Link>
            );
          })}
        </div>
      </Main>
    </>
  );
}
