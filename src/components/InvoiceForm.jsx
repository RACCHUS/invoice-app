import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { calculateTotals, localDate, locationHistory } from '../utils/invoiceData';
import { getClientDetails } from '../utils/clientDetails';

export default function InvoiceForm({ onSave, clients = [], items = [], history = [], initialData = null, suggestedNumber = '', existingNumbers = [], editing = false, saving = false }) {
  // Initial state for invoice fields
  const [invoice, setInvoice] = useState(() => ({
    ...initialData,
    invoiceNumber: String(initialData?.invoiceNumber || ''),
    date: initialData?.date || localDate(),
    dueDate: initialData?.dueDate || '',
    sender: { name: '', businessName: '', address: '', phone: '', ...initialData?.sender },
    recipient: { name: '', address: '', email: '', ...initialData?.recipient },
    jobSite: initialData?.jobSite || '',
    lineItems: (initialData?.lineItems?.length ? initialData.lineItems : [
      { description: '', quantity: 1, unitPrice: 0, tax: 0 }
    ]).map(item => ({ building: '', unit: '', ...item, rowKey: crypto.randomUUID() })),
    notes: initialData?.notes || '',
    status: initialData?.status === 'overdue' ? 'pending' : initialData?.status || 'pending',
  }));
  const [saveClient, setSaveClient] = useState(true);
  const [saveItems, setSaveItems] = useState(true);
  const selectedClient = clients.find(client => client.id === invoice.clientId);
  const historyFor = building => locationHistory(history, {
    clientId: invoice.clientId, clientName: invoice.recipient.name, jobSite: invoice.jobSite, building
  });
  const { jobSites } = historyFor('');
  const unique = values => [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
  const siteOptions = unique([
    ...(selectedClient ? getClientDetails(selectedClient, 'addresses').map(detail => detail.value) : []),
    ...jobSites
  ]).filter(site => site !== invoice.jobSite.trim());
  const buildingOptions = unique([...historyFor('').buildings, ...invoice.lineItems.map(item => item.building)]);

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
        i === idx ? { ...item, [name]: value } : item
      );
      return { ...prev, lineItems: newItems };
    });
  };

  // New rows continue at the same building/unit as the row above.
  const addLineItem = () => {
    setInvoice((prev) => {
      const last = prev.lineItems[prev.lineItems.length - 1];
      return {
        ...prev,
        lineItems: [...prev.lineItems, {
          description: '', quantity: 1, unitPrice: 0, tax: 0,
          building: last?.building || '', unit: last?.unit || '', rowKey: crypto.randomUUID()
        }]
      };
    });
  };

  const removeLineItem = (idx) => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== idx)
    }));
  };

  // Calculate totals
  const { subtotal, totalTax, total } = calculateTotals(invoice.lineItems);

  // Save handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;
    const lineItems = invoice.lineItems.map(item => ({
      description: item.description.trim(), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), tax: Number(item.tax || 0),
      building: (item.building || '').trim(), unit: (item.unit || '').trim()
    }));
    onSave({ ...invoice, invoiceNumber: invoice.invoiceNumber.trim(), jobSite: invoice.jobSite.trim(), lineItems, ...calculateTotals(lineItems) }, { saveClient, saveItems });
  };

  // Select existing client and autofill recipient
  const handleSelectClient = (e) => {
    const clientId = e.target.value;
    if (!clientId) {
      setInvoice(prev => ({ ...prev, clientId: '' }));
      return;
    }
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setInvoice(prev => ({ ...prev, clientId, recipient: {
        name: client.name,
        address: getClientDetails(client, 'addresses')[0]?.value || '',
        email: getClientDetails(client, 'emails')[0]?.value || ''
      } }));
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
      it.description?.toLowerCase().includes(input.toLowerCase())
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
      <h2 className="form-title">{editing ? 'Edit' : 'Create'} {isQuote ? 'Quote' : 'Invoice'}</h2>
      <fieldset className="document-fields" disabled={saving}>
      <div className="form-grid">
        <div>
          <label className="form-label">{isQuote ? 'Quote Number' : 'Invoice Number'}</label>
          <input className="form-input" aria-label={isQuote ? 'Quote Number' : 'Invoice Number'} name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleChange} required />
          {suggestedNumber && <p className="form-help">Suggested next: {suggestedNumber}. You can enter your own number.</p>}
          {existingNumbers.includes(invoice.invoiceNumber.trim()) && <p role="alert">This number is already used. Check it before saving.</p>}
        </div>
        <div>
          <label className="form-label">Date</label>
          <input className="form-input" aria-label="Date" type="date" name="date" value={invoice.date} onChange={handleChange} required />
        </div>
        <div>
          <label className="form-label">{isQuote ? 'Valid Until' : 'Due Date'}</label>
          <input className="form-input" aria-label={isQuote ? 'Valid Until' : 'Due Date'} type="date" name="dueDate" min={invoice.date} value={invoice.dueDate} onChange={handleChange} />
        </div>
      </div>
      <h3 className="form-section-title">Sender Info</h3>
      <div className="form-grid">
        <div>
          <label className="form-label">Your Name</label>
          <input className="form-input" aria-label="Your Name" name="name" value={invoice.sender.name} onChange={handleSenderChange} />
        </div>
        <div>
          <label className="form-label">Business Name</label>
          <input className="form-input" aria-label="Business Name" name="businessName" value={invoice.sender.businessName} onChange={handleSenderChange} required />
        </div>
        <div className="form-grid-full">
          <label className="form-label">Address</label>
          <textarea className="form-input" aria-label="Sender Address" name="address" value={invoice.sender.address} onChange={handleSenderChange} rows={2} />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input className="form-input" aria-label="Phone" name="phone" type="tel" value={invoice.sender.phone} onChange={handleSenderChange} />
        </div>
      </div>
      <h3 className="form-section-title">Recipient Info</h3>
      <div className="form-grid">
        <div>
          <label className="form-label">Select Existing Client</label>
          <select className="form-input" aria-label="Select Existing Client" onChange={handleSelectClient} value={invoice.clientId || ''}>
            <option value="">-- Select Client --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}{client.email ? ` (${client.email})` : ''}</option>
            ))}
          </select>
          <Link to="/clients">Manage saved clients</Link>
        </div>
        <div>
          <label className="form-label">Client Name</label>
          <input className="form-input" aria-label="Client Name" name="name" value={invoice.recipient.name} onChange={handleRecipientChange} required />
        </div>
        <div>
          <label className="form-label">Client Email</label>
          {selectedClient && <select className="form-input" aria-label="Saved client email" name="email" value={invoice.recipient.email} onChange={handleRecipientChange}>
            <option value={invoice.recipient.email}>Current: {invoice.recipient.email || 'No email'}</option>
            {getClientDetails(selectedClient, 'emails').filter(detail => detail.value !== invoice.recipient.email).map(detail =>
              <option key={detail.value} value={detail.value}>{detail.label}: {detail.value}</option>)}
          </select>}
          <input className="form-input" type="email" aria-label="Client Email" name="email" value={invoice.recipient.email} onChange={handleRecipientChange} />
        </div>
        <div className="form-grid-full">
          <label className="form-label">Client Address</label>
          {selectedClient && <select className="form-input" aria-label="Saved client address" name="address" value={invoice.recipient.address} onChange={handleRecipientChange}>
            <option value={invoice.recipient.address}>Current: {invoice.recipient.address || 'No address'}</option>
            {getClientDetails(selectedClient, 'addresses').filter(detail => detail.value !== invoice.recipient.address).map(detail =>
              <option key={detail.value} value={detail.value}>{detail.label}: {detail.value}</option>)}
          </select>}
          <textarea className="form-input" aria-label="Client Address" name="address" value={invoice.recipient.address} onChange={handleRecipientChange} rows={2} />
        </div>
        <div className="form-grid-full">
          <label className="form-label">Job Site Address (optional)</label>
          {siteOptions.length > 0 && <select className="form-input" aria-label="Saved job site" name="jobSite" value="" onChange={handleChange}>
            <option value="">Use a saved address or past job site...</option>
            {siteOptions.map(site => <option key={site} value={site}>{site}</option>)}
          </select>}
          <textarea className="form-input" aria-label="Job Site Address" name="jobSite" value={invoice.jobSite} onChange={handleChange} rows={2} placeholder="Leave blank if the work isn't tied to a site" />
        </div>
      </div>
      <h3 className="form-section-title">Line Items</h3>
      <p className="form-help"><Link to="/items">Manage saved items</Link>. Selecting an item fills its description, price, and tax. Building and unit are optional; each new line item starts with the building and unit of the item above.</p>
      <div className="line-items-table-wrapper">
        <datalist id="building-suggestions">
          {buildingOptions.map(building => <option key={building} value={building} />)}
        </datalist>
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
                    <Draggable key={item.rowKey} draggableId={item.rowKey} index={idx}>
                      {(provided) => (
                        <tr ref={provided.innerRef} {...provided.draggableProps} className="line-item-row">
                          <td {...provided.dragHandleProps} className="drag-handle" data-label="Reorder">≡</td>
                          <td style={{ position: 'relative' }} data-label="Description">
                            <div className="line-item-location">
                              <label className="line-item-location-field">Building
                                <input className="form-input" aria-label={`Building ${idx + 1}`} name="building" placeholder="Optional"
                                  value={item.building} onChange={e => handleLineItemChange(idx, e)} list="building-suggestions" autoComplete="off" />
                              </label>
                              <label className="line-item-location-field">Unit
                                <input className="form-input" aria-label={`Unit ${idx + 1}`} name="unit" placeholder="Optional"
                                  value={item.unit} onChange={e => handleLineItemChange(idx, e)} list={`unit-suggestions-${idx}`} autoComplete="off" />
                              </label>
                              <datalist id={`unit-suggestions-${idx}`}>
                                {unique([...historyFor(item.building).units, ...invoice.lineItems
                                  .filter(other => (other.building || '').trim().toLowerCase() === (item.building || '').trim().toLowerCase())
                                  .map(other => other.unit)]).map(unit => <option key={unit} value={unit} />)}
                              </datalist>
                            </div>
                            <select className="form-input" aria-label={`Saved item ${idx + 1}`} value="" onChange={e => handleSelectItem(idx, e)}>
                              <option value="">Select saved item...</option>
                              {items.map(saved => <option key={saved.id} value={saved.id}>{saved.description} (${Number(saved.unitPrice).toFixed(2)})</option>)}
                            </select>
                            <textarea
                              className="form-input"
                              aria-label={`Description ${idx + 1}`}
                              name="description"
                              value={item.description}
                              autoComplete="off"
                              onChange={e => handleLineItemChange(idx, e)}
                              rows={3}
                              required
                            />
                          </td>
                          <td data-label="Quantity">
                            <input
                              className="form-input"
                              type="number"
                              aria-label={`Quantity ${idx + 1}`}
                              min="0.01"
                              step="any"
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
                              aria-label={`Unit Price ${idx + 1}`}
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
                              aria-label={`Tax ${idx + 1}`}
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
        {!isQuote && <label className="form-label">Payment status
          <select className="form-input" name="status" value={invoice.status} onChange={handleChange}>
            <option value="pending">Pending / unpaid</option>
            <option value="paid">Paid</option>
          </select>
          <span className="form-help">Unpaid invoices past their due date show as overdue automatically.</span>
        </label>}
        <label className="form-label">Notes</label>
        <textarea className="form-input" aria-label="Notes" name="notes" value={invoice.notes} onChange={handleChange} rows={3} />
      </div>
      <div className="form-actions">
        <label><input type="checkbox" checked={saveClient} onChange={e => setSaveClient(e.target.checked)} /> Save client details for reuse (append new addresses/emails)</label>
        <label><input type="checkbox" checked={saveItems} onChange={e => setSaveItems(e.target.checked)} /> Save new items for reuse</label>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : isQuote ? 'Save Quote' : 'Save Invoice'}</button>
      </div>
      </fieldset>
    </form>
  );
}
