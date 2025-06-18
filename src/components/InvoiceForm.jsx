import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function InvoiceForm({ onSave, clients = [], items = [], initialData = null }) {
  // Initial state for invoice fields
  const [invoice, setInvoice] = useState({
    invoiceNumber: initialData?.invoiceNumber || '',
    date: initialData?.date || new Date().toISOString().slice(0, 10),
    dueDate: initialData?.dueDate || '',
    sender: initialData?.sender || {
      name: '', businessName: '', address: '', phone: ''
    },
    recipient: initialData?.recipient || {
      name: '', address: '', email: ''
    },
    lineItems: initialData?.lineItems || [
      { description: '', quantity: 1, unitPrice: 0, tax: 0 }
    ],
    notes: initialData?.notes || '',
    status: initialData?.status || 'draft',
  });

  // Sync form state with initialData when editing
  useEffect(() => {
    if (initialData) {
      setInvoice({
        invoiceNumber: initialData.invoiceNumber || '',
        date: initialData.date || new Date().toISOString().slice(0, 10),
        dueDate: initialData.dueDate || '',
        sender: initialData.sender || { name: '', businessName: '', address: '', phone: '' },
        recipient: initialData.recipient || { name: '', address: '', email: '' },
        lineItems: initialData.lineItems || [{ description: '', quantity: 1, unitPrice: 0, tax: 0 }],
        notes: initialData.notes || '',
        status: initialData.status || 'draft',
      });
    }
  }, [initialData]);

  // Handlers for updating invoice fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleSenderChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({ ...prev, sender: { ...prev.sender, [name]: value } }));
  };

  const handleRecipientChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({ ...prev, recipient: { ...prev.recipient, [name]: value } }));
  };

  const handleLineItemChange = (idx, e) => {
    const { name, value } = e.target;
    setInvoice((prev) => {
      const newItems = prev.lineItems.map((item, i) =>
        i === idx ? { ...item, [name]: name === 'description' ? value : Number(value) } : item
      );
      return { ...prev, lineItems: newItems };
    });
  };

  const addLineItem = () => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, unitPrice: 0, tax: 0 }]
    }));
  };

  const removeLineItem = (idx) => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== idx)
    }));
  };

  // Calculate totals
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalTax = invoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.tax || 0) / 100), 0);
  const total = subtotal + totalTax;

  // Save handler
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(invoice);
  };

  // Select existing client and autofill recipient
  const handleSelectClient = (e) => {
    const clientId = e.target.value;
    if (!clientId) return;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setInvoice(prev => ({ ...prev, recipient: { name: client.name, address: client.address, email: client.email } }));
    }
  };

  // Select existing item and autofill line item
  const handleSelectItem = (idx, e) => {
    const itemId = e.target.value;
    if (!itemId) return;
    const item = items.find(i => i.id === itemId);
    if (item) {
      setInvoice(prev => {
        const newItems = prev.lineItems.map((li, i) =>
          i === idx ? { ...li, description: item.description, unitPrice: item.unitPrice, tax: item.tax || 0 } : li
        );
        return { ...prev, lineItems: newItems };
      });
    }
  };

  // Autocomplete helpers
  const getSuggestions = (input) => {
    if (!input) return items;
    return items.filter(it =>
      it.description.toLowerCase().includes(input.toLowerCase())
    );
  };

  // Drag and drop handlers
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(invoice.lineItems);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setInvoice((prev) => ({ ...prev, lineItems: reordered }));
  };

  // Determine if this is a quote
  const isQuote = invoice.status === 'quote' || invoice.type === 'quote';

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2 className="form-title">{isQuote ? 'Create Quote' : 'Create Invoice'}</h2>
      <div className="form-grid">
        <div>
          <label className="form-label">{isQuote ? 'Quote Number' : 'Invoice Number'}</label>
          <input className="form-input" name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleChange} required />
        </div>
        <div>
          <label className="form-label">Date</label>
          <input className="form-input" type="date" name="date" value={invoice.date} onChange={handleChange} required />
        </div>
        <div>
          <label className="form-label">Due Date</label>
          <input className="form-input" type="date" name="dueDate" value={invoice.dueDate} onChange={handleChange} required />
        </div>
      </div>
      <h3 className="form-section-title">Sender Info</h3>
      <div className="form-grid">
        <div>
          <label className="form-label">Your Name</label>
          <input className="form-input" name="name" value={invoice.sender.name} onChange={handleSenderChange} required />
        </div>
        <div>
          <label className="form-label">Business Name</label>
          <input className="form-input" name="businessName" value={invoice.sender.businessName} onChange={handleSenderChange} />
        </div>
        <div className="form-grid-full">
          <label className="form-label">Address</label>
          <input className="form-input" name="address" value={invoice.sender.address} onChange={handleSenderChange} />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input className="form-input" name="phone" value={invoice.sender.phone} onChange={handleSenderChange} />
        </div>
      </div>
      <h3 className="form-section-title">Recipient Info</h3>
      <div className="form-grid">
        <div>
          <label className="form-label">Select Existing Client</label>
          <select className="form-input" onChange={handleSelectClient} defaultValue="">
            <option value="">-- Select Client --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Client Name</label>
          <input className="form-input" name="name" value={invoice.recipient.name} onChange={handleRecipientChange} required />
        </div>
        <div>
          <label className="form-label">Client Email</label>
          <input className="form-input" name="email" value={invoice.recipient.email} onChange={handleRecipientChange} required />
        </div>
        <div className="form-grid-full">
          <label className="form-label">Client Address</label>
          <input className="form-input" name="address" value={invoice.recipient.address} onChange={handleRecipientChange} />
        </div>
      </div>
      <h3 className="form-section-title">Line Items</h3>
      <div className="line-items-table-wrapper">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="lineItems">
            {(provided) => (
              <table className="line-items-table" ref={provided.innerRef} {...provided.droppableProps}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Tax (%)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, idx) => (
                    <Draggable key={idx} draggableId={`item-${idx}`} index={idx}>
                      {(provided) => (
                        <tr ref={provided.innerRef} {...provided.draggableProps} className="line-item-row">
                          <td {...provided.dragHandleProps} className="drag-handle" data-label="Reorder">≡</td>
                          <td style={{ position: 'relative' }} data-label="Description">
                            <input
                              className="form-input"
                              name="description"
                              value={item.description}
                              autoComplete="off"
                              onChange={e => handleLineItemChange(idx, e)}
                              list={`desc-suggestions-${idx}`}
                              required
                            />
                            <datalist id={`desc-suggestions-${idx}`}>
                              {getSuggestions(item.description).map((it, i) => (
                                <option key={i} value={it.description} />
                              ))}
                            </datalist>
                          </td>
                          <td data-label="Quantity">
                            <input
                              className="form-input"
                              type="number"
                              min="1"
                              name="quantity"
                              value={item.quantity}
                              onChange={e => handleLineItemChange(idx, e)}
                              required
                            />
                          </td>
                          <td style={{ position: 'relative' }} data-label="Unit Price">
                            <input
                              className="form-input"
                              type="number"
                              min="0"
                              step="0.01"
                              name="unitPrice"
                              value={item.unitPrice}
                              autoComplete="off"
                              onChange={e => handleLineItemChange(idx, e)}
                              list={`price-suggestions-${idx}`}
                              required
                            />
                            <datalist id={`price-suggestions-${idx}`}>
                              {getSuggestions(item.description).map((it, i) => (
                                <option key={i} value={it.unitPrice} />
                              ))}
                            </datalist>
                          </td>
                          <td data-label="Tax (%)">
                            <input
                              className="form-input"
                              type="number"
                              min="0"
                              step="0.01"
                              name="tax"
                              value={item.tax}
                              onChange={e => handleLineItemChange(idx, e)}
                            />
                          </td>
                          <td data-label="Remove">
                            <button type="button" className="btn-secondary" onClick={() => removeLineItem(idx)} disabled={invoice.lineItems.length === 1}>Remove</button>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              </table>
            )}
          </Droppable>
        </DragDropContext>
        <div style={{ margin: '1em 0' }}>
          <button type="button" className="btn-primary" onClick={addLineItem}>Add Line Item</button>
        </div>
      </div>
      <div className="form-grid-full" style={{ marginBottom: '1em' }}>
        <strong>Subtotal:</strong> ${subtotal.toFixed(2)}<br />
        <strong>Tax:</strong> ${totalTax.toFixed(2)}<br />
        <strong>Total:</strong> ${total.toFixed(2)}
      </div>
      <div className="form-grid-full">
        <label className="form-label">Notes</label>
        <textarea className="form-input" name="notes" value={invoice.notes} onChange={handleChange} rows={3} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">{isQuote ? 'Save Quote' : 'Save Invoice'}</button>
      </div>
    </form>
  );
}
