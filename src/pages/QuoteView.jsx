import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/InvoiceServices';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { locationGroupHeading } from '../utils/invoiceData';

export default function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
        console.error('Error loading quote:', e);
        setError(`Failed to load quote: ${e.message}`);
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
    if (saving) return;
    if (!confirm('Convert this quote to an invoice? This action cannot be undone.')) return;
    setSaving(true);
    try {
      await invoiceService.convertToInvoice(quote);
      alert('Quote successfully converted to invoice!');
      navigate('/invoices');
    } catch (error) {
      console.error('Error converting quote:', error);
      alert('Failed to convert quote to invoice.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="centered-screen"><div className="spinner"></div></div>;
  if (!quote) return <p role="alert">{error || 'Quote not found.'}</p>;

  return (
    <div className="container">
      <Link to="/quotes">Back to quotes</Link>
      <div className="invoice-details-card">
        <div className="invoice-details-header">
          <h2 className="page-title">Quote #{quote.invoiceNumber}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <Link className="btn-secondary" to={`/quotes/${id}/edit`}>Edit</Link>
            <button className="btn-secondary" disabled={saving} onClick={handleConvertToInvoice}>
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
          {quote.jobSite && <div className="invoice-details-section">
            <strong>Job Site:</strong><br />
            {quote.jobSite}
          </div>}
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
                  <React.Fragment key={idx}>
                  {locationGroupHeading(quote.lineItems, idx) && <tr className="location-row">
                    <td colSpan={5}><strong>{locationGroupHeading(quote.lineItems, idx)}</strong></td>
                  </tr>}
                  <tr>
                    <td data-label="Description" className="wrap-cell">{item.description}</td>
                    <td data-label="Qty">{item.quantity}</td>
                    <td data-label="Unit Price">${item.unitPrice.toFixed(2)}</td>
                    <td data-label="Tax (%)">{item.tax || 0}</td>
                    <td data-label="Total">${(item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100)).toFixed(2)}</td>
                  </tr>
                  </React.Fragment>
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
