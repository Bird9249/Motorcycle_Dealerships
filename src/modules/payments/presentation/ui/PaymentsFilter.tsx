import { useNavigate, useSearch } from "@tanstack/react-router";
import { FilterIcon, XIcon } from "lucide-react";
import {
  Badge,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/kit";
import type { PaymentsListQueryDTO } from "@/modules/payments/domain/contracts";
import { usePaymentAccountsQuery } from "../api/queries";
import { PAYMENT_STATUS_OPTIONS } from "../lib/labels";

export function PaymentsFilter() {
  const nav = useNavigate({ from: "/app/payments" });
  const search = useSearch({ from: "/app/payments" }) as PaymentsListQueryDTO;
  const accounts = usePaymentAccountsQuery({ active: "true" });

  const activeFilters =
    (search.status ? 1 : 0) + (search.paymentAccountId ? 1 : 0);

  const clearFilters = () => {
    nav({
      search: {
        offset: 0,
        limit: search.limit ?? 20,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">ກອງຂໍ້ມູນ</span>
        {activeFilters > 0 ? (
          <Badge variant="secondary">{activeFilters} ຕົວກອງ</Badge>
        ) : null}
        {activeFilters > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon className="size-4" />
            ລ້າງ
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>ສະຖານະ</Label>
          <Select
            value={search.status ?? "all"}
            onValueChange={(value) =>
              nav({
                search: {
                  ...search,
                  status:
                    value === "all"
                      ? undefined
                      : (value as PaymentsListQueryDTO["status"]),
                  offset: 0,
                },
              })
            }
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="ສະຖານະທັງໝົດ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ສະຖານະທັງໝົດ</SelectItem>
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>ບັນຊີຮັບເງິນ</Label>
          <Select
            value={search.paymentAccountId ?? "all"}
            onValueChange={(value) =>
              nav({
                search: {
                  ...search,
                  paymentAccountId: value === "all" ? undefined : value,
                  offset: 0,
                },
              })
            }
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="ບັນຊີທັງໝົດ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ບັນຊີທັງໝົດ</SelectItem>
              {(accounts.data ?? []).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
