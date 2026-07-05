import type { OffsetPageDTO } from "@/shared/contracts/base";
import type {
  CreateSalesOrderDTO,
  SalesOrderDTO,
  UpdateSalesOrderDTO,
} from "../contracts";

export type CreateSalesOrderInput = CreateSalesOrderDTO & {
  salespersonId: string;
  createdBy?: string | null;
};

export type UpdateSalesOrderInput = UpdateSalesOrderDTO;

export type SalesOrderDetail = SalesOrderDTO & {
  customer: {
    id: string;
    fullName: string;
    phone: string;
  };
  vehicle: {
    id: string;
    status: string;
    chassisNumber: string | null;
    modelName: string;
    brandName: string;
    colorName: string;
  };
  salesperson: {
    id: string;
    name: string;
  };
  financeCompany: {
    id: string;
    name: string;
    code: string;
  } | null;
  paymentSchedules: Array<{
    id: string;
    installmentNumber: number;
    dueDate: string;
    amount: string;
    currency: string;
    status: string;
  }>;
};

export type SalesOrderListItem = Omit<
  SalesOrderDetail,
  "paymentSchedules" | "notes"
> & {
  notes: string | null;
};

export type SalesOrdersListResult = OffsetPageDTO<SalesOrderListItem>;

export function toPriceString(value: string | number): string {
  return typeof value === "number" ? value.toFixed(2) : value;
}

export function toOptionalPriceString(
  value: string | number | undefined | null,
): string | null {
  if (value === undefined || value === null) return null;
  return toPriceString(value);
}

export function toOptionalRateString(
  value: string | number | undefined | null,
): string | null {
  if (value === undefined || value === null) return null;
  return typeof value === "number" ? value.toFixed(6) : value;
}
