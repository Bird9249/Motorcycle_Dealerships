import { Header } from "@/web/app/layout/Header";
import { Main } from "@/web/app/layout/Main";
import { config } from "@/web/shared/lib/config";
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
                image: user?.image ? config.apiUrl + user.image : undefined,
              }}
              submitting={submitting}
              onSubmit={async (vals) => {
                setSubmitting(true);
                try {
                  const fd = new FormData();
                  fd.append("name", vals.name);
                  if (vals.password) fd.append("password", vals.password);
                  if (vals.imageFile === null) {
                    fd.append("imageDelete", "1");
                  } else if (vals.imageFile instanceof File) {
                    fd.append("imageFile", vals.imageFile);
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
