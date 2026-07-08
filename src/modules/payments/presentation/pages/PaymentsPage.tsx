import { useNavigate, useSearch } from "@tanstack/react-router";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { PaymentsListQueryDTO } from "@/modules/payments/domain/contracts";
import { ScaleIcon, PlusIcon } from "lucide-react";
import { usePaymentsQuery } from "../api/queries";
import { PaymentsFilter } from "../ui/PaymentsFilter";
import { PaymentsTable } from "../ui/PaymentsTable";

export function PaymentsPage() {
  const nav = useNavigate({ from: "/app/payments" });
  const search = useSearch({ from: "/app/payments" }) as PaymentsListQueryDTO;

  const list = usePaymentsQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
    status: search.status,
    paymentAccountId: search.paymentAccountId,
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
  });
  const canReconcile = useActionPermission(["payments:reconcile"]);
  const canCreate = useActionPermission(["payments:create"]);

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ການຊຳລະເງິນ</h2>
            <p className="text-muted-foreground text-sm">
              ລາຍການການຮັບຊຳລະ ແລະ ຢືນຢັນສລິບ
              {list.data?.meta?.total != null
                ? ` · ${list.data.meta.total} ລາຍການ`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <Button onClick={() => nav({ to: "/app/payments/new" })}>
                <PlusIcon className="size-4" />
                ຮັບຊຳລະ
              </Button>
            ) : null}
            {canReconcile ? (
              <Button
                variant="secondary"
                onClick={() => nav({ to: "/app/payments/reconciliation" })}
              >
                <ScaleIcon className="size-4" />
                ກວດສອບຍອດ
              </Button>
            ) : null}
            <Button
            variant="outline"
            onClick={() =>
              nav({
                search: {
                  ...search,
                  status: search.status === "pending" ? undefined : "pending",
                  offset: 0,
                },
              })
            }
          >
            {search.status === "pending" ? "ສະແດງທັງໝົດ" : "ລໍຖ້າຢືນຢັນ"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <PaymentsFilter />
          <PaymentsTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            offset={Number(search.offset ?? 0)}
            limit={Number(search.limit ?? 20)}
            totalCount={list.data?.meta?.total ?? 0}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            sortBy={search.sort ? search.sort[0]?.field : undefined}
            sortOrder={
              search.sort ? (search.sort[0]?.dir as "asc" | "desc") : undefined
            }
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onView={(payment) =>
              nav({ to: "/app/payments/$id", params: { id: payment.id } })
            }
          />
        </div>
      </Main>
    </>
  );
}
