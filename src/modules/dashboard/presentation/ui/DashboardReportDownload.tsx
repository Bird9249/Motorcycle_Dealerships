import { useNavigate } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { ExportCsvButton } from "@/modules/reports/presentation/ui/ExportCsvButton";

export function DashboardReportDownload() {
  const nav = useNavigate();
  const canReadReports = useActionPermission(["reports:read"]);
  const canExport = useActionPermission(["reports:export"]);

  if (!canReadReports) return null;

  if (canExport) {
    return (
      <ExportCsvButton
        path="/reports/sales/export"
        query={{ period: "month" }}
        label="ດາວໂຫລດລາຍງານ"
      />
    );
  }

  return (
    <Button variant="outline" onClick={() => nav({ to: "/app/reports" })}>
      <Download className="size-4" />
      ດາວໂຫລດລາຍງານ
    </Button>
  );
}
