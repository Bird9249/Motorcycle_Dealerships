/** biome-ignore-all lint/suspicious/noArrayIndexKey: index used for predictable skeleton keys */
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
} from "@devhop/ui";
import type { QueryObserverResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

type QueryStateProps<TData = unknown, TError = Error> = {
  result?: Pick<
    QueryObserverResult<TData, TError>,
    | "isLoading"
    | "isError"
    | "error"
    | "refetch"
    | "isFetching"
    | "isRefetching"
  >;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  loadingFallback?: ReactNode;
  emptyFallback?: ReactNode;
  errorFallback?: (error: Error, retry?: () => void) => ReactNode;
  onRetry?: () => void;
  title?: string;
  description?: string;
  variant?: "card" | "inline" | "fullscreen";
  skeletonRows?: number;
  className?: string;
  children: ReactNode;
};

export function QueryState<TData = unknown, TError = Error>({
  result,
  isLoading: isLoadingProp,
  isError: isErrorProp,
  isFetching: isFetchingProp,
  error: errorProp,
  isEmpty,
  loadingFallback,
  emptyFallback,
  errorFallback,
  onRetry,
  title,
  description,
  variant = "card",
  skeletonRows = 3,
  className,
  children,
}: QueryStateProps<TData, TError>) {
  const isLoading = isLoadingProp ?? result?.isLoading ?? false;
  const isError = isErrorProp ?? result?.isError ?? false;
  const isFetching =
    isFetchingProp ?? result?.isFetching ?? result?.isRefetching ?? false;
  const error = errorProp ?? result?.error;
  const retry =
    onRetry ?? (result?.refetch ? () => void result.refetch() : undefined);

  if (isLoading) {
    return (
      <>
        {loadingFallback ?? (
          <div
            className={cn(
              variant === "fullscreen" &&
                "grid min-h-[60vh] place-items-center",
              className,
            )}
          >
            <Card className={cn(variant !== "inline" && "w-full max-w-xl")}>
              <CardHeader>
                <CardTitle>{title ?? "ກໍາລັງໂຫຼດ"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: skeletonRows }).map((_, i) => (
                  <Skeleton
                    key={`skeleton-${i}`}
                    className={cn(
                      "h-4",
                      i === 0
                        ? "w-40"
                        : i === skeletonRows - 1
                          ? "w-2/3"
                          : "w-5/6",
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  if (isError) {
    const err = error instanceof Error ? error : new Error("ບໍ່ຮູ້ສາເຫດ");
    return (
      <>
        {errorFallback ? (
          errorFallback(err, retry)
        ) : (
          <div
            className={cn(
              variant === "fullscreen" &&
                "grid min-h-[60vh] place-items-center",
              className,
            )}
          >
            <Card className={cn(variant !== "inline" && "w-full max-w-xl")}>
              <CardHeader>
                <CardTitle>{title ?? "ຜິດພາດ"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {description ? (
                    <p className="text-muted-foreground">{description}</p>
                  ) : null}
                  <p className="text-destructive">{err.message}</p>
                  {retry ? (
                    <Button variant="outline" onClick={retry}>
                      ລອງໃໝ່
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  if (isEmpty) {
    return (
      <>
        {emptyFallback ?? (
          <div
            className={cn(
              variant === "fullscreen" &&
                "grid min-h-[40vh] place-items-center",
              className,
            )}
          >
            <Card className={cn(variant !== "inline" && "w-full max-w-xl")}>
              <CardHeader>
                <CardTitle>{title ?? "ບໍ່ມີຂໍ້ມູນ"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {description ?? "ບໍ່ມີຂໍ້ມູນສໍາລັບສະແດງໃນຂະນະນີ້."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  if (isFetching) {
    return (
      <div className={cn("relative", className)}>
        <div className="pointer-events-none absolute top-3 right-3 rounded-md bg-secondary px-2 py-1 text-secondary-foreground text-xs shadow-sm">
          ກໍາລັງອັບເດດ…
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
