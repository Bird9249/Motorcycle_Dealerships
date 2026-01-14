import Joyride, { type CallBackProps } from "react-joyride";
import { usersTourSteps } from "./tourSteps";

type UsersTourProps = {
  run: boolean;
  onCallback: (data: {
    status?: string;
    type?: string;
    index?: number;
    action?: string;
  }) => void;
};

export function UsersTour({ run, onCallback }: UsersTourProps) {
  const handleCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;
    onCallback({ status, type, index, action });
  };

  return (
    <>
      <Joyride
        steps={usersTourSteps}
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleCallback}
        locale={{
          back: "ກັບ",
          close: "ປິດ",
          last: "ສິ້ນສຸດ",
          next: "ຕໍ່",
          open: "ເປີດ",
          skip: "ຂ້າມ",
        }}
        styles={{
          options: {
            primaryColor: "#000000",
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 0,
            border: "1px solid #000000",
            padding: "24px",
          },
          tooltipContainer: {
            textAlign: "left",
          },
          tooltipTitle: {
            fontSize: "16px",
            fontWeight: 600,
            color: "#000000",
            marginBottom: "8px",
          },
          tooltipContent: {
            fontSize: "14px",
            color: "#000000",
            lineHeight: "1.5",
            padding: 0,
          },
          buttonNext: {
            borderRadius: 0,
            backgroundColor: "#000000",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 500,
            padding: "8px 16px",
            border: "1px solid #000000",
          },
          buttonBack: {
            borderRadius: 0,
            color: "#000000",
            fontSize: "14px",
            fontWeight: 500,
            padding: "8px 16px",
            border: "1px solid #000000",
            backgroundColor: "transparent",
          },
          buttonSkip: {
            borderRadius: 0,
            color: "#666666",
            fontSize: "14px",
            fontWeight: 400,
            padding: "8px 16px",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          spotlight: {
            borderRadius: 0,
          },
        }}
      />
    </>
  );
}

export { useUsersTour } from "./useUsersTour";
