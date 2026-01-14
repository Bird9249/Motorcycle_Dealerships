import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { QueryState } from "@/shared/ui/QueryState";
import { Button, toast } from "@devhop/ui";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon, HelpCircleIcon } from "lucide-react";
import { useRoleQuery, useUpdateRole } from "../api/queries";
import { RoleFormTour, useRoleFormTour } from "../tour";
import { RoleForm } from "../ui/RoleForm";

export function RoleEditPage() {
  const nav = useNavigate({ from: "/app/roles/$id/edit" });
  const { id } = useParams({ from: "/app/roles/$id/edit" });
  const { data, ...result } = useRoleQuery(id);
  const updateRole = useUpdateRole(id);
  const { run, handleJoyrideCallback, startTour } = useRoleFormTour();

  const role = data;

  return (
    <>
      <Header />

      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="flex items-center font-bold text-2xl tracking-tight">
              ແກ້ໄຂບົດບາດ{" "}
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
            <p className="text-muted-foreground">ປັບປຸງລາຍລະອຽດແລະສິດທິຂອງບົດບາດ.</p>
          </div>

          <Button variant="outline" onClick={() => nav({ to: "/app/roles" })}>
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <QueryState
          result={result}
          title="ກໍາລັງໂຫຼດບົດບາດ"
          description="ກໍາລັງດຶງລາຍລະອຽດ"
          variant="fullscreen"
        >
          {!role ? null : (
            <div className="mt-6 rounded-xl border bg-card p-6">
              <RoleForm
                initialValues={{
                  name: role.name,
                  description: role.description,
                  permissions: role.permissions,
                }}
                onSubmit={async (vals) => {
                  try {
                    await updateRole.mutateAsync(vals);
                    toast.success("ແກ້ໄຂບົດບາດສໍາເລັດ", {
                      description: "ບົດບາດຖືກອັບເດດສໍາເລັດແລ້ວ",
                    });
                    nav({ to: "/app/roles" });
                  } catch (error) {
                    // Error handling is done by the mutation
                  }
                }}
                submitting={updateRole.isPending}
              />
            </div>
          )}
        </QueryState>

        <RoleFormTour run={run} onCallback={handleJoyrideCallback} />
      </Main>
    </>
  );
}
