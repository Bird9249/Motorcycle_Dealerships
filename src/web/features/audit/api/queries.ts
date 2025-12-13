import { useQuery } from "@tanstack/react-query";
import type { OffsetPageQueryDTO } from "./client";
import { fetchAudit, fetchAuditById } from "./client";

export function useAuditList(query: OffsetPageQueryDTO) {
  return useQuery({
    queryKey: ["audit", query],
    queryFn: () => fetchAudit(query),
  });
}

export function useAuditDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["audit", "detail", id],
    enabled: !!id,
    queryFn: () => fetchAuditById(id as string),
  });
}
