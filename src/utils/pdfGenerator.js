import { jsPDF } from 'jspdf';
import { cleanText, locationGroupHeading, normalizeInvoice, presentLines } from './invoiceData.js';

export const generateInvoicePDF = (invoice) => {
  invoice = normalizeInvoice(invoice);
  if (!invoice.lineItems?.length) throw new Error('This document has no line items to export.');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
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
  const recipientX = pageWidth / 2 + 40;
  const senderWidth = contentWidth / 2 - 30;
  const recipientWidth = pageWidth - recipientX - margin;

  const writeBlock = (heading, values, x, y, width) => {
    const lines = presentLines(...values);
    if (!lines.length) return y;
    pdf.setFont('helvetica', 'bold');
    pdf.text(heading, x, y);
    pdf.setFont('helvetica', 'normal');
    y += 15;
    lines.forEach(value => {
      const wrapped = pdf.splitTextToSize(value, width);
      pdf.text(wrapped, x, y);
      y += wrapped.length * 13;
    });
    return y;
  };

  yPosition = writeBlock('From:', [
    invoice.sender?.businessName,
    invoice.sender?.name,
    invoice.sender?.address,
    invoice.sender?.phone,
  ], senderX, yPosition, senderWidth);

  // Recipient info (right side)
  let recipientY = writeBlock('To:', [
    invoice.recipient?.name,
    invoice.recipient?.address,
    invoice.recipient?.email,
  ], recipientX, margin + 40, recipientWidth);

  const jobSite = cleanText(invoice.jobSite);
  if (jobSite) {
    if (recipientY > margin + 40) recipientY += 6;
    recipientY = writeBlock('Job site:', [jobSite], recipientX, recipientY, recipientWidth);
  }

  // Dates
  const date = cleanText(invoice.date);
  const dueDate = cleanText(invoice.dueDate);
  if (date || dueDate) {
    yPosition = Math.max(yPosition, recipientY) + 20;
    if (date) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Date: ', senderX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(date, senderX + 35, yPosition);
    }
    if (dueDate) {
      const dueLabel = label === 'Quote' ? 'Valid until: ' : 'Due: ';
      pdf.setFont('helvetica', 'bold');
      pdf.text(dueLabel, recipientX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(dueDate, recipientX + pdf.getTextWidth(dueLabel), yPosition);
    }
  } else {
    yPosition = Math.max(yPosition, recipientY);
  }
  
  yPosition += 30;
  
  // Line Items Table
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
    const descriptionLines = pdf.splitTextToSize(cleanText(item.description), columnWidths[0] - 16);
    const actualRowHeight = Math.max(rowHeight, descriptionLines.length * 12);
    const groupHeading = locationGroupHeading(invoice.lineItems, index);
    const headingHeight = groupHeading ? 20 : 0;
    
    // Check if we need a new page
    if (yPosition + headingHeight + actualRowHeight > pageHeight - margin - 80) { // Leave space for totals
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
    
    if (groupHeading) {
      pdf.setFillColor(229, 231, 235); // #e5e7eb
      pdf.rect(margin, yPosition, contentWidth, headingHeight, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text(groupHeading, margin + 8, yPosition + 13);
      pdf.setFont('helvetica', 'normal');
      yPosition += headingHeight;
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
  const notes = cleanText(invoice.notes);
  const notesHeight = notes ? 60 : 0; // Estimated height for notes
  
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
  if (totalTax > 0) {
    pdf.text(`Subtotal: $${subtotal.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
    yPosition += 15;
    pdf.text(`Tax: $${totalTax.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
    yPosition += 15;
  }
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`Total: $${total.toFixed(2)}`, totalsX, yPosition, { align: 'right' });
  yPosition += 30;
  
  // Notes
  if (notes) {
    const notesLines = pdf.splitTextToSize(notes, contentWidth);
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
