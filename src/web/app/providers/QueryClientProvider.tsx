import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryErrorResetBoundary,
  QueryClientProvider as RQProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function QueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            throwOnError: false,
          },
          mutations: {
            throwOnError: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            const message =
              error instanceof Error ? error.message : "Query error";
            toast.error(message);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            const message =
              error instanceof Error ? error.message : "Mutation error";
            toast.error(message);
          },
        }),
      }),
  );

  return (
    <QueryErrorResetBoundary>
      {() => <RQProvider client={client}>{children}</RQProvider>}
    </QueryErrorResetBoundary>
  );
}
