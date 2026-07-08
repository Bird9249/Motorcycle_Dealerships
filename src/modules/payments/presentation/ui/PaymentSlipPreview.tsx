import { Card, CardContent, CardHeader, CardTitle } from "@/components/kit";
import { AppImage } from "@/shared/ui/AppImage";

type PaymentSlipPreviewProps = {
  slipImageKey: string | null;
  slipUrl: string | null;
  paymentMethod: "cash" | "bank_transfer";
};

export function PaymentSlipPreview({
  slipImageKey,
  slipUrl,
  paymentMethod,
}: PaymentSlipPreviewProps) {
  const src = slipUrl ?? slipImageKey;

  if (paymentMethod === "cash" && !src) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ສລິບ / ຫຼັກຖານ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            ການຊຳລະເງິນສົດ — ບໍ່ມີສລິບແນບ
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!src) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ສລິບ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">ບໍ່ມີຮູບສລິບ</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ສລິບການໂອນ</CardTitle>
      </CardHeader>
      <CardContent>
        <AppImage
          src={src}
          alt="ສລິບການຊຳລະ"
          className="mx-auto aspect-[3/4] max-h-[480px] w-full max-w-sm rounded-lg border bg-muted"
          fit="contain"
        />
      </CardContent>
    </Card>
  );
}
