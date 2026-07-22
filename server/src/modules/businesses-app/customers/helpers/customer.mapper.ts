import type { CustomerDbRow, CustomerResponse } from "../types/index.js";

export function mapCustomer(customer: CustomerDbRow): CustomerResponse {
  return {
    idCustomer: customer.idCustomer,
    idBusiness: customer.idBusiness,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    observation: customer.observation,
    isActive: Boolean(customer.is_active),
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  };
}
