/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { confirm } from "@devhop/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./app/router";
import "./index.css";
import { registerSW } from "./shared/lib/register-sw";

const queryClient = new QueryClient();

const elem = document.getElementById("root");
if (!elem) throw new Error("Root element not found");

const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* {process.env.NODE_ENV !== "production" ? (
        <ReactQueryDevtools buttonPosition="bottom-right" />
      ) : null} */}
    </QueryClientProvider>
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  let root = import.meta.hot.data.root;
  if (!root) {
    root = createRoot(elem);
    import.meta.hot.data.root = root;
  }
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);

  if ("serviceWorker" in navigator) {
    // Register service worker with update handling
    registerSW((activateUpdate) => {
      // Show update prompt to user
      showUpdatePrompt(activateUpdate);
    });
  }

  async function showUpdatePrompt(activateUpdate: () => void) {
    const ok = await confirm({
      title: "ມີເວີຊັນໃໝ່ພ້ອມໃຫ້ໃຊ້ງານ",
      description: "ຕ້ອງການອັບເດດເປັນເວີຊັນຫຼ້າສຸດດຽວນີ້ບໍ?",
      actionText: "ອັບເດດ",
      ActionProps: {
        variant: "default",
      },
    });

    if (ok) {
      // Activate the update
      activateUpdate();
    }
  }
}
