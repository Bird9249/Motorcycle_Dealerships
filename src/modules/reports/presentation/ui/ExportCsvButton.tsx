import { Download } from "lucide-react";
import { useState } from "react";
import { Button, toast } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { config } from "@/shared/lib/config";

type ExportCsvButtonProps = {
  path: string;
  query?: Record<string, string | undefined>;
  label?: string;
};

export function ExportCsvButton({
  path,
  query = {},
  label = "ດາວໂຫລດ CSV",
}: ExportCsvButtonProps) {
  const canExport = useActionPermission(["reports:export"]);
  const [loading, setLoading] = useState(false);

  if (!canExport) return null;

  const handleExport = async () => {
    setLoading(true);
    try {
      const url = new URL(`${config.apiUrl}${path}`);
      for (const [key, value] of Object.entries(query)) {
        if (value != null && value !== "") {
          url.searchParams.set(key, value);
        }
      }

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "report.csv";

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("ດາວໂຫລດ CSV ສຳເລັດ");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ດາວໂຫລດບໍ່ສຳເລັດ";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      <Download className="size-4" />
      {loading ? "ກຳລັງດາວໂຫລດ..." : label}
    </Button>
  );
}
