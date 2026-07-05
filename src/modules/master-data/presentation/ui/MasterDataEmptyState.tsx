import type { LucideIcon } from "lucide-react";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/kit";

type MasterDataEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  hasFilters?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function MasterDataEmptyState({
  icon: Icon,
  title,
  description,
  hasFilters = false,
  actionLabel,
  onAction,
}: MasterDataEmptyStateProps) {
  return (
    <Empty className="border-0 py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {hasFilters
            ? "ບໍ່ພົບລາຍການທີ່ຕົງກັບການກອງ — ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ສະຖານະ."
            : description}
        </EmptyDescription>
      </EmptyHeader>
      {!hasFilters && actionLabel && onAction ? (
        <EmptyContent>
          <Button onClick={onAction}>{actionLabel}</Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
