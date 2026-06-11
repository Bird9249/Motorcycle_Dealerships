import { Suspense } from "react";
import { Loader } from "@/components/kit";

export function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>;
}
