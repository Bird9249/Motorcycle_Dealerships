import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  confirm,
  Modal,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { useServiceRecordsQuery } from "@/modules/after-sales/presentation/api/queries";
import { ServiceHistoryTable } from "@/modules/after-sales/presentation/ui/ServiceHistoryTable";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import {
  useCustomerQuery,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../api/queries";
import { CustomerForm, customerToFormValues } from "../ui/CustomerForm";
import { CustomerOrdersTable } from "../ui/CustomerOrdersTable";

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}

function formatAddress(customer: {
  village: string | null;
  district: string | null;
  province: string | null;
}) {
  const parts = [customer.village, customer.district, customer.province].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function CustomerDetailPage() {
  const nav = useNavigate({ from: "/app/customers/$id" });
  const { id } = useParams({ from: "/app/customers/$id" });
  const { data: customer, ...result } = useCustomerQuery(id);
  const updateCustomer = useUpdateCustomer(id);
  const deleteCustomer = useDeleteCustomer();
  const [editOpen, setEditOpen] = useState(false);

  const canUpdate = useActionPermission(["customers:update"]);
  const canDelete = useActionPermission(["customers:delete"]);
  const canReadService = useActionPermission(["after-sales:read"]);
  const serviceHistory = useServiceRecordsQuery(
    { customerId: id, limit: 50, offset: 0 },
    canReadService && !!id,
  );

  const handleDelete = async () => {
    if (!customer) return;
    const ok = await confirm({
      title: "ລຶບລູກຄ້າ",
      description:
        customer.salesOrderCount > 0
          ? "ລູກຄ້າມີຄຳສັ່ງຂາຍແລ້ວ — ບໍ່ສາມາດລຶບໄດ້"
          : `ຢືນຢັນລຶບ «${customer.fullName}»?`,
      actionText: "ລຶບ",
      cancelText: "ຍົກເລີກ",
      tone: "destructive",
    });
    if (!ok || customer.salesOrderCount > 0) return;

    deleteCustomer.mutate(id, {
      onSuccess: () => nav({ to: "/app/customers" }),
    });
  };

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              {customer?.fullName ?? "ລາຍລະອຽດລູກຄ້າ"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {customer?.phone ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => nav({ to: "/app/customers" })}>
              <ArrowLeftIcon className="size-4" />
              ກັບ
            </Button>
            {canUpdate ? (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <PencilIcon className="size-4" />
                ແກ້ໄຂ
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="destructive"
                disabled={(customer?.salesOrderCount ?? 0) > 0}
                onClick={handleDelete}
              >
                <TrashIcon className="size-4" />
                ລຶບ
              </Button>
            ) : null}
          </div>
        </div>

        <QueryState result={result} isEmpty={!customer}>
          {customer ? (
            <>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ຂໍ້ມູນຕິດຕໍ່</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="ຊື່" value={customer.fullName} />
                  <InfoRow label="ເບີໂທ" value={customer.phone} />
                  <InfoRow
                    label="ເບີສຳຮອງ"
                    value={customer.phoneSecondary ?? "—"}
                  />
                  <InfoRow label="ທີ່ຢູ່" value={formatAddress(customer)} />
                  <InfoRow
                    label="ເລກບັດ"
                    value={customer.idCardNumber ?? "—"}
                  />
                  <InfoRow
                    label="ສຳມະໂນຄົວ"
                    value={customer.householdBookNumber ?? "—"}
                  />
                  <InfoRow label="ໝາຍເຫດ" value={customer.notes ?? "—"} />
                  <InfoRow
                    label="ສ້າງເມື່ອ"
                    value={formatDateTimeLocal(customer.createdAt)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">ຄຳສັ່ງຂາຍ</CardTitle>
                  <Badge variant="secondary">
                    {customer.salesOrderCount} ລາຍການ
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CustomerOrdersTable
                    data={customer.salesOrders}
                    isLoading={result.isLoading}
                  />
                </CardContent>
              </Card>
            </div>

            {canReadService ? (
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">ປະຫວັດບໍລິການ</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      nav({
                        to: "/app/after-sales/service",
                        search: { customerId: id },
                      })
                    }
                  >
                    ເພີ່ມ check-in
                  </Button>
                </CardHeader>
                <CardContent>
                  <ServiceHistoryTable
                    data={serviceHistory.data?.data ?? []}
                    isLoading={serviceHistory.isLoading}
                    showVehicle
                  />
                </CardContent>
              </Card>
            ) : null}
            </>
          ) : null}
        </QueryState>

        <Modal
          open={editOpen}
          onOpenChange={setEditOpen}
          title="ແກ້ໄຂລູກຄ້າ"
        >
          {customer ? (
            <CustomerForm
              initialValues={customerToFormValues(customer)}
              submitting={updateCustomer.isPending}
              onSubmit={(values) =>
                updateCustomer.mutate(values, {
                  onSuccess: () => setEditOpen(false),
                })
              }
            />
          ) : null}
        </Modal>
      </Main>
    </>
  );
}
