import React, { useEffect, useState } from 'react';
import { itemService } from '../services/itemService';
import { useAuth } from '../contexts/AuthContext';

function EditItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit Item</h3>
        <input className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="Description" />
        <input className="form-input" name="unitPrice" type="number" value={form.unitPrice} onChange={handleChange} placeholder="Unit Price" />
        <input className="form-input" name="tax" type="number" value={form.tax || 0} onChange={handleChange} placeholder="Tax (%)" />
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-primary" onClick={() => onSave({ ...form, unitPrice: Number(form.unitPrice), tax: Number(form.tax) })}>Save</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Items() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    itemService.getItems(currentUser.uid).then(setItems).finally(() => setLoading(false));
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await itemService.deleteItem(id);
    setItems(items.filter(i => i.id !== id));
  };

  const handleEdit = (item) => setEditing(item);
  const handleSaveEdit = async (updated) => {
    await itemService.updateItem(updated.id, updated);
    setItems(items.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    setEditing(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h2 className="page-title">Saved Items</h2>
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
              <td>{item.description}</td>
              <td>${item.unitPrice}</td>
              <td>{item.tax || 0}</td>
              <td>
                <button className="action-btn edit" onClick={() => handleEdit(item)}>Edit</button>
                <button className="action-btn delete" onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <EditItemModal item={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

/* Add minimal modal styles to global.css if not present */
