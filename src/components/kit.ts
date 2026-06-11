/**
 * Compatibility barrel that replaces the former `@devhop/ui` package.
 * Re-exports shadcn/ui primitives (added via the shadcn CLI) plus the local
 * abstractions that mirror the previous design-system API.
 */

export { zodResolver } from "@hookform/resolvers/zod";
export * as TanstackReactTable from "@tanstack/react-table";
// Namespaced re-exports (previously provided by @devhop/ui)
export * as RHF from "react-hook-form";
// Toast (sonner)
export { toast } from "sonner";
// Local abstractions (mirror the old @devhop/ui higher-level components)
export { Confirmer, confirm } from "@/components/confirm";
export * from "@/components/data-table";
export type { DatePickerProps, DateRange } from "@/components/date-picker";
export { DatePicker } from "@/components/date-picker";
// Form helpers
export {
  Field,
  FormActions,
  FormAvatarUpload,
  FormCheckbox,
  FormDatePicker,
  FormInfiniteCombobox,
  FormInput,
  FormPassword,
  type FormPasswordProps,
  FormRoot,
  FormTextarea,
  useFieldError,
} from "@/components/form";
export { default as Loader } from "@/components/loader";
export type { ModalProps } from "@/components/modal";
export { ConfirmModal, Modal } from "@/components/modal";
export { ModeToggle } from "@/components/mode-toggle";
export {
  SimpleDropdown,
  type SimpleDropdownItem,
  type SimpleDropdownProps,
} from "@/components/simple-dropdown";
export { ThemeProvider, useTheme } from "@/components/theme-provider";
// shadcn/ui primitives
export * from "@/components/ui/accordion";
export * from "@/components/ui/alert";
export * from "@/components/ui/alert-dialog";
export * from "@/components/ui/aspect-ratio";
export * from "@/components/ui/avatar";
export * from "@/components/ui/badge";
export * from "@/components/ui/breadcrumb";
export * from "@/components/ui/button";
export * from "@/components/ui/button-group";
export * from "@/components/ui/calendar";
export * from "@/components/ui/card";
export * from "@/components/ui/carousel";
export * from "@/components/ui/chart";
export * from "@/components/ui/checkbox";
export * from "@/components/ui/collapsible";
export * from "@/components/ui/combobox";
export * from "@/components/ui/command";
export * from "@/components/ui/context-menu";
export * from "@/components/ui/dialog";
export * from "@/components/ui/direction";
export * from "@/components/ui/drawer";
export * from "@/components/ui/dropdown-menu";
export * from "@/components/ui/empty";
export {
  Field as FieldLayout,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
export * from "@/components/ui/form";
export * from "@/components/ui/hover-card";
export * from "@/components/ui/input";
export * from "@/components/ui/input-group";
export * from "@/components/ui/input-otp";
export * from "@/components/ui/item";
export * from "@/components/ui/kbd";
export * from "@/components/ui/label";
export * from "@/components/ui/menubar";
export * from "@/components/ui/native-select";
export * from "@/components/ui/navigation-menu";
export * from "@/components/ui/pagination";
export * from "@/components/ui/popover";
export * from "@/components/ui/progress";
export * from "@/components/ui/radio-group";
export * from "@/components/ui/resizable";
export * from "@/components/ui/scroll-area";
export * from "@/components/ui/select";
export * from "@/components/ui/separator";
export * from "@/components/ui/sheet";
export * from "@/components/ui/sidebar";
export * from "@/components/ui/skeleton";
export * from "@/components/ui/slider";
export { Toaster } from "@/components/ui/sonner";
export * from "@/components/ui/spinner";
export * from "@/components/ui/switch";
export * from "@/components/ui/table";
export * from "@/components/ui/tabs";
export * from "@/components/ui/textarea";
export * from "@/components/ui/toggle";
export * from "@/components/ui/toggle-group";
export * from "@/components/ui/tooltip";
// Hooks
export { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
export { useDebounceCallback } from "@/hooks/use-debounce-callback";
export { useIsMobile } from "@/hooks/use-mobile";
// Utilities
export { cn } from "@/lib/utils";
