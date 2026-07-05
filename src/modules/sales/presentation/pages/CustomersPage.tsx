import { useNavigate, useSearch } from "@tanstack/react-router";
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Modal,
  useDebounceCallback,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type {
  CreateCustomerDTO,
  CustomersListQueryDTO,
  UpdateCustomerDTO,
} from "@/modules/sales/domain/contracts";
import type { CustomerItem } from "../api/client";
import {
  useCreateCustomer,
  useCustomersQuery,
  useUpdateCustomer,
} from "../api/queries";
import { CustomerForm, customerToFormValues } from "../ui/CustomerForm";
import { CustomersTable } from "../ui/CustomersTable";

export function CustomersPage() {
  const nav = useNavigate({ from: "/app/sales/customers" });
  const search = useSearch({
    from: "/app/sales/customers",
  }) as CustomersListQueryDTO;

  const [modal, setModal] = useState<{
    open: boolean;
    customer: CustomerItem | null;
  }>({ open: false, customer: null });

  const list = useCustomersQuery({
    offset: search.offset,
    limit: search.limit,
    q: search.q,
  });

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer(modal.customer?.id ?? "");
  const canCreate = useActionPermission(["sales:create"]);

  const debouncedSearch = useDebounceCallback((q: string) => {
    nav({
      search: {
        ...search,
        offset: 0,
        q: q || undefined,
      },
    });
  }, 400);

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ລູກຄ້າ</h2>
            <p className="text-muted-foreground text-sm">
              ຈັດການຂໍ້ມູນລູກຄ້າ — ໃຊ້ໃນການຂາຍ ແລະ CRM
            </p>
          </div>
          {canCreate ? (
            <Button onClick={() => setModal({ open: true, customer: null })}>
              <PlusIcon className="size-4" />
              ເພີ່ມລູກຄ້າ
            </Button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-4">
            <InputGroup className="max-w-md">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ..."
                defaultValue={search.q ?? ""}
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          {!list.isLoading && (list.data?.data.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <UsersIcon className="size-10 text-muted-foreground" />
              <p className="font-medium">ຍັງບໍ່ມີລູກຄ້າ</p>
              <p className="text-muted-foreground text-sm">
                {search.q ? "ບໍ່ພົບຜົນການຄົ້ນຫາ" : "ເພີ່ມລູກຄ້າໃໝ່ເພື່ອເລີ່ມຕົ້ນ"}
              </p>
            </div>
          ) : (
            <CustomersTable
              data={list.data?.data ?? []}
              isLoading={list.isLoading}
              offset={Number(search.offset ?? 0)}
              limit={Number(search.limit ?? 20)}
              totalCount={list.data?.meta?.total ?? 0}
              onPaginationChange={(offset, limit) =>
                nav({ search: { ...search, offset, limit } })
              }
              onEdit={(customer) => setModal({ open: true, customer })}
            />
          )}
        </div>

        <Modal
          open={modal.open}
          onOpenChange={(open) => {
            if (!open) setModal({ open: false, customer: null });
          }}
          title={modal.customer ? "ແກ້ໄຂລູກຄ້າ" : "ເພີ່ມລູກຄ້າ"}
          size="lg"
        >
          <CustomerForm
            key={modal.customer?.id ?? "new"}
            initialValues={
              modal.customer ? customerToFormValues(modal.customer) : undefined
            }
            submitting={createCustomer.isPending || updateCustomer.isPending}
            onSubmit={(values) => {
              if (modal.customer) {
                updateCustomer.mutate(values as UpdateCustomerDTO, {
                  onSuccess: () => setModal({ open: false, customer: null }),
                });
              } else {
                createCustomer.mutate(values as CreateCustomerDTO, {
                  onSuccess: () => setModal({ open: false, customer: null }),
                });
              }
            }}
          />
        </Modal>
      </Main>
    </>
  );
}
