import { Button } from "@devhop/ui";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface UpdateBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export function UpdateBanner({ onVisibilityChange }: UpdateBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [onUpdateCallback, setOnUpdateCallback] = useState<(() => void) | null>(
    null,
  );

  const setVisible = (visible: boolean) => {
    setIsVisible(visible);
    onVisibilityChange?.(visible);
  };

  useEffect(() => {
    // Listen for update available event
    const handleUpdateAvailable = (event: CustomEvent) => {
      setOnUpdateCallback(() => event.detail.onUpdate);
      setVisible(true);
    };

    window.addEventListener(
      "sw-update-available",
      handleUpdateAvailable as EventListener,
    );

    return () => {
      window.removeEventListener(
        "sw-update-available",
        handleUpdateAvailable as EventListener,
      );
    };
  }, [onVisibilityChange]);

  const hideBanner = () => {
    setVisible(false);
    setOnUpdateCallback(null);
  };

  const handleUpdate = () => {
    if (onUpdateCallback) {
      onUpdateCallback();
    }
    hideBanner();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 bg-primary px-4 py-3 text-primary-foreground shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-5 w-5" />
          <div>
            <p className="font-medium">ມີເວີຊັນໃໝ່ພ້ອມໃຫ້ໃຊ້ງານ</p>
            {/* <p className="text-primary-foreground/80 text-sm">
              ກົດປຸ່ມອັບເດດເພື່ອໄດ້ຮັບເວີຊັນຫຼ້າສຸດ
            </p> */}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpdate}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            ອັບເດດ
          </Button>
        </div>
      </div>
    </div>
  );
}
