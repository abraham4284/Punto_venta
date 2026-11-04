// Mounted only with the Sales print document; every screen rule is scoped to it.
export const salePrintStyles = `
.sale-print-root { display: none; }
.sale-print-document, .sale-print-document * { box-sizing: border-box; }
.sale-print-document {
  --sale-print-ink: #183c32;
  --sale-print-accent: #167653;
  width: 100%; max-width: 800px; margin: 0 auto; padding: 24px;
  color: #202826; background: white; font: 12px/1.4 Arial, Helvetica, sans-serif;
  overflow-wrap: anywhere;
}
.sale-print-document p, .sale-print-document h1, .sale-print-document h2,
.sale-print-document ul, .sale-print-document dl, .sale-print-document dd { margin: 0; }
.sale-print-document h2 { font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: var(--sale-print-ink); margin-bottom: 4px; }
.sale-print-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 12px; border-bottom: 2px solid var(--sale-print-accent); }
.sale-print-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.sale-print-brand h1 { font-size: 24px; line-height: 1.15; font-weight: 800; color: var(--sale-print-ink); }
.sale-print-brand p { margin-top: 4px; color: #59655f; font-size: 11px; }
.sale-print-logo { display: flex; flex: 0 0 52px; align-items: center; justify-content: center; width: 52px; height: 52px; }
.sale-print-logo img { width: 100%; height: 100%; object-fit: contain; }
.sale-print-logo .sale-print-image-fallback { background: #eff6f2; color: var(--sale-print-accent); font-size: 26px; font-weight: 800; }
.sale-print-identification { flex: 0 0 auto; max-width: 48%; text-align: right; }
.sale-print-eyebrow { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: var(--sale-print-accent); }
.sale-print-number { font-size: 17px; font-weight: 800; line-height: 1.35; color: var(--sale-print-ink); }
.sale-print-date { font-size: 10px; color: #59655f; }
.sale-print-status { display: inline-block; margin-top: 4px; padding: 1px 7px; border: 1px solid #86ad9d; border-radius: 3px; font-size: 10px; font-weight: 700; color: var(--sale-print-ink); }
.sale-print-status-cancelled { border-color: #943a38; color: #943a38; }
.sale-print-cancellation { margin-top: 10px !important; padding: 7px 9px; border: 1px solid #943a38; font-weight: 700; color: #772c2b; }
.sale-print-parties { display: grid; gap: 12px 22px; padding: 12px 0; }
.sale-print-parties-delivery { grid-template-columns: 1fr 1fr; }
.sale-print-parties > div { min-width: 0; }
.sale-print-customer-name { font-weight: 700; }
.sale-print-field { margin-top: 2px !important; }
.sale-print-field > span { color: #59655f; }
.sale-print-items { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; }
.sale-print-items caption { text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; padding-bottom: 6px; color: var(--sale-print-ink); }
.sale-print-photo-col { width: 44px; }
.sale-print-quantity-col { width: 52px; }
.sale-print-price-col { width: 100px; }
.sale-print-total-col { width: 106px; }
.sale-print-items th { padding: 7px 5px; text-align: left; background: #eff6f2; color: var(--sale-print-ink); border-top: 1px solid #97b6aa; border-bottom: 1px solid #97b6aa; font-size: 10px; font-weight: 700; }
.sale-print-items td { padding: 6px 5px; border-bottom: 1px solid #dce4df; vertical-align: middle; }
.sale-print-items td:first-child, .sale-print-items th:first-child { padding-left: 0; }
.sale-print-items td:last-child, .sale-print-items th:last-child { padding-right: 0; }
.sale-print-items .sale-print-numeric { text-align: right; font-variant-numeric: tabular-nums; }
.sale-print-quantity { font-size: 13px; font-weight: 700; }
.sale-print-line-total { font-weight: 700; }
.sale-print-product-name { font-weight: 700; }
.sale-print-product-code, .sale-print-line-discount { margin-top: 2px !important; color: #59655f; font-size: 10px; }
.sale-print-image { display: flex; width: 36px; height: 36px; }
.sale-print-image img { width: 100%; height: 100%; object-fit: contain; }
.sale-print-image-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 3px; background: #f3f5f4; color: #7b8b83; }
.sale-print-summary { display: flex; justify-content: flex-end; margin-top: 12px; }
.sale-print-totals { width: min(100%, 250px); }
.sale-print-totals > div { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; font-variant-numeric: tabular-nums; }
.sale-print-totals dd { text-align: right; }
.sale-print-totals .sale-print-grand-total { border-top: 2px solid var(--sale-print-accent); margin-top: 5px; padding-top: 7px; font-weight: 800; font-size: 17px; color: var(--sale-print-ink); }
.sale-print-notes { margin-top: 12px; padding-top: 9px; border-top: 1px solid #dce4df; }
.sale-print-notes p { white-space: pre-wrap; font-size: 11px; }
.sale-print-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 5px 16px; margin-top: 14px; padding-top: 8px; border-top: 1px solid #dce4df; font-size: 9px; color: #59655f; }
.sale-print-footer p:first-child { color: var(--sale-print-ink); font-weight: 700; }
@media screen and (max-width: 520px) {
  .sale-print-document { padding: 12px; font-size: 11px; }
  .sale-print-header { align-items: start; gap: 10px; }
  .sale-print-brand { gap: 7px; }
  .sale-print-brand h1 { font-size: 18px; }
  .sale-print-logo { flex-basis: 34px; width: 34px; height: 34px; }
  .sale-print-number { font-size: 13px; }
  .sale-print-parties-delivery { grid-template-columns: 1fr; }
  .sale-print-photo-col { width: 36px; }
  .sale-print-quantity-col { width: 36px; }
  .sale-print-price-col { width: 72px; }
  .sale-print-total-col { width: 76px; }
  .sale-print-image { width: 32px; height: 32px; }
  .sale-print-items { font-size: 10px; }
  .sale-print-items td, .sale-print-items th { padding: 5px 3px; }
  .sale-print-items th { font-size: 9px; }
  .sale-print-product-code, .sale-print-line-discount { font-size: 9px; }
}
@media print {
  @page { size: A4; margin: 10mm; }
  body:has(> .sale-print-root) > :not(.sale-print-root) { display: none !important; }
  .sale-print-root { display: block !important; }
  .sale-print-document { max-width: none; margin: 0; padding: 0; min-height: 0; box-shadow: none; }
  .sale-print-document, .sale-print-document * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sale-print-header, .sale-print-parties, .sale-print-cancellation, .sale-print-summary, .sale-print-footer { break-inside: avoid; page-break-inside: avoid; }
  .sale-print-items thead { display: table-header-group; }
  .sale-print-items tbody { break-inside: auto; }
  .sale-print-items tr { break-inside: avoid; page-break-inside: avoid; }
  .sale-print-notes h2 { break-after: avoid; }
  .sale-print-notes p { orphans: 2; widows: 2; }
}
`;
