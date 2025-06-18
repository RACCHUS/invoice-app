import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceTable({ invoices, onDelete }) {
  const navigate = useNavigate();

  const handleExportPDF = async (invoice) => {
    // Create a hidden div to render the InvoicePDF component
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    const { default: InvoicePDF } = await import('./InvoicePDF');
    const el = document.createElement('div');
    container.appendChild(el);
    import('react-dom/client').then(ReactDOM => {
      const root = ReactDOM.createRoot(el);
      root.render(<InvoicePDF invoice={invoice} ref={null} />);
      setTimeout(async () => {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - 2 * margin;
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = contentWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        const finalImgHeight = imgHeight > (pageHeight - 2 * margin) ? (pageHeight - 2 * margin) : imgHeight;
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, finalImgHeight);
        pdf.save(`invoice-${invoice.invoiceNumber || 'export'}.pdf`);
        root.unmount();
        document.body.removeChild(container);
      }, 300);
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return dateObj.toLocaleDateString();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge paid';
      case 'pending':
        return 'status-badge pending';
      case 'overdue':
        return 'status-badge overdue';
      default:
        return 'status-badge draft';
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="table-empty">
        <svg className="table-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="table-empty-text">No invoices found</p>
        <Link
          to="/invoices/new"
          className="primary-btn"
        >
          Create Your First Invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Invoice #</th>
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
                <div className="client-name">{invoice.recipient?.name || invoice.clientName || 'Unknown Client'}</div>
                <div className="client-email">{invoice.recipient?.email || invoice.clientEmail}</div>
              </td>
              <td data-label="Amount">{formatCurrency(invoice.total || 0)}</td>
              <td data-label="Status">
                <span className={getStatusClass(invoice.status)}>
                  {invoice.status || 'draft'}
                </span>
              </td>
              <td data-label="Date Created">{formatDate(invoice.createdAt)}</td>
              <td data-label="Due Date">{formatDate(invoice.dueDate)}</td>
              <td data-label="Actions" className="text-right">
                <div className="table-actions">
                  <button
                    onClick={() => handleExportPDF(invoice)}
                    className="action-btn export"
                    title="Export to PDF"
                    style={{ marginRight: 8 }}
                  >
                    Export
                  </button>
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="action-btn view"
                  >
                    View
                  </Link>
                  <Link
                    to={`/invoices/${invoice.id}/edit`}
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