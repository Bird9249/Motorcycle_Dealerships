import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  confirm,
  Label,
  Textarea,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import {
  useRejectPayment,
  useVerifyPayment,
} from "../api/queries";

type PaymentVerifyActionsProps = {
  paymentId: string;
  status: "pending" | "verified" | "rejected";
};

export function PaymentVerifyActions({
  paymentId,
  status,
}: PaymentVerifyActionsProps) {
  const canVerify = useActionPermission(["payments:verify"]);
  const canReject = useActionPermission(["payments:reject"]);
  const verifyPayment = useVerifyPayment();
  const rejectPayment = useRejectPayment();
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (status !== "pending") return null;
  if (!canVerify && !canReject) return null;

  const busy = verifyPayment.isPending || rejectPayment.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ການຢືນຢັນສລິບ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showRejectForm ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">ເຫດຜົນປະຕິເສດ</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ອະທິບາຍເຫດຜົນ..."
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                disabled={busy || !reason.trim()}
                onClick={() =>
                  rejectPayment.mutate(
                    { id: paymentId, reason: reason.trim() },
                    {
                      onSuccess: () => {
                        setShowRejectForm(false);
                        setReason("");
                      },
                    },
                  )
                }
              >
                <XIcon className="size-4" />
                ຢືນຢັນປະຕິເສດ
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setShowRejectForm(false);
                  setReason("");
                }}
              >
                ຍົກເລີກ
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {canVerify ? (
              <Button
                disabled={busy}
                onClick={async () => {
                  const ok = await confirm({
                    title: "ຢືນຢັນສລິບ?",
                    description: "ການຊຳລະນີ້ຈະຖືກບັນທຶກເປັນຢືນຢັນແລ້ວ",
                    actionText: "ຢືນຢັນ",
                  });
                  if (ok) verifyPayment.mutate(paymentId);
                }}
              >
                <CheckIcon className="size-4" />
                ຢືນຢັນສລິບ
              </Button>
            ) : null}
            {canReject ? (
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => setShowRejectForm(true)}
              >
                <XIcon className="size-4" />
                ປະຕິເສດ
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
