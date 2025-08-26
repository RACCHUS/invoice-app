import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/InvoiceServices';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export default function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const quoteData = await invoiceService.getInvoiceById(id);
        if (!quoteData) {
          navigate('/quotes');
          return;
        }
        // Ensure it's actually a quote
        if (quoteData.type !== 'quote' && quoteData.status !== 'quote') {
          navigate('/quotes');
          return;
        }
        setQuote(quoteData);
      } catch (e) {
        navigate('/quotes');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [id, navigate]);

  const handleExportPDF = async () => {
    try {
      const pdf = generateInvoicePDF(quote);
      pdf.save(`quote-${quote.invoiceNumber || 'export'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleConvertToInvoice = async () => {
    if (!confirm('Convert this quote to an invoice? This action cannot be undone.')) return;
    
    try {
      const updatedData = {
        ...quote,
        type: 'invoice',
        status: 'pending',
        // Generate new invoice number if needed
        invoiceNumber: quote.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`
      };
      delete updatedData.id; // Remove id from update data
      
      await invoiceService.updateInvoice(id, updatedData);
      alert('Quote successfully converted to invoice!');
      navigate('/invoices');
    } catch (error) {
      console.error('Error converting quote:', error);
      alert('Failed to convert quote to invoice.');
    }
  };

  if (loading) return <div className="centered-screen"><div className="spinner"></div></div>;
  if (!quote) return null;

  return (
    <div className="container">
      <div className="invoice-details-card">
        <div className="invoice-details-header">
          <h2 className="page-title">Quote #{quote.invoiceNumber}</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={handleConvertToInvoice}>
              Convert to Invoice
            </button>
            <button className="btn-primary" onClick={handleExportPDF}>Export to PDF</button>
          </div>
        </div>
        <div className="invoice-details-content">
          <div className="invoice-details-section">
            <strong>Date:</strong> {quote.date}<br />
            <strong>Valid Until:</strong> {quote.dueDate}
          </div>
          <div className="invoice-details-section">
            <strong>From:</strong><br />
            {quote.sender?.businessName && <>{quote.sender.businessName}<br /></>}
            {quote.sender?.name}<br />
            {quote.sender?.address}<br />
            {quote.sender?.phone}
          </div>
          <div className="invoice-details-section">
            <strong>To:</strong><br />
            {quote.recipient?.name}<br />
            {quote.recipient?.address}<br />
            {quote.recipient?.email}
          </div>
          <div className="invoice-details-section">
            <strong>Status:</strong> Quote
          </div>
          <div className="invoice-details-section">
            <strong>Line Items:</strong>
            <table className="invoice-table" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Tax (%)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="wrap-cell">{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unitPrice}</td>
                    <td>{item.tax || 0}</td>
                    <td>${(item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="invoice-details-section" style={{ textAlign: 'right', marginTop: 16 }}>
            <strong>Subtotal:</strong> ${quote.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)}<br />
            <strong>Tax:</strong> ${quote.lineItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.tax || 0) / 100), 0).toFixed(2)}<br />
            <strong>Total:</strong> ${quote.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100), 0).toFixed(2)}
          </div>
          {quote.notes && (
            <div className="invoice-details-section">
              <strong>Notes:</strong><br />
              {quote.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
