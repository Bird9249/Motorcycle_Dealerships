import type {
  RoleCreateInput,
  RoleUpdateInput,
} from "@/server/modules/rbac/contracts";
import type { PermissionId } from "@/server/shared/contracts/permissions";
import {
  Permissions,
  getActionLabel,
  getResourceLabel,
} from "@/server/shared/contracts/permissions";
import {
  Button,
  Checkbox,
  FormInput,
  FormRoot,
  FormTextarea,
  RHF,
  ScrollArea,
  zodResolver,
} from "@devhop/ui";
import { z } from "zod";

const RoleFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().nullable().optional(),
  permissions: z.array(z.string()),
});

export type RoleFormValues = z.infer<typeof RoleFormSchema>;

export function RoleForm({
  initialValues,
  onSubmit,
  submitting,
}: {
  initialValues?: Partial<RoleFormValues>;
  onSubmit: (values: RoleCreateInput | RoleUpdateInput) => void;
  submitting?: boolean;
}) {
  const methods = RHF.useForm<RoleFormValues>({
    resolver: zodResolver(RoleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
      ...initialValues,
    },
  });

  const selected = methods.watch("permissions") as string[];

  const toggleMany = (ids: string[], checked: boolean) => {
    const current = selected ?? [];
    if (checked) {
      const set = new Set([...(current as string[]), ...ids]);
      methods.setValue("permissions", Array.from(set));
    } else {
      methods.setValue(
        "permissions",
        (current as string[]).filter((id) => !ids.includes(id)),
      );
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    const current = selected ?? [];
    if (checked) {
      if (!(current as string[]).includes(id))
        methods.setValue("permissions", [...(current as string[]), id]);
    } else {
      methods.setValue(
        "permissions",
        (current as string[]).filter((x) => x !== id),
      );
    }
  };

  return (
    <FormRoot<RoleFormValues>
      methods={methods}
      onSubmit={(vals) =>
        onSubmit({
          name: vals.name,
          description: vals.description ?? null,
          permissions: vals.permissions as PermissionId[],
        })
      }
      className="space-y-4"
    >
      <FormInput
        name="name"
        label="ຊື່ບົດບາດ"
        requiredMark
        placeholder="ຕົວຢ່າງ: Admin"
      />
      <FormTextarea
        name="description"
        label="ຄໍາອະທິບາຍ"
        placeholder="ຕົວຢ່າງ: ບົດບາດ Admin ທີ່ສາມາດເຂົ້າເຖິງທຸກຟີຈເຈີ"
      />
      <div>
        <div className="mb-2 block text-sm">ສິດທິ</div>
        <ScrollArea className="max-h-72 overflow-auto rounded-md border p-2">
          <div className="space-y-3 pr-1">
            {Object.entries(Permissions).map(([resource, actions]) => {
              const groupIds = Object.values(actions) as string[];
              const allChecked = groupIds.every((id) => selected?.includes(id));
              const someChecked =
                groupIds.some((id) => selected?.includes(id)) && !allChecked;
              const friendlyResource = getResourceLabel(resource);
              return (
                <div key={resource} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    {(() => {
                      const groupInputId = `perm-group-${resource}`;
                      return (
                        <>
                          <Checkbox
                            id={groupInputId}
                            checked={allChecked}
                            onCheckedChange={(val) =>
                              toggleMany(groupIds, Boolean(val))
                            }
                            aria-checked={someChecked ? "mixed" : allChecked}
                          />
                          <label htmlFor={groupInputId} className="font-medium">
                            {friendlyResource}
                          </label>
                        </>
                      );
                    })()}
                  </div>
                  <div className="grid gap-2 pl-6 sm:grid-cols-2 md:grid-cols-3">
                    {Object.entries(actions).map(([action, id]) => {
                      const idStr = id as string;
                      const checked = selected?.includes(idStr) ?? false;
                      const inputId = `perm-${resource}-${idStr}`;
                      const friendlyAction = getActionLabel(action);
                      return (
                        <div key={idStr} className="flex items-center gap-2">
                          <Checkbox
                            id={inputId}
                            checked={checked}
                            onCheckedChange={(val) =>
                              toggleOne(idStr, Boolean(val))
                            }
                          />
                          <label htmlFor={inputId} className="text-sm">
                            {friendlyAction} {friendlyResource}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          ບັນທຶກ
        </Button>
      </div>
    </FormRoot>
  );
}
