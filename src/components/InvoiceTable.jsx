import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { invoiceService } from '../services/InvoiceServices';
import { formatDate } from '../utils/formatters';

export default function InvoiceTable({ invoices, onDelete, onConvertToInvoice, onStatusChange, documentType = 'invoice' }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const handlePayment = async invoice => {
    if (busyId) return;
    setBusyId(invoice.id);
    setError('');
    const status = invoice.status === 'paid' ? 'pending' : 'paid';
    try {
      await invoiceService.updateInvoice(invoice.id, { status });
      onStatusChange?.(invoice.id, status);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError(`Failed to update payment status: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleExportPDF = async (invoice) => {
    try {
      const pdf = generateInvoicePDF(invoice);
      const label = invoice.type === 'quote' || invoice.status === 'quote' ? 'quote' : 'invoice';
      pdf.save(`${label}-${invoice.invoiceNumber || 'export'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleConvertToInvoice = async (invoice) => {
    if (busyId) return;
    if (!confirm('Convert this quote to an invoice? This action cannot be undone.')) return;
    setBusyId(invoice.id);
    try {
      const updatedData = await invoiceService.convertToInvoice(invoice);
      
      // Notify parent component about the conversion
      if (onConvertToInvoice) {
        onConvertToInvoice(invoice.id, updatedData);
      }
      
      alert('Quote successfully converted to invoice!');
    } catch (error) {
      console.error('Error converting quote:', error);
      alert('Failed to convert quote to invoice.');
    } finally {
      setBusyId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusClass = (status, type) => {
    // Handle quotes specially
    if (type === 'quote' || status === 'quote') {
      return 'status-badge quote';
    }
    
    switch (status) {
      case 'paid':
        return 'status-badge paid';
      case 'pending':
        return 'status-badge pending';
      case 'overdue':
        return 'status-badge overdue';
      default:
        return 'status-badge pending';
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="table-empty">
        <svg className="table-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="table-empty-text">No {documentType === 'quote' ? 'quotes' : 'invoices'} found</p>
        <Link
          to={documentType === 'quote' ? '/quotes/new' : '/invoices/new'}
          className="primary-btn"
        >
          Create {documentType === 'quote' ? 'Quote' : 'Invoice'}
        </Link>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      {error && <p role="alert">{error}</p>}
      <table className="invoice-table">
        <thead>
          <tr>
            <th>{documentType === 'quote' ? 'Quote' : 'Invoice'} #</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date Created</th>
            <th>Due Date</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td data-label="Invoice #">#{invoice.invoiceNumber || invoice.id.slice(-6)}</td>
              <td data-label="Client">
                <div className="client-details">
                <div className="client-name">{invoice.recipient?.name || invoice.clientName || 'Unknown Client'}</div>
                <div className="client-email">{invoice.recipient?.email || invoice.clientEmail}</div>
                </div>
              </td>
              <td data-label="Amount">{formatCurrency(invoice.total || 0)}</td>
              <td data-label="Status">
                <span className={getStatusClass(invoice.status, invoice.type)}>
                  {(invoice.type === 'quote' || invoice.status === 'quote') ? 'Quote' : (invoice.status || 'pending')}
                </span>
              </td>
              <td data-label="Date Created">{formatDate(invoice.createdAt)}</td>
              <td data-label="Due Date">{formatDate(invoice.dueDate)}</td>
              <td data-label="Actions" className="text-right">
                <div className="table-actions">
                  {invoice.type !== 'quote' && invoice.status !== 'quote' && onStatusChange && (
                    <button className="action-btn edit" disabled={busyId !== null} onClick={() => handlePayment(invoice)}>
                      {busyId === invoice.id ? 'Saving...' : invoice.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                  )}
                  <button
                    onClick={() => handleExportPDF(invoice)}
                    className="action-btn export"
                    title="Export to PDF"
                    style={{ marginRight: 8 }}
                  >
                    Export
                  </button>
                  {(invoice.type === 'quote' || invoice.status === 'quote') && (
                    <button
                      onClick={() => handleConvertToInvoice(invoice)}
                      disabled={busyId !== null}
                      className="action-btn convert"
                      title="Convert to Invoice"
                      style={{ marginRight: 8 }}
                    >
                      Convert
                    </button>
                  )}
                  <Link
                    to={`/${(invoice.type === 'quote' || invoice.status === 'quote') ? 'quotes' : 'invoices'}/${invoice.id}`}
                    className="action-btn view"
                  >
                    View
                  </Link>
                  <Link
                    to={`/${(invoice.type === 'quote' || invoice.status === 'quote') ? 'quotes' : 'invoices'}/${invoice.id}/edit`}
                    className="action-btn edit"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDelete(invoice.id)}
                    className="action-btn delete"
                    title="Delete"
                  >
                    <span className="sr-only">Delete</span>
                    <span className="delete-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 8V14M10 8V14M14 8V14M3 5H17M5 5V4C5 2.89543 5.89543 2 7 2H13C14.1046 2 15 2.89543 15 4V5M8 10V14M12 10V14" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span className="delete-text">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
