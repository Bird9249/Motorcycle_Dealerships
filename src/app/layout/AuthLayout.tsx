import { useAuthState } from "@/modules/auth/presentation/model/useAuthState";
import { Loader } from "@devhop/ui";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuthState();
  const navigate = useNavigate({ from: "/auth" });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/app/dashboard" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-svh max-w-none items-center justify-center">
        <Loader />
      </div>
    );
  }
  return (
    <div className="flex h-svh max-w-none items-center justify-center">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center space-y-2 py-8 sm:p-8">
        <div className="mb-4 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="me-2 h-6 w-6"
            aria-hidden="true"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          <h1 className="font-medium text-xl"> Admin Panel</h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
