import { Bell, Compass, Coins, Landmark, Monitor, PanelsTopLeft, UserCog } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/kit";
import { RequirePermissions } from "@/modules/auth/presentation/ui/RequirePermissions";
import { AccountSection } from "../ui/AccountSection";
import { AppearanceSection } from "../ui/AppearanceSection";
import { ExchangeRatesSection } from "../ui/ExchangeRatesSection";
import { LayoutSection } from "../ui/LayoutSection";
import { NotificationsSection } from "../ui/NotificationsSection";
import { OnboardingSection } from "../ui/OnboardingSection";
import { PaymentAccountsSection } from "../ui/PaymentAccountsSection";

const tabs = [
  { value: "account", label: "ບັນຊີ", icon: UserCog },
  { value: "appearance", label: "ຮູບລັກສະນະ", icon: Monitor },
  { value: "notifications", label: "ການແຈ້ງເຕືອນ", icon: Bell },
  { value: "layout", label: "ໂຄງຮ່າງ", icon: PanelsTopLeft },
  { value: "exchange-rates", label: "ອັດຕາແລກປ່ຽນ", icon: Coins },
  { value: "payment-accounts", label: "ບັນຊີຮັບເງິນ", icon: Landmark },
  { value: "onboarding", label: "ການແນະນຳ", icon: Compass },
] as const;

export function SettingsPage() {
  return (
    <>
      <Header />

      <Main>
        <div className="mb-4">
          <h2 className="font-bold text-2xl tracking-tight">ການຕັ້ງຄ່າ</h2>
          <p className="text-muted-foreground">
            ຈັດການບັນຊີ, ຮູບລັກສະນະ ແລະ ການຕັ້ງຄ່າສ່ວນຕົວຂອງທ່ານ.
          </p>
        </div>

        <Tabs defaultValue="account" className="gap-6">
          <TabsList className="h-auto flex-wrap justify-start">
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}>
                <Icon className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="account">
            <AccountSection />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceSection />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsSection />
          </TabsContent>
          <TabsContent value="layout">
            <LayoutSection />
          </TabsContent>
          <TabsContent value="exchange-rates">
            <RequirePermissions all={["sales:read"]}>
              <ExchangeRatesSection />
            </RequirePermissions>
          </TabsContent>
          <TabsContent value="payment-accounts">
            <RequirePermissions all={["payments:read"]}>
              <PaymentAccountsSection />
            </RequirePermissions>
          </TabsContent>
          <TabsContent value="onboarding">
            <OnboardingSection />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
