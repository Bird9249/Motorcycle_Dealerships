import { Loader } from "@devhop/ui";
import { Suspense } from "react";

export function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>;
}
