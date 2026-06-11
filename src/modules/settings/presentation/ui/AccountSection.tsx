import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from "@/components/kit";
import { profileApi } from "@/modules/auth/presentation/api/client";
import { useAuthState } from "@/modules/auth/presentation/model/useAuthState";
import { ProfileForm } from "@/modules/auth/presentation/ui/ProfileForm";
import { uploadAvatarFile } from "@/shared/lib/upload-avatar";

export function AccountSection() {
  const { user, refetch } = useAuthState();
  const [submitting, setSubmitting] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ບັນຊີ</CardTitle>
        <CardDescription>
          ອັບເດດຊື່, ຮູບໂປຣໄຟລ໌ ແລະ ລະຫັດຜ່ານຂອງທ່ານ.
          {user?.email ? ` (${user.email})` : ""}
        </CardDescription>
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
              let imageKey: string | null | undefined = vals.image ?? undefined;
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
  );
}
