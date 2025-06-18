import React, { useEffect, useState } from 'react';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';

function EditClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState({ ...client });
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit Client</h3>
        <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input className="form-input" name="email" value={form.email} onChange={handleChange} placeholder="Email" />
        <input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="Address" />
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-primary" onClick={() => onSave(form)}>Save</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    clientService.getClients(currentUser.uid).then(setClients).finally(() => setLoading(false));
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    await clientService.deleteClient(id);
    setClients(clients.filter(c => c.id !== id));
  };

  const handleEdit = (client) => setEditing(client);
  const handleSaveEdit = async (updated) => {
    await clientService.updateClient(updated.id, updated);
    setClients(clients.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setEditing(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <h2 className="page-title">Saved Clients</h2>
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.email}</td>
              <td>{client.address}</td>
              <td>
                <button className="action-btn edit" onClick={() => handleEdit(client)}>Edit</button>
                <button className="action-btn delete" onClick={() => handleDelete(client.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <EditClientModal client={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

/* Add minimal modal styles to global.css if not present */
