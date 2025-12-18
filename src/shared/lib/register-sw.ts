export async function registerSW(
  onUpdateFound: (activateUpdate: () => void) => void,
) {
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.register("/service-worker.js");

  let isUpdateActivated = false; // Flag to track if user activated update

  // ถ้ามี SW ตัวใหม่รออยู่แล้ว
  if (reg.waiting) {
    // Dispatch custom event to show banner
    window.dispatchEvent(
      new CustomEvent("sw-update-available", {
        detail: {
          onUpdate: () => {
            isUpdateActivated = true;
            activateUpdate(reg);
          },
        },
      }),
    );

    onUpdateFound(() => {
      isUpdateActivated = true;
      activateUpdate(reg);
    });
  }

  // ฟังตอนเจอ SW ตัวใหม่ระหว่างใช้งาน
  reg.addEventListener("updatefound", () => {
    const newWorker = reg.installing;
    if (!newWorker) return;

    newWorker.addEventListener("statechange", () => {
      // ติดตั้งเสร็จ และมี SW ตัวเก่าคุมอยู่ => แปลว่ามีอัปเดตพร้อมให้ใช้
      if (
        newWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        // Dispatch custom event to show banner
        window.dispatchEvent(
          new CustomEvent("sw-update-available", {
            detail: {
              onUpdate: () => {
                isUpdateActivated = true;
                activateUpdate(reg);
              },
            },
          }),
        );

        onUpdateFound(() => {
          isUpdateActivated = true;
          activateUpdate(reg);
        });
      }
    });
  });

  // Listen for controller change (backup - in case force reload doesn't work)
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("Controller changed as backup mechanism");
    if (isUpdateActivated) {
      window.location.reload();
    }
  });

  // Check for updates every 5 seconds
  setInterval(() => {
    reg.update().catch((error) => {
      console.error("Error checking for service worker update:", error);
    });
  }, 5000);
}

function activateUpdate(reg: ServiceWorkerRegistration) {
  console.log("Activating update, SW states:", {
    installing: !!reg.installing,
    waiting: !!reg.waiting,
    active: !!reg.active,
  });

  // Always force a reload when user confirms update
  // This ensures the latest version is loaded regardless of SW state
  console.log("User confirmed update - force reloading page");
  setTimeout(() => {
    window.location.reload();
  }, 100);
}
