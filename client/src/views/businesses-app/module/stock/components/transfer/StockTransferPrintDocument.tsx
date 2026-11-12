import { createPortal } from "react-dom";
import type { StockTransferReceiptData } from "../../helpers/stock-transfer-receipt.helper";
import { StockTransferReceiptContent } from "./StockTransferReceiptContent";

const receiptStyles = `
.stock-transfer-print-root { display: none; }
.stock-transfer-receipt {
  width: 100%; padding: 16px; background: #fff; color: #171717;
  font: 13px/1.4 Arial, sans-serif; overflow-wrap: anywhere;
}
.stock-transfer-receipt h2, .stock-transfer-receipt h3,
.stock-transfer-receipt p, .stock-transfer-receipt dd { margin: 0; }
.stock-transfer-receipt-header {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start;
  gap: 12px; padding-bottom: 10px; border-bottom: 2px solid #262626;
}
.stock-transfer-receipt-brand {
  display: flex; align-items: center; gap: 10px; min-width: 0; font-size: 18px; font-weight: 700;
}
.stock-transfer-receipt-brand img { flex: 0 0 36px; width: 36px; height: 36px; object-fit: contain; }
.stock-transfer-receipt-identification h2 { font-size: 17px; font-weight: 700; }
.stock-transfer-receipt-label, .stock-transfer-receipt dt {
  font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
}
.stock-transfer-receipt-route {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;
  padding: 10px 0; border-bottom: 1px solid #aaa; margin: 0 0 10px;
}
.stock-transfer-receipt-route dd { font-weight: 600; }
.stock-transfer-receipt table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.stock-transfer-receipt caption { text-align: left; padding-bottom: 4px; font-weight: 700; }
.stock-transfer-receipt th, .stock-transfer-receipt td {
  text-align: left; padding: 4px 6px; border-bottom: 1px solid #bbb; vertical-align: top;
}
.stock-transfer-receipt th { border-top: 1px solid #555; border-bottom-color: #555; }
.stock-transfer-receipt th:last-child, .stock-transfer-receipt td:last-child {
  width: 30%; text-align: right; font-variant-numeric: tabular-nums;
}
.stock-transfer-receipt-end { padding-top: 8px; }
.stock-transfer-receipt-summary, .stock-transfer-receipt-notes h3 { font-weight: 700; }
.stock-transfer-receipt-notes { margin-top: 8px; }
.stock-transfer-receipt-notes p { white-space: pre-wrap; }
.stock-transfer-receipt-signatures {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px;
  padding: 26px 0 10px; text-align: center;
}
.stock-transfer-receipt-signatures p { border-top: 1px solid #555; padding-top: 4px; }
.stock-transfer-receipt-notice { padding-top: 6px; border-top: 1px solid #aaa; font-size: 10px; }
@media (min-width: 640px) {
  .stock-transfer-receipt-route { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .stock-transfer-receipt-identification { text-align: right; }
}
@media print {
  @page stock-transfer { size: A4; margin: 12mm; }
  body:has(> .stock-transfer-print-root) { margin: 0 !important; padding: 0 !important; }
  body:has(> .stock-transfer-print-root) > :not(.stock-transfer-print-root) { display: none !important; }
  .stock-transfer-print-root { display: block !important; page: stock-transfer; }
  .stock-transfer-print-root .stock-transfer-receipt { padding: 0; color: #000; font-size: 10pt; line-height: 1.3; }
  .stock-transfer-print-root .stock-transfer-receipt-route { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .stock-transfer-print-root th, .stock-transfer-print-root td { padding-block: 2px; }
  .stock-transfer-print-root thead { display: table-header-group; }
  .stock-transfer-print-root tr,
  .stock-transfer-print-root .stock-transfer-receipt-header,
  .stock-transfer-print-root .stock-transfer-receipt-route,
  .stock-transfer-print-root .stock-transfer-receipt-end { break-inside: avoid; }
}
`;

export const StockTransferPrintDocument = ({ receipt }: { receipt: StockTransferReceiptData }) =>
  typeof document === "undefined" ? null : createPortal(
    <div className="stock-transfer-print-root" aria-hidden="true">
      <style>{receiptStyles}</style>
      <StockTransferReceiptContent receipt={receipt} />
    </div>,
    document.body,
  );
