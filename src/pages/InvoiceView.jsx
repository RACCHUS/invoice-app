import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/InvoiceServices';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const inv = await invoiceService.getInvoiceById(id);
        if (!inv) navigate('/invoices');
        setInvoice(inv);
      } catch (e) {
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, navigate]);

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    const input = pdfRef.current;
    await new Promise(res => setTimeout(res, 300));
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth(); // 595pt
    const pageHeight = pdf.internal.pageSize.getHeight(); // 842pt
    const margin = 40; // match InvoicePDF.jsx
    const contentWidth = pageWidth - 2 * margin;
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = contentWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    const finalImgHeight = imgHeight > (pageHeight - 2 * margin) ? (pageHeight - 2 * margin) : imgHeight;
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, finalImgHeight);
    // Overlay the invoice number as selectable text at the top
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(34, 34, 34);
    pdf.text(`Invoice #${invoice.invoiceNumber}`, pageWidth / 2, margin - 10, { align: 'center' });
    pdf.save(`invoice-${invoice.invoiceNumber || 'export'}.pdf`);
  };

  if (loading) return <div className="centered-screen"><div className="spinner"></div></div>;
  if (!invoice) return null;

  return (
    <div className="container">
      <div className="invoice-details-card">
        <div className="invoice-details-header">
          <h2 className="page-title">Invoice #{invoice.invoiceNumber}</h2>
          <button className="btn-primary" onClick={handleExportPDF}>Export to PDF</button>
        </div>
        <div ref={pdfRef} className="invoice-details-content">
          <div className="invoice-details-section">
            <strong>Date:</strong> {invoice.date}<br />
            <strong>Due Date:</strong> {invoice.dueDate}
          </div>
          <div className="invoice-details-section">
            <strong>Sender:</strong><br />
            {invoice.sender?.businessName && <>{invoice.sender.businessName}<br /></>}
            {invoice.sender?.name}<br />
            {invoice.sender?.address}<br />
            {invoice.sender?.phone}
          </div>
          <div className="invoice-details-section">
            <strong>Recipient:</strong><br />
            {invoice.recipient?.name}<br />
            {invoice.recipient?.address}<br />
            {invoice.recipient?.email}
          </div>
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
            <strong>Subtotal:</strong> ${invoice.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)}<br />
            <strong>Tax:</strong> ${invoice.lineItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.tax || 0) / 100), 0).toFixed(2)}<br />
            <strong>Total:</strong> ${invoice.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 + (item.tax || 0) / 100), 0).toFixed(2)}
          </div>
          {invoice.notes && (
            <div className="invoice-details-section">
              <strong>Notes:</strong><br />
              {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
