import { Confirmer, Toaster } from "@devhop/ui";
import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { ThemeProvider } from "../providers/ThemeProvider";
import { UpdateBanner } from "./UpdateBanner";

export function RootLayout() {
  const [bannerVisible, setBannerVisible] = useState(false);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="ui-theme"
    >
      <UpdateBanner onVisibilityChange={setBannerVisible} />
      <div className={`min-h-screen ${bannerVisible ? "pt-16" : ""}`}>
        <Outlet />
      </div>
      <Confirmer />
      <Toaster richColors />
    </ThemeProvider>
  );
}
