import { useCallback, useState } from "react";

const TOUR_STORAGE_KEY = "roles-tour-completed";

export function useRolesTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const hasCompletedTour = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  };

  const startTour = useCallback(() => {
    setRun(true);
    setStepIndex(0);
  }, []);

  const stopTour = useCallback(() => {
    setRun(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }, []);

  const resetTour = useCallback(() => {
    setRun(false);
    setStepIndex(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    }
  }, []);

  const handleJoyrideCallback = useCallback(
    (data: {
      status?: string;
      type?: string;
      index?: number;
      action?: string;
    }) => {
      const { status, type, index, action } = data;

      // อัพเดท stepIndex ทันทีเมื่อมีการเปลี่ยนแปลง
      if (index !== undefined) {
        setStepIndex(index);
      }

      // จัดการเมื่อ tour จบหรือถูก skip
      if (
        status === "finished" ||
        status === "skipped" ||
        type === "tour:end"
      ) {
        stopTour();
        return;
      }

      // จัดการเมื่อกด next หรือ back
      if (action === "next" || action === "prev") {
        // stepIndex จะถูกอัพเดทจาก index ที่ส่งมาแล้ว
      }
    },
    [stopTour],
  );

  return {
    run,
    stepIndex,
    startTour,
    stopTour,
    resetTour,
    hasCompletedTour: hasCompletedTour(),
    handleJoyrideCallback,
  };
}
