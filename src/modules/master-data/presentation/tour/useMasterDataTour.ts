import { useCallback, useState } from "react";

const TOUR_STORAGE_KEY = "master-data-tour-completed";

export function useMasterDataTour() {
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
      const { status, type, index } = data;

      if (index !== undefined) {
        setStepIndex(index);
      }

      if (
        status === "finished" ||
        status === "skipped" ||
        type === "tour:end"
      ) {
        stopTour();
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
