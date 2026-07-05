import { AppJoyride, type JoyrideCallbackData } from "@/shared/ui/AppJoyride";
import { rolesTourSteps } from "./tourSteps";

type RolesTourProps = {
  run: boolean;
  onCallback: (data: JoyrideCallbackData) => void;
};

export function RolesTour({ run, onCallback }: RolesTourProps) {
  return <AppJoyride steps={rolesTourSteps} run={run} onCallback={onCallback} />;
}

export { useRolesTour } from "./useRolesTour";
