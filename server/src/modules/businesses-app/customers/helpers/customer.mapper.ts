import type { CustomerDbRow, CustomerResponse } from "../types/index.js";

export function mapCustomer(customer: CustomerDbRow): CustomerResponse {
  return {
    idCustomer: customer.idCustomer,
    idBusiness: customer.idBusiness,
    firstName: customer.first_name,
    lastName: customer.last_name,
    fullName: `${customer.first_name} ${customer.last_name}`.trim(),
    documentType: customer.document_type,
    documentNumber: customer.document_number,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    observation: customer.observation,
    isActive: Boolean(customer.is_active),
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
  };
}
