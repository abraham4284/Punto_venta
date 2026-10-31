import type { Customer } from "../../customers/types/customers.types";
import type { DepositResponse } from "../../deposits/types/deposits.types";
import type { OrderDraft } from "../types/orders.types";

export const defaultOrderDeposit = (deposits: DepositResponse[]) => {
  const deposit = deposits.find((item) => item.isActive && item.isDefault);
  return deposit ? String(deposit.idDeposit) : "";
};

export const deliveryFromCustomer = (customer: Pick<Customer, "fullName" | "phone" | "address">): Pick<OrderDraft, "recipientName" | "recipientPhone" | "address"> => ({
  recipientName: customer.fullName,
  recipientPhone: customer.phone ?? "",
  address: customer.address ?? "",
});
