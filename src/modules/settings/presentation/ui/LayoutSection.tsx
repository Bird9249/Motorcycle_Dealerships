import { RotateCcw } from "lucide-react";
import {
  type Collapsible,
  useLayout,
  type Variant,
} from "@/app/providers/LayoutProvider";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Separator,
  toast,
} from "@/components/kit";

const variants: { value: Variant; label: string; hint: string }[] = [
  { value: "inset", label: "Inset", hint: "ມີຂອບ ແລະ ເງົາ" },
  { value: "sidebar", label: "Sidebar", hint: "ຕິດກັບຂອບຊ້າຍ" },
  { value: "floating", label: "Floating", hint: "ລອຍຢູ່ດ້ານຊ້າຍ" },
];

const collapsibles: { value: Collapsible; label: string; hint: string }[] = [
  { value: "icon", label: "ໄອຄອນ", hint: "ຫຍໍ້ເຫຼືອແຕ່ໄອຄອນ" },
  { value: "offcanvas", label: "ເຊື່ອງ", hint: "ຫຍໍ້ແລ້ວເຊື່ອງທັງໝົດ" },
  { value: "none", label: "ຄົງທີ່", hint: "ສະແດງຕະຫຼອດ" },
];

function OptionRow({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint: string;
}) {
  return (
    <Label
      htmlFor={value}
      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary"
    >
      <RadioGroupItem id={value} value={value} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-sm">{label}</span>
        <span className="font-normal text-muted-foreground text-xs">
          {hint}
        </span>
      </span>
    </Label>
  );
}

export function LayoutSection() {
  const { variant, setVariant, collapsible, setCollapsible, resetLayout } =
    useLayout();

  return (
    <Card>
      <CardHeader>
        <CardTitle>ໂຄງຮ່າງ</CardTitle>
        <CardDescription>ປັບແຕ່ງຮູບແບບ ແລະ ການຫຍໍ້ຂອງແຖບເມນູດ້ານຊ້າຍ.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-medium text-sm">ຮູບແບບແຖບເມນູ</span>
          <RadioGroup
            value={variant}
            onValueChange={(v) => setVariant(v as Variant)}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {variants.map((item) => (
              <OptionRow key={item.value} {...item} />
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <span className="font-medium text-sm">ການຫຍໍ້ແຖບເມນູ</span>
          <RadioGroup
            value={collapsible}
            onValueChange={(v) => setCollapsible(v as Collapsible)}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {collapsibles.map((item) => (
              <OptionRow key={item.value} {...item} />
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              resetLayout();
              toast.success("ຣີເຊັດໂຄງຮ່າງເປັນຄ່າເລີ່ມຕົ້ນແລ້ວ");
            }}
          >
            <RotateCcw />
            ຣີເຊັດເປັນຄ່າເລີ່ມຕົ້ນ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
