import {
  Joyride,
  type EventData,
  type Step,
} from "react-joyride";

export type JoyrideCallbackData = {
  status?: string;
  type?: string;
  index?: number;
  action?: string;
};

type AppJoyrideProps = {
  steps: Step[];
  run: boolean;
  onCallback: (data: JoyrideCallbackData) => void;
};

const locale = {
  back: "ກັບ",
  close: "ປິດ",
  last: "ສິ້ນສຸດ",
  next: "ຕໍ່",
  open: "ເປີດ",
  skip: "ຂ້າມ",
};

const options = {
  showProgress: true,
  buttons: ["back", "close", "primary", "skip"] as const,
  primaryColor: "#000000",
  zIndex: 10000,
};

const styles = {
  tooltip: {
    borderRadius: 0,
    border: "1px solid #000000",
    padding: "24px",
  },
  tooltipContainer: {
    textAlign: "left" as const,
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
  buttonPrimary: {
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
};

export function AppJoyride({ steps, run, onCallback }: AppJoyrideProps) {
  const handleEvent = (data: EventData) => {
    const { status, type, index, action } = data;
    onCallback({ status, type, index, action });
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      locale={locale}
      options={options}
      styles={styles}
    />
  );
}
