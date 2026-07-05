import { AppJoyride, type JoyrideCallbackData } from "@/shared/ui/AppJoyride";
import { usersTourSteps } from "./tourSteps";

type UsersTourProps = {
  run: boolean;
  onCallback: (data: JoyrideCallbackData) => void;
};

export function UsersTour({ run, onCallback }: UsersTourProps) {
  return <AppJoyride steps={usersTourSteps} run={run} onCallback={onCallback} />;
}

export { useUsersTour } from "./useUsersTour";
