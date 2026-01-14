import type {
  RoleCreateInput,
  RoleUpdateInput,
} from "@/modules/roles/domain/contracts";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import {
  Permissions,
  getActionLabel,
  getResourceLabel,
} from "@/modules/roles/domain/contracts/permissions";
import {
  Badge,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  FormInput,
  FormRoot,
  FormTextarea,
  Input,
  RHF,
  ScrollArea,
  useDebounceCallback,
  zodResolver,
} from "@devhop/ui";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounceCallback((val: string) => {
    setSearchQuery(val);
  }, 300);

  const filteredPermissions = Object.entries(Permissions).filter(
    ([resource, actions]) => {
      if (!searchQuery) return true;
      const resourceLabel = getResourceLabel(resource);
      const actionLabels = Object.keys(actions).map((action) =>
        getActionLabel(action),
      );
      const searchLower = searchQuery.toLowerCase();
      return (
        resourceLabel.toLowerCase().includes(searchLower) ||
        actionLabels.some((label) => label.toLowerCase().includes(searchLower))
      );
    },
  );

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
      <div data-tourid="form-name">
        <FormInput
          name="name"
          label="ຊື່ບົດບາດ"
          requiredMark
          placeholder="ຕົວຢ່າງ: Admin"
        />
      </div>
      <div data-tourid="form-description">
        <FormTextarea
          name="description"
          label="ຄໍາອະທິບາຍ"
          placeholder="ຕົວຢ່າງ: ບົດບາດ Admin ທີ່ສາມາດເຂົ້າເຖິງທຸກຟີຈເຈີ"
        />
      </div>
      <div>
        <div className="mb-2 block text-sm">ສິດທິ</div>
        <div className="mb-3" data-tourid="form-permissions-search">
          <Input
            placeholder="ຄົ້ນຫາສິດທິ..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea
          className="max-h-96 overflow-auto rounded-md border p-4"
          data-tourid="form-permissions"
        >
          <div className="space-y-3 pr-1">
            {filteredPermissions.map(([resource, actions]) => {
              const groupIds = Object.values(actions) as string[];
              const allChecked = groupIds.every((id) => selected?.includes(id));
              const someChecked =
                groupIds.some((id) => selected?.includes(id)) && !allChecked;
              const friendlyResource = getResourceLabel(resource);
              const selectedCount = groupIds.filter((id) =>
                selected?.includes(id),
              ).length;
              const totalCount = groupIds.length;

              return (
                <Collapsible
                  key={resource}
                  defaultOpen={false}
                  className="group/collapsible"
                >
                  <div className="rounded-md border">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex w-full items-center justify-between p-3 hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          <Checkbox
                            id={`perm-group-${resource}`}
                            checked={allChecked}
                            onCheckedChange={(val) =>
                              toggleMany(groupIds, Boolean(val))
                            }
                            aria-checked={someChecked ? "mixed" : allChecked}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <label
                            htmlFor={`perm-group-${resource}`}
                            className="cursor-pointer font-medium"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                              }
                            }}
                          >
                            {friendlyResource}
                          </label>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {selectedCount}/{totalCount}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid gap-2 border-t bg-muted/30 p-3 sm:grid-cols-2 md:grid-cols-3">
                        {Object.entries(actions).map(([action, id]) => {
                          const idStr = id as string;
                          const checked = selected?.includes(idStr) ?? false;
                          const inputId = `perm-${resource}-${idStr}`;
                          const friendlyAction = getActionLabel(action);
                          return (
                            <div
                              key={idStr}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={inputId}
                                checked={checked}
                                onCheckedChange={(val) =>
                                  toggleOne(idStr, Boolean(val))
                                }
                              />
                              <label
                                htmlFor={inputId}
                                className="cursor-pointer text-sm"
                              >
                                {friendlyAction} {friendlyResource}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
            {filteredPermissions.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                ບໍ່ພົບສິດທິທີ່ຕົງກັບການຄົ້ນຫາ
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="flex justify-end gap-2" data-tourid="form-submit">
        <Button type="submit" disabled={submitting}>
          ບັນທຶກ
        </Button>
      </div>
    </FormRoot>
  );
}
