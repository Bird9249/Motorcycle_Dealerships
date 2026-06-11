import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon, HelpCircleIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { uploadAvatarFile } from "@/shared/lib/upload-avatar";
import { QueryState } from "@/shared/ui/QueryState";
import { useUpdateUser, useUserQuery } from "../api/queries";
import { UserFormTour, useUserFormTour } from "../tour";
import { UserForm } from "../ui/UserForm";

export function UserEditPage() {
  const nav = useNavigate({ from: "/app/users/$id/edit" });
  const { id } = useParams({ from: "/app/users/$id/edit" });
  const { data, ...result } = useUserQuery(id);
  const updateUser = useUpdateUser(id);
  const { run, handleJoyrideCallback, startTour } = useUserFormTour();

  const user = data;

  return (
    <>
      <Header />

      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="flex items-center font-bold text-2xl tracking-tight">
              ແກ້ໄຂຜູ້ໃຊ້{" "}
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
            <p className="text-muted-foreground">ປັບປຸງລາຍລະອຽດຂອງຜູ້ໃຊ້.</p>
          </div>

          <Button variant="outline" onClick={() => nav({ to: "/app/users" })}>
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <QueryState
          result={result}
          title="ກໍາລັງໂຫຼດຜູ້ໃຊ້"
          description="ກໍາລັງດຶງລາຍລະອຽດ"
          variant="fullscreen"
        >
          {!user ? null : (
            <div className="mt-6 rounded-xl border bg-card p-6">
              <UserForm
                initialValues={{
                  email: user.email,
                  name: user.name ?? "",
                  roleId:
                    user.roleIds && user.roleIds.length > 0
                      ? (user.roleIds[0] ?? "")
                      : "",
                  image: user.image ?? undefined,
                }}
                onSubmit={async (vals) => {
                  try {
                    let imageKey = vals.image ?? undefined;
                    if (vals.imageFile instanceof File) {
                      imageKey = await uploadAvatarFile(vals.imageFile);
                    }
                    await updateUser.mutateAsync({
                      email: vals.email,
                      name: vals.name,
                      password: vals.password || undefined,
                      roleId: vals.roleId || undefined,
                      image: imageKey,
                      imageDelete: vals.image === null ? "1" : undefined,
                    });
                    toast.success("ແກ້ໄຂຜູ້ໃຊ້ສໍາເລັດ", {
                      description: "ຜູ້ໃຊ້ຖືກອັບເດດສໍາເລັດແລ້ວ",
                    });
                    nav({ to: "/app/users" });
                  } catch (error) {
                    // Error handling is done by the mutation
                  }
                }}
                submitting={updateUser.isPending}
              />
            </div>
          )}
        </QueryState>

        <UserFormTour run={run} onCallback={handleJoyrideCallback} />
      </Main>
    </>
  );
}
