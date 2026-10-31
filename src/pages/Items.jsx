import React, { useEffect, useState } from 'react';
import { itemService } from '../services/itemService';
import { useAuth } from '../contexts/AuthContext';

function EditItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({ description: '', unitPrice: 0, tax: 0, ...item });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave({ description: form.description.trim(), unitPrice: Number(form.unitPrice), tax: Number(form.tax || 0) });
    } catch (error) {
      console.error('Error saving item:', error);
      setError(`Failed to save item: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <form className="modal" role="dialog" aria-modal="true" aria-label={item.id ? 'Edit Item' : 'Add Item'} onSubmit={handleSubmit}>
        <h3>{item.id ? 'Edit Item' : 'Add Item'}</h3>
        {error && <p role="alert">{error}</p>}
        <fieldset className="document-fields" disabled={saving}>
        <label className="form-label">Description<textarea className="form-input" name="description" required rows={3} value={form.description} onChange={handleChange} /></label>
        <label className="form-label">Unit Price<input className="form-input" name="unitPrice" type="number" step="0.01" required value={form.unitPrice} onChange={handleChange} /></label>
        <label className="form-label">Tax (%)<input className="form-input" name="tax" type="number" step="0.01" value={form.tax} onChange={handleChange} /></label>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-primary" type="submit">{saving ? 'Saving...' : 'Save'}</button>
          <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
      </div>
      </fieldset>
        </form>
    </div>
  );
}

export default function Items() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    itemService.getItems(currentUser.uid).then(setItems).catch(error => {
      console.error('Error loading items:', error);
      setError(`Failed to load items: ${error.message}`);
    }).finally(() => setLoading(false));
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await itemService.deleteItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(`Failed to delete item: ${error.message}`);
    }
  };

  const handleEdit = (item) => setEditing(item);
  const handleSaveEdit = async (updated) => {
    if (editing.id) {
      await itemService.updateItem(editing.id, updated);
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...updated } : i));
    } else {
      const id = await itemService.createItem({ ...updated, userId: currentUser.uid });
      setItems(prev => [...prev, { ...updated, id }]);
    }
    setEditing(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h2 className="page-title">Saved Items</h2>
      <button className="btn-primary" onClick={() => setEditing({})}>Add Item</button>
      {error && <p role="alert">{error}</p>}
      {!items.length && <p>No saved items. Add an item or save one from an invoice.</p>}
      <div className="table-responsive">
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Unit Price</th>
            <th>Tax (%)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td data-label="Description" className="wrap-cell">{item.description}</td>
              <td data-label="Unit Price">${Number(item.unitPrice).toFixed(2)}</td>
              <td data-label="Tax (%)">{item.tax || 0}</td>
              <td data-label="Actions">
                <button className="action-btn edit" onClick={() => handleEdit(item)}>Edit</button>
                <button className="action-btn delete" onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {editing && (
        <EditItemModal key={editing.id || 'new'} item={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
