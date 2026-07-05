import { AppJoyride, type JoyrideCallbackData } from "@/shared/ui/AppJoyride";
import { masterDataTourSteps } from "./tourSteps";

type MasterDataTourProps = {
  run: boolean;
  onCallback: (data: JoyrideCallbackData) => void;
};

export function MasterDataTour({ run, onCallback }: MasterDataTourProps) {
  return (
    <AppJoyride steps={masterDataTourSteps} run={run} onCallback={onCallback} />
  );
}

export { useMasterDataTour } from "./useMasterDataTour";
