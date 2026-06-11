import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Confirmer, Toaster } from "@/components/kit";
import { NotificationProvider } from "../providers/NotificationProvider";
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
      <NotificationProvider>
        <UpdateBanner onVisibilityChange={setBannerVisible} />
        <div className={`min-h-screen ${bannerVisible ? "pt-16" : ""}`}>
          <Outlet />
        </div>
        <Confirmer />
        <Toaster richColors />
      </NotificationProvider>
    </ThemeProvider>
  );
}
