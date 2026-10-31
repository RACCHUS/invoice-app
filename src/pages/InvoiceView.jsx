import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/InvoiceServices';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { cleanText, isQuote, locationGroupHeading, normalizeInvoice } from '../utils/invoiceData';
import DetailBlock from '../components/DetailBlock';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const inv = await invoiceService.getInvoiceById(id);
        if (!inv) navigate('/invoices');
        setInvoice(inv);
      } catch (e) {
        console.error('Error loading invoice:', e);
        setError(`Failed to load invoice: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, navigate]);

  const handlePayment = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    const status = invoice.status === 'paid' ? 'pending' : 'paid';
    try {
      await invoiceService.updateInvoice(id, { status });
      setInvoice(prev => normalizeInvoice({ ...prev, status }));
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError(`Failed to update payment status: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdf = generateInvoicePDF(invoice);
      const label = invoice.type === 'quote' || invoice.status === 'quote' ? 'quote' : 'invoice';
      pdf.save(`${label}-${invoice.invoiceNumber || 'export'}.pdf`);
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
      const updatedData = await invoiceService.convertToInvoice(invoice);
      setInvoice(prev => normalizeInvoice({ ...prev, ...updatedData }));
      alert('Quote successfully converted to invoice!');
    } catch (error) {
      console.error('Error converting quote:', error);
      alert('Failed to convert quote to invoice.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="centered-screen"><div className="spinner"></div></div>;
  if (!invoice) return <p role="alert">{error || 'Invoice not found.'}</p>;

  return (
    <div className="container">
      <Link to="/invoices">Back to invoices</Link>
      {error && <p role="alert">{error}</p>}
      <div className="invoice-details-card">
        <div className="invoice-details-header">
          <h2 className="page-title">{(invoice.type === 'quote' || invoice.status === 'quote') ? 'Quote' : 'Invoice'} #{invoice.invoiceNumber}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {invoice.type !== 'quote' && invoice.status !== 'quote' && <button className="btn-primary" disabled={saving} onClick={handlePayment}>
              {saving ? 'Saving...' : invoice.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
            </button>}
            <Link className="btn-secondary" to={`/${invoice.type === 'quote' || invoice.status === 'quote' ? 'quotes' : 'invoices'}/${id}/edit`}>Edit</Link>
            {(invoice.type === 'quote' || invoice.status === 'quote') && (
              <button className="btn-secondary" disabled={saving} onClick={handleConvertToInvoice}>
                Convert to Invoice
              </button>
            )}
            <button className="btn-primary" onClick={handleExportPDF}>Export to PDF</button>
          </div>
        </div>
        <div className="invoice-details-content">
          {(cleanText(invoice.date) || cleanText(invoice.dueDate)) && <div className="invoice-details-section">
            {cleanText(invoice.date) && <><strong>Date:</strong> {invoice.date}</>}
            {cleanText(invoice.date) && cleanText(invoice.dueDate) && <br />}
            {cleanText(invoice.dueDate) && <><strong>{isQuote(invoice) ? 'Valid Until' : 'Due Date'}:</strong> {invoice.dueDate}</>}
          </div>}
          <DetailBlock title="Sender" values={[invoice.sender?.businessName, invoice.sender?.name, invoice.sender?.address, invoice.sender?.phone]} />
          <DetailBlock title="Recipient" values={[invoice.recipient?.name, invoice.recipient?.address, invoice.recipient?.email]} />
          <DetailBlock title="Job Site" values={[invoice.jobSite]} />
          <div className="invoice-details-section">
            <strong>Status:</strong> {invoice.status}
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
                {invoice.lineItems?.map((item, idx) => (
                  <React.Fragment key={idx}>
                  {locationGroupHeading(invoice.lineItems, idx) && <tr className="location-row">
                    <td colSpan={5}><strong>{locationGroupHeading(invoice.lineItems, idx)}</strong></td>
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
            {invoice.totalTax > 0 && <>
              <strong>Subtotal:</strong> ${(invoice.subtotal || 0).toFixed(2)}<br />
              <strong>Tax:</strong> ${invoice.totalTax.toFixed(2)}<br />
            </>}
            <strong>Total:</strong> ${(invoice.total || 0).toFixed(2)}
          </div>
          <DetailBlock title="Notes" values={[invoice.notes]} />
        </div>
      </div>
    </div>
  );
}
