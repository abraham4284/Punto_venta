export const printTicketHtml = (htmlTemplate: string): boolean => {
  const printWindow = window.open("", "_blank", "width=420,height=720");

  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(htmlTemplate);
  printWindow.document.close();
  printWindow.focus();

  window.setTimeout(() => {
    printWindow.print();
  }, 250);

  return true;
};
