import React, { forwardRef } from 'react';

const A4_WIDTH_PT = 595; // A4 width in points
const A4_MARGIN_PT = 40; // 40pt margin on each side
const TEMPLATE_WIDTH = A4_WIDTH_PT - 2 * A4_MARGIN_PT; // 515pt

const InvoicePDF = forwardRef(({ invoice }, ref) => {
  if (!invoice) return null;
  const label = invoice.type === 'quote' || invoice.status === 'quote' ? 'Quote' : 'Invoice';
  // Determine if any line item uses tax
  const showTax = invoice.lineItems.some(item => item.tax && Number(item.tax) !== 0);
  return (
    <div style={{ position: 'relative', width: TEMPLATE_WIDTH, margin: '0 auto' }}>
      <div
        ref={ref}
        className="invoice-pdf-template"
        style={{
          background: '#fff',
          color: '#222',
          width: TEMPLATE_WIDTH,
          minHeight: 900,
          fontFamily: 'Arial, Helvetica, sans-serif',
          boxSizing: 'border-box',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: A4_MARGIN_PT,
          marginTop: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Heading inside the box */}
        <div style={{
          width: '100%',
          textAlign: 'center',
          fontSize: 28,
          fontWeight: 900,
          color: '#222',
          background: '#fff',
          letterSpacing: '1px',
          userSelect: 'text',
          marginBottom: 18,
        }}>
          {label} #{invoice.invoiceNumber}
        </div>
        {/* Sender/Recipient and Dates in one row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, gap: 32, fontSize: 13 }}>
          <div style={{ flex: 1, minWidth: 160, wordBreak: 'break-word' }}>
            <div style={{ marginBottom: 4 }}><strong>From:</strong></div>
            {invoice.sender?.businessName && <>{invoice.sender.businessName}<br /></>}
            {invoice.sender?.name && <>{invoice.sender.name}<br /></>}
            {invoice.sender?.address && <>{invoice.sender.address}<br /></>}
            {invoice.sender?.phone && <>{invoice.sender.phone}<br /></>}
            <div style={{ marginTop: 8, color: '#555' }}><strong>Date:</strong> {invoice.date}</div>
          </div>
          <div style={{ flex: 1, minWidth: 160, wordBreak: 'break-word' }}>
            <div style={{ marginBottom: 4 }}><strong>To:</strong></div>
            {invoice.recipient?.name && <>{invoice.recipient.name}<br /></>}
            {invoice.recipient?.address && <>{invoice.recipient.address}<br /></>}
            {invoice.recipient?.email && <>{invoice.recipient.email}<br /></>}
            <div style={{ marginTop: 8, color: '#555' }}><strong>Due:</strong> {invoice.dueDate}</div>
          </div>
        </div>
        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>Description</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>Qty</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>Unit Price</th>
              {showTax && <th style={{ padding: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>Tax (%)</th>}
              <th style={{ padding: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: 8, border: '1px solid #e5e7eb', wordBreak: 'break-word', whiteSpace: 'pre-line', maxWidth: 220, fontSize: 13 }}>{item.description}</td>
                <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center', fontSize: 13 }}>{item.quantity}</td>
                <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right', fontSize: 13 }}>${item.unitPrice.toFixed(2)}</td>
                {showTax && <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center', fontSize: 13 }}>{item.tax || 0}%</td>}
                <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right', fontSize: 13 }}>${(item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Totals */}
        <div style={{ textAlign: 'right', marginBottom: 8, fontSize: 14 }}>
          <div><strong>Subtotal:</strong> ${invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)}</div>
          <div><strong>Tax:</strong> ${invoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.tax || 0) / 100), 0).toFixed(2)}</div>
          <div style={{ fontSize: 18 }}><strong>Total:</strong> ${invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100), 0).toFixed(2)}</div>
        </div>
        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginTop: 12, fontSize: 13 }}>
            <strong>Notes:</strong><br />
            {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
});

export default InvoicePDF;
