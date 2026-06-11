import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  useTheme,
} from "@/components/kit";

const themes = [
  { value: "light", label: "ສະຫວ່າງ", icon: Sun },
  { value: "dark", label: "ມືດ", icon: Moon },
  { value: "system", label: "ຕາມລະບົບ", icon: Monitor },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>ຮູບລັກສະນະ</CardTitle>
        <CardDescription>ເລືອກໂໝດສີຂອງໜ້າຈໍ.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {themes.map(({ value, label, icon: Icon }) => {
            const active = (theme ?? "system") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={active}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-accent",
                  active
                    ? "border-primary ring-1 ring-primary"
                    : "border-border",
                )}
              >
                {active ? (
                  <Check className="absolute top-2 right-2 size-4 text-primary" />
                ) : null}
                <Icon className="size-6" />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
