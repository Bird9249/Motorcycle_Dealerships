import { AppJoyride, type JoyrideCallbackData } from "@/shared/ui/AppJoyride";
import { roleFormTourSteps } from "./formTourSteps";

type RoleFormTourProps = {
  run: boolean;
  onCallback: (data: JoyrideCallbackData) => void;
};

export function RoleFormTour({ run, onCallback }: RoleFormTourProps) {
  return (
    <AppJoyride steps={roleFormTourSteps} run={run} onCallback={onCallback} />
  );
}

export { useRoleFormTour } from "./useRoleFormTour";
