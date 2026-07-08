import { useNavigate, useSearch } from "@tanstack/react-router";
import { ShieldCheckIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import type { WarrantiesListQueryDTO } from "@/modules/after-sales/domain/contracts";
import { useWarrantiesQuery } from "../api/queries";
import { WarrantiesFilter } from "../ui/WarrantiesFilter";
import { WarrantyCard } from "../ui/WarrantyCard";

export function WarrantiesPage() {
  const nav = useNavigate({ from: "/app/after-sales/warranties" });
  const search = useSearch({
    from: "/app/after-sales/warranties",
  }) as WarrantiesListQueryDTO;

  const list = useWarrantiesQuery({
    offset: search.offset,
    limit: search.limit,
    warrantyType: search.warrantyType,
    status: search.status,
    expiringSoon: search.expiringSoon,
  });

  const offset = Number(search.offset ?? 0);
  const limit = Number(search.limit ?? 20);
  const total = list.data?.meta.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ປະກັນ</h2>
            <p className="text-muted-foreground text-sm">
              ຕິດຕາມປະກັນຫຼັງການຂາຍ
              {total > 0 ? ` · ${total} ລາຍການ` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <WarrantiesFilter />

          {list.isLoading ? (
            <p className="px-4 py-12 text-center text-muted-foreground text-sm">
              ກຳລັງໂຫຼດ...
            </p>
          ) : (list.data?.data.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <ShieldCheckIcon className="size-10 text-muted-foreground" />
              <p className="font-medium">ບໍ່ພົບບັນທຶກປະກັນ</p>
              <p className="text-muted-foreground text-sm">
                ປະກັນຈະຖືກສ້າງອັດຕະໂນມັດເມື່ອຢືນຢັນການຂາຍ
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.data?.data.map((warranty) => (
                  <WarrantyCard key={warranty.id} warranty={warranty} />
                ))}
              </div>

              {total > limit ? (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-muted-foreground text-sm">
                    {offset + 1}–{Math.min(offset + limit, total)} ຈາກ {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canPrev}
                      onClick={() =>
                        nav({
                          search: {
                            ...search,
                            offset: Math.max(0, offset - limit),
                          },
                        })
                      }
                    >
                      ກ່ອນໜ້າ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canNext}
                      onClick={() =>
                        nav({
                          search: {
                            ...search,
                            offset: offset + limit,
                          },
                        })
                      }
                    >
                      ຖັດໄປ
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </Main>
    </>
  );
}
