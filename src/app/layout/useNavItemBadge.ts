import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import { usePendingPaymentsCountQuery } from "@/modules/payments/presentation/api/queries";

const PENDING_BADGE_URL = "/app/payments";

export function useNavItemBadge(url: string): string | undefined {
  const { has } = usePermissions();
  const canVerify = has("payments:verify");
  const pending = usePendingPaymentsCountQuery(
    url === PENDING_BADGE_URL && canVerify,
  );

  if (url !== PENDING_BADGE_URL || !canVerify) return undefined;
  const count = pending.data?.count ?? 0;
  if (count <= 0) return undefined;
  return count > 99 ? "99+" : String(count);
}
