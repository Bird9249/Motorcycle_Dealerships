import { Card, CardContent, CardHeader, CardTitle } from "@/components/kit";
import type { PaymentAccountItem } from "../api/client";
import { AppImage } from "@/shared/ui/AppImage";

type QRCodeDisplayProps = {
  account: Pick<
    PaymentAccountItem,
    "name" | "bankName" | "accountNumber" | "qrCodeUrl" | "type"
  > | null;
};

export function QRCodeDisplay({ account }: QRCodeDisplayProps) {
  if (!account || account.type !== "bank_transfer") return null;

  if (!account.qrCodeUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR ໂອນເງິນ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            ບັນຊີນີ້ຍັງບໍ່ມີ QR — ຕັ້ງຄ່າໃນ Settings
          </p>
          {account.bankName || account.accountNumber ? (
            <p className="mt-2 text-sm">
              {[account.bankName, account.accountNumber]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">QR ໂອນເງິນ — {account.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AppImage
          src={account.qrCodeUrl}
          alt={`QR ${account.name}`}
          className="mx-auto aspect-square max-h-64 w-full max-w-64 rounded-lg border bg-muted"
          fit="contain"
        />
        {account.bankName || account.accountNumber ? (
          <p className="text-center text-muted-foreground text-sm">
            {[account.bankName, account.accountNumber]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
