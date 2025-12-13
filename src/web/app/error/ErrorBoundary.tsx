import { Button } from "@devhop/ui";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export function ErrorBoundary({ error }: { error: unknown }) {
  const router = useRouter();
  const { reset } = useQueryErrorResetBoundary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error instanceof Error ? error.message : "ມີບາງຢ່າງຜິດພາດ";

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-2 font-semibold text-2xl">ເກີດຂໍ້ຜິດພາດ</h1>
      <p className="mb-4 text-muted-foreground">{message}</p>
      <Button
        variant="outline"
        onClick={() => {
          reset();
          router.invalidate();
        }}
      >
        ລອງໃໝ່
      </Button>
    </div>
  );
}
