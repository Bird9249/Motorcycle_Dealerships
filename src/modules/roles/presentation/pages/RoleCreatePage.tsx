import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { Button, toast } from "@devhop/ui";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, HelpCircleIcon } from "lucide-react";
import { useCreateRole } from "../api/queries";
import { RoleFormTour, useRoleFormTour } from "../tour";
import { RoleForm } from "../ui/RoleForm";

export function RoleCreatePage() {
  const nav = useNavigate({ from: "/app/roles/create" });
  const createRole = useCreateRole();
  const { run, handleJoyrideCallback, startTour } = useRoleFormTour();

  return (
    <>
      <Header />

      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="flex items-center font-bold text-2xl tracking-tight">
              ສ້າງບົດບາດ{" "}
              <Button
                variant="ghost"
                size="icon"
                onClick={startTour}
                className="ml-2 size-6"
                title="ເລີ່ມທົດລອງການນຳທາງ"
              >
                <HelpCircleIcon className="h-4 w-4" />
              </Button>
            </h2>
            <p className="text-muted-foreground">
              ກໍານົດຊື່, ຄໍາອະທິບາຍ, ແລະສິດທິຂອງບົດບາດ.
            </p>
          </div>

          <Button variant="outline" onClick={() => nav({ to: "/app/roles" })}>
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <div className="mt-6 rounded-xl border bg-card p-6">
          <RoleForm
            onSubmit={async (vals) => {
              try {
                await createRole.mutateAsync({
                  name: vals.name ?? "",
                  description: vals.description ?? null,
                  permissions: vals.permissions as PermissionId[],
                });
                toast.success("ສ້າງບົດບາດສໍາເລັດ", {
                  description: "ບົດບາດຖືກສ້າງສໍາເລັດແລ້ວ",
                });
                nav({ to: "/app/roles" });
              } catch (error) {
                // Error handling is done by the mutation
              }
            }}
            submitting={createRole.isPending}
          />
        </div>

        <RoleFormTour run={run} onCallback={handleJoyrideCallback} />
      </Main>
    </>
  );
}
