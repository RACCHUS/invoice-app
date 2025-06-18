import React, { forwardRef } from 'react';

const A4_WIDTH_PT = 595; // A4 width in points
const A4_MARGIN_PT = 40; // 40pt margin on each side
const TEMPLATE_WIDTH = A4_WIDTH_PT - 2 * A4_MARGIN_PT; // 515pt

const InvoicePDF = forwardRef(({ invoice }, ref) => {
  if (!invoice) return null;
  const headingKey = `heading-${invoice.invoiceNumber}`;
  return (
    <div style={{ position: 'relative', width: TEMPLATE_WIDTH, margin: '0 auto' }}>
      {/* Static heading for PDF export only (not React state) */}
      <div key={headingKey} style={{
        position: 'absolute',
        top: -50,
        left: 0,
        width: '100%',
        textAlign: 'center',
        fontSize: 32,
        fontWeight: 900,
        color: '#222',
        background: '#fff',
        border: '3px solid #e5e7eb',
        padding: '12px 0',
        fontFamily: 'Arial, Helvetica, sans-serif',
        zIndex: 100,
        letterSpacing: '1px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        userSelect: 'text',
      }}>
        Invoice #{invoice.invoiceNumber}
      </div>
      <div
        ref={ref}
        className="invoice-pdf-template"
        style={{
          background: '#fff',
          color: '#222',
          width: TEMPLATE_WIDTH, // fixed width for PDF
          minHeight: 900,
          fontFamily: 'Arial, Helvetica, sans-serif',
          boxSizing: 'border-box',
          border: '1px solid #e5e7eb',
          padding: A4_MARGIN_PT, // padding inside width
          marginTop: 32,
        }}
      >
        <div style={{ marginBottom: 24, borderBottom: '2px solid #e5e7eb', paddingBottom: 12 }}>
          <div style={{
            display: 'block',
            minHeight: 38,
            fontSize: 28,
            margin: 0,
            marginBottom: 8,
            wordBreak: 'break-all',
            background: '#f9fafb',
            padding: '6px 8px',
            fontWeight: 900,
            letterSpacing: '0.5px',
            color: '#1a1a1a',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}>
            Invoice #{invoice.invoiceNumber}
          </div>
          <div style={{ fontSize: 16, color: '#6b7280' }}>
            <strong>Date:</strong> {invoice.date} &nbsp; | &nbsp;
            <strong>Due:</strong> {invoice.dueDate}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 32, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 160, wordBreak: 'break-word' }}>
            <strong>From:</strong><br />
            {invoice.sender?.businessName && <>{invoice.sender.businessName}<br /></>}
            {invoice.sender?.name}<br />
            {invoice.sender?.address}<br />
            {invoice.sender?.phone}
          </div>
          <div style={{ minWidth: 160, wordBreak: 'break-word' }}>
            <strong>To:</strong><br />
            {invoice.recipient?.name}<br />
            {invoice.recipient?.address}<br />
            {invoice.recipient?.email}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Description</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Qty</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Unit Price</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Tax (%)</th>
              <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: 8, border: '1px solid #e5e7eb', wordBreak: 'break-word', whiteSpace: 'pre-line', maxWidth: 220 }}>{item.description}</td>
                <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'center' }}>{item.tax || 0}%</td>
                <td style={{ padding: 8, border: '1px solid #e5e7eb', textAlign: 'right' }}>${(item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', marginBottom: 8 }}>
          <div><strong>Subtotal:</strong> ${invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)}</div>
          <div><strong>Tax:</strong> ${invoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.tax || 0) / 100), 0).toFixed(2)}</div>
          <div style={{ fontSize: 20 }}><strong>Total:</strong> ${invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100), 0).toFixed(2)}</div>
        </div>
        {invoice.notes && (
          <div style={{ marginTop: 16 }}>
            <strong>Notes:</strong><br />
            {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
});

export default InvoicePDF;
