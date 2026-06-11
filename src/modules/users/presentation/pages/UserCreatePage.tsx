import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, HelpCircleIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { uploadAvatarFile } from "@/shared/lib/upload-avatar";
import { useCreateUser } from "../api/queries";
import { UserFormTour, useUserFormTour } from "../tour";
import { UserForm } from "../ui/UserForm";

export function UserCreatePage() {
  const nav = useNavigate({ from: "/app/users/create" });
  const createUser = useCreateUser();
  const { run, handleJoyrideCallback, startTour } = useUserFormTour();

  return (
    <>
      <Header />

      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="flex items-center font-bold text-2xl tracking-tight">
              ສ້າງຜູ້ໃຊ້{" "}
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
            <p className="text-muted-foreground">ສ້າງຜູ້ໃຊ້ໃໝ່ໃນລະບົບ.</p>
          </div>

          <Button variant="outline" onClick={() => nav({ to: "/app/users" })}>
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <div className="mt-6 rounded-xl border bg-card p-6">
          <UserForm
            onSubmit={async (vals) => {
              try {
                let imageKey = vals.image ?? undefined;
                if (vals.imageFile instanceof File) {
                  imageKey = await uploadAvatarFile(vals.imageFile);
                }
                await createUser.mutateAsync({
                  email: vals.email,
                  name: vals.name,
                  password: vals.password || undefined,
                  roleId: vals.roleId || undefined,
                  image: imageKey,
                });
                toast.success("ສ້າງຜູ້ໃຊ້ສໍາເລັດ", {
                  description: "ຜູ້ໃຊ້ຖືກສ້າງສໍາເລັດແລ້ວ",
                });
                nav({ to: "/app/users" });
              } catch (error) {
                // Error handling is done by the mutation
              }
            }}
            submitting={createUser.isPending}
          />
        </div>

        <UserFormTour run={run} onCallback={handleJoyrideCallback} />
      </Main>
    </>
  );
}
