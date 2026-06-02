/**
 * Formatea un número a formato moneda según país y moneda.
 * @param {number} amount - El monto a formatear
 * @param {string} [currency="ARS"] - Código de moneda ISO (ej: "ARS", "USD", "EUR")
 * @param {string} [locale="es-AR"] - Código de localización (ej: "es-AR", "en-US")
 * @returns {string} - Monto formateado en moneda
 */
export function formatCurrency(amount: number, currency = "ARS", locale = "es-AR") {
  if (isNaN(amount)) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
