import { AppJoyride, type JoyrideCallbackData } from "@/shared/ui/AppJoyride";
import { userFormTourSteps } from "./formTourSteps";

type UserFormTourProps = {
  run: boolean;
  onCallback: (data: JoyrideCallbackData) => void;
};

export function UserFormTour({ run, onCallback }: UserFormTourProps) {
  return (
    <AppJoyride steps={userFormTourSteps} run={run} onCallback={onCallback} />
  );
}

export { useUserFormTour } from "./useUserFormTour";
