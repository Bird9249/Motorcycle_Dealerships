import { Confirmer, Toaster } from "@devhop/ui";
import { Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "../providers/ThemeProvider";

export function RootLayout() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="ui-theme"
    >
      <Outlet />
      <Confirmer />
      <Toaster richColors />
    </ThemeProvider>
  );
}
