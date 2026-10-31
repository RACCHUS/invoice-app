import { useEffect, useState } from 'react';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import ClientForm from '../components/clientForm';
import { getClientDetails } from '../utils/clientDetails';
import { friendlyError } from '../utils/errors';

export default function Clients() {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    clientService.getClients(currentUser.uid).then(setClients).catch(error => {
      console.error('Error loading clients:', error);
      setError(`Failed to load clients: ${error.message}`);
    }).finally(() => setLoading(false));
  }, [currentUser.uid]);

  async function handleDelete(id) {
    if (deletingId || !window.confirm('Delete this saved client? Existing invoices will not change.')) return;
    setDeletingId(id);
    setError('');
    try {
      await clientService.deleteClient(id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (error) {
      setError(friendlyError('delete the client', error));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave(data) {
    if (editing.id) {
      await clientService.updateClient(editing.id, data);
      setClients(prev => prev.map(client => client.id === editing.id ? { ...client, ...data } : client));
    } else {
      const id = await clientService.createClient({ ...data, userId: currentUser.uid });
      setClients(prev => [...prev, { ...data, id }]);
    }
    setEditing(null);
  }

  return (
    <div className="container">
      <h2 className="page-title">Saved Clients</h2>
      <button className="btn-primary" onClick={() => setEditing({})}>Add Client</button>
      {error && <p role="alert">{error}</p>}
      {loading ? <p>Loading...</p> : !clients.length ? <p>No saved clients. Add a client or save one from an invoice.</p> : (
        <div className="table-responsive">
          <table className="invoice-table">
            <thead><tr><th>Name</th><th>Emails</th><th>Addresses</th><th>Actions</th></tr></thead>
            <tbody>{clients.map(client => (
              <tr key={client.id}>
                <td data-label="Name">{client.name}</td>
                <td data-label="Emails"><div>{getClientDetails(client, 'emails').map(detail => <p key={detail.value}>{detail.label}: {detail.value}</p>)}</div></td>
                <td data-label="Addresses" className="wrap-cell"><div>{getClientDetails(client, 'addresses').map(detail => <p key={detail.value}>{detail.label}: {detail.value}</p>)}</div></td>
                <td data-label="Actions"><div className="table-actions">
                  <button className="action-btn edit" onClick={() => setEditing(client)}>Edit</button>
                  <button className="action-btn delete" disabled={deletingId === client.id} onClick={() => handleDelete(client.id)}>{deletingId === client.id ? 'Deleting...' : 'Delete'}</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {editing && <div className="modal-backdrop">
        <div className="modal" role="dialog" aria-modal="true" aria-label={editing.id ? 'Edit Client' : 'Add Client'}>
          <ClientForm key={editing.id || 'new'} initialData={editing.id ? editing : null} onSubmit={handleSave} onCancel={() => setEditing(null)} />
        </div>
      </div>}
    </div>
  );
}
