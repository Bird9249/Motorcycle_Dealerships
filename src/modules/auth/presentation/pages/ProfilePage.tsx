import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { uploadAvatarFile } from "@/shared/lib/upload-avatar";
import { Card, CardContent, CardHeader, CardTitle, toast } from "@devhop/ui";
import { useState } from "react";
import { profileApi } from "../api/client";
import { useAuthState } from "../model/useAuthState";
import { ProfileForm } from "../ui/ProfileForm";

export function ProfilePage() {
  const { user, refetch } = useAuthState();
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <Header />

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ໂປຣໄຟລ໌ຂອງຂ້ອຍ</h2>
            <p className="text-muted-foreground">ຈັດການການຕັ້ງຄ່າບັນຊີ.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ໂປຣໄຟລ໌</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialValues={{
                name: user?.name ?? "",
                image: user?.image ?? undefined,
              }}
              submitting={submitting}
              onSubmit={async (vals) => {
                setSubmitting(true);
                try {
                  let imageKey: string | null | undefined =
                    vals.image ?? undefined;
                  if (vals.imageFile instanceof File) {
                    imageKey = await uploadAvatarFile(vals.imageFile);
                  }
                  const fd = new FormData();
                  fd.append("name", vals.name);
                  if (vals.password) fd.append("password", vals.password);
                  if (vals.image === null && !vals.imageFile) {
                    fd.append("imageDelete", "1");
                  } else if (typeof imageKey === "string" && imageKey) {
                    fd.append("image", imageKey);
                  }
                  await profileApi.update(fd);
                  toast.success("ອັບເດດໂປຣໄຟລ໌ສໍາເລັດ");
                  refetch();
                } finally {
                  setSubmitting(false);
                }
              }}
            />
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
