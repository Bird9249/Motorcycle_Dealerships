import { Button, SimpleDropdown, useIsMobile } from "@devhop/ui";

export type RowAction = {
  label: string;
  onClick: () => void;
  variant?: "destructive" | "secondary" | "outline";
  icon?: React.ReactNode;
};

export function RowActions({
  actions,
  maxInline = 2,
}: {
  actions: RowAction[];
  maxInline?: number;
}) {
  const isMobile = useIsMobile();
  const inline = actions.length <= maxInline || isMobile;

  if (inline) {
    return (
      <div className="flex gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant={
              a.variant ?? (a.label === "ແກ້ໄຂ" ? "outline" : "secondary")
            }
            size="sm"
            onClick={a.onClick}
          >
            {a.icon}
            {a.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <SimpleDropdown
      items={actions.map((a) => ({
        label: a.label,
        variant: a.variant === "destructive" ? "destructive" : undefined,
        action: a.onClick,
        icon: a.icon,
      }))}
    />
  );
}
