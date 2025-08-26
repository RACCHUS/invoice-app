import jsPDF from 'jspdf';

export const generateInvoicePDF = (invoice) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth(); // 595pt
  const pageHeight = pdf.internal.pageSize.getHeight(); // 842pt
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;
  
  // Set fonts
  pdf.setFont('helvetica');
  
  let yPosition = margin;
  
  // Title
  const label = invoice.type === 'quote' || invoice.status === 'quote' ? 'Quote' : 'Invoice';
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${label} #${invoice.invoiceNumber}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 40;
  
  // Sender and Recipient Info
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  // Sender info (left side)
  const senderX = margin;
  pdf.setFont('helvetica', 'bold');
  pdf.text('From:', senderX, yPosition);
  pdf.setFont('helvetica', 'normal');
  yPosition += 15;
  
  if (invoice.sender?.businessName) {
    pdf.text(invoice.sender.businessName, senderX, yPosition);
    yPosition += 12;
  }
  if (invoice.sender?.name) {
    pdf.text(invoice.sender.name, senderX, yPosition);
    yPosition += 12;
  }
  if (invoice.sender?.address) {
    pdf.text(invoice.sender.address, senderX, yPosition);
    yPosition += 12;
  }
  if (invoice.sender?.phone) {
    pdf.text(invoice.sender.phone, senderX, yPosition);
    yPosition += 12;
  }
  
  // Recipient info (right side)
  const recipientX = pageWidth / 2 + 40;
  let recipientY = margin + 25;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('To:', recipientX, recipientY);
  pdf.setFont('helvetica', 'normal');
  recipientY += 15;
  
  if (invoice.recipient?.name) {
    pdf.text(invoice.recipient.name, recipientX, recipientY);
    recipientY += 12;
  }
  if (invoice.recipient?.address) {
    pdf.text(invoice.recipient.address, recipientX, recipientY);
    recipientY += 12;
  }
  if (invoice.recipient?.email) {
    pdf.text(invoice.recipient.email, recipientX, recipientY);
    recipientY += 12;
  }
  
  // Dates
  yPosition += 20;
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Date: `, senderX, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.date, senderX + 35, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Due: `, recipientX, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.dueDate, recipientX + 30, yPosition);
  
  yPosition += 30;
  
  // Line Items Table
  const tableStartY = yPosition;
  const tableHeaders = ['Description', 'Qty', 'Unit Price'];
  const showTax = invoice.lineItems.some(item => item.tax && Number(item.tax) !== 0);
  if (showTax) tableHeaders.push('Tax (%)');
  tableHeaders.push('Total');
  
  const columnWidths = showTax 
    ? [240, 50, 80, 60, 80] 
    : [280, 60, 90, 90];
  
  // Table header
  pdf.setFillColor(243, 244, 246); // #f3f4f6
  pdf.rect(margin, yPosition, contentWidth, 25, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  
  let xPos = margin + 8;
  tableHeaders.forEach((header, i) => {
    pdf.text(header, xPos, yPosition + 16);
    xPos += columnWidths[i];
  });
  
  yPosition += 25;
  
  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  invoice.lineItems.forEach((item, index) => {
    const rowHeight = 20;
    const descriptionLines = pdf.splitTextToSize(item.description, columnWidths[0] - 16);
    const actualRowHeight = Math.max(rowHeight, descriptionLines.length * 12);
    
    // Check if we need a new page
    if (yPosition + actualRowHeight > pageHeight - margin - 80) { // Leave space for totals
      pdf.addPage();
      yPosition = margin;
      
      // Redraw table header on new page
      pdf.setFillColor(243, 244, 246); // #f3f4f6
      pdf.rect(margin, yPosition, contentWidth, 25, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      
      let xPos = margin + 8;
      tableHeaders.forEach((header, i) => {
        pdf.text(header, xPos, yPosition + 16);
        xPos += columnWidths[i];
      });
      
      yPosition += 25;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
    }
    
    // Alternate row colors
    if (index % 2 === 1) {
      pdf.setFillColor(249, 250, 251); // #f9fafb
      pdf.rect(margin, yPosition, contentWidth, actualRowHeight, 'F');
    }
    
    let xPos = margin + 8;
    const textY = yPosition + 13;
    
    // Description (wrap text if needed)
    pdf.text(descriptionLines, xPos, textY);
    xPos += columnWidths[0];
    
    // Quantity
    pdf.text(item.quantity.toString(), xPos, textY, { align: 'center' });
    xPos += columnWidths[1];
    
    // Unit Price
    pdf.text(`$${item.unitPrice.toFixed(2)}`, xPos + columnWidths[2] - 8, textY, { align: 'right' });
    xPos += columnWidths[2];
    
    // Tax (if shown)
    if (showTax) {
      pdf.text(`${item.tax || 0}%`, xPos, textY, { align: 'center' });
      xPos += columnWidths[3];
    }
    
    // Total
    const lineTotal = item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100);
    pdf.text(`$${lineTotal.toFixed(2)}`, xPos + columnWidths[showTax ? 4 : 3] - 8, textY, { align: 'right' });
    
    yPosition += actualRowHeight;
  });
  
  yPosition += 20;
  
  // Check if we need a new page for totals and notes
  const totalsHeight = 80; // Estimated height for totals section
  const notesHeight = invoice.notes ? 60 : 0; // Estimated height for notes
  
  if (yPosition + totalsHeight + notesHeight > pageHeight - margin) {
    pdf.addPage();
    yPosition = margin + 20;
  }
  
  // Totals
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalTax = invoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.tax || 0) / 100), 0);
  const total = subtotal + totalTax;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  
  const totalsX = pageWidth - margin - 100;
  pdf.text(`Subtotal: $${subtotal.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
  yPosition += 15;
  pdf.text(`Tax: $${totalTax.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
  yPosition += 15;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`Total: $${total.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
  yPosition += 30;
  
  // Notes
  if (invoice.notes) {
    const notesLines = pdf.splitTextToSize(invoice.notes, contentWidth);
    const notesHeight = 30 + (notesLines.length * 12); // Title + lines
    
    // Check if notes need a new page
    if (yPosition + notesHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin + 20;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Notes:', margin, yPosition);
    yPosition += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(notesLines, margin, yPosition);
    yPosition += notesLines.length * 12;
  }
  
  // Add page numbers if multiple pages
  const totalPages = pdf.getNumberOfPages();
  if (totalPages > 1) {
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - margin + 20, { align: 'center' });
    }
  }
  
  return pdf;
};
