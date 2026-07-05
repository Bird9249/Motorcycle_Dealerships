import { confirm } from "@/components/kit";

type DeactivateEntity = "brand" | "model" | "color";

const entityLabels: Record<DeactivateEntity, string> = {
  brand: "ຍີ່ຫໍ້",
  model: "ລຸ່ນ",
  color: "ສີ",
};

type ConfirmDeactivateOptions = {
  modelCount?: number;
  vehicleCount?: number;
};

export async function confirmDeactivate(
  entity: DeactivateEntity,
  name: string,
  options: ConfirmDeactivateOptions = {},
): Promise<boolean> {
  const label = entityLabels[entity];
  const lines = [
    `ທ່ານແນ່ໃຈບໍ່ວ່າຈະປິດໃຊ້ງານ${label} "${name}"?`,
    "ລາຍການທີ່ປິດແລ້ວຈະບໍ່ໂຊໃນການສ້າງລົດໃໝ່ ແຕ່ຂໍ້ມູນເກົ່າຍັງອ້າງອີງໄດ້.",
  ];

  if (entity === "brand" && (options.modelCount ?? 0) > 0) {
    lines.push(
      `ມີ ${options.modelCount} ລຸ່ນໃຕ້ຍີ່ຫໍ້ນີ້ — ລຸ່ນທີ່ຍັງເປີດຢູ່ຈະບໍ່ໂຊໃນ dropdown.`,
    );
  }

  if (entity === "model" && (options.vehicleCount ?? 0) > 0) {
    lines.push(
      `ມີ ${options.vehicleCount} ຄັນລົດອ້າງອີງລຸ່ນນີ້ — ລົດເກົ່າຍັງສະແດງລຸ່ນນີ້ໄດ້.`,
    );
  }

  return confirm({
    title: `ປິດໃຊ້ງານ${label}`,
    description: (
      <span className="block whitespace-pre-line">{lines.join("\n\n")}</span>
    ),
    actionText: "ປິດໃຊ້ງານ",
    ActionProps: { variant: "destructive" },
  });
}
