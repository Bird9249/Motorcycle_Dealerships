import { Sidebar } from "@/components/kit";
import { useLayout } from "../providers/LayoutProvider";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { collapsible, variant } = useLayout();
  return <Sidebar {...props} collapsible={collapsible} variant={variant} />;
}
