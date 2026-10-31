import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import InvoiceForm from './InvoiceForm';
import { useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/InvoiceServices';
import { clientService } from '../services/clientService';
import { itemService } from '../services/itemService';
import { isQuote, suggestNextNumber } from '../utils/invoiceData';
import { getClientDetails } from '../utils/clientDetails';

export default function DocumentEditor({ type = 'invoice', editing = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const basePath = type === 'quote' ? '/quotes' : '/invoices';
  const editorKey = `${currentUser.uid}-${type}-${editing ? id : 'new'}`;
  const readyData = data?.editorKey === editorKey ? data : null;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [clients, items, invoices, document] = await Promise.all([
          clientService.getClients(currentUser.uid),
          itemService.getItems(currentUser.uid),
          invoiceService.getInvoices(currentUser.uid),
          editing ? invoiceService.getInvoiceById(id) : Promise.resolve(null)
        ]);
        if (editing && (!document || isQuote(document) !== (type === 'quote'))) {
          throw new Error(`${type === 'quote' ? 'Quote' : 'Invoice'} not found.`);
        }
        const suggestedNumber = suggestNextNumber(invoices, type);
        const savedClient = document && clients.find(client =>
          client.name === document.recipient?.name && getClientDetails(client, 'emails').some(detail =>
            detail.value.toLowerCase() === document.recipient?.email?.toLowerCase()));
        if (active) setData({
          editorKey: `${currentUser.uid}-${type}-${editing ? id : 'new'}`,
          clients, items, invoices, suggestedNumber,
          initialData: document ? { ...document, clientId: document.clientId || savedClient?.id || '' } : {
            invoiceNumber: suggestedNumber,
            sender: invoices.find(invoice => invoice.sender?.businessName)?.sender,
            type, status: type === 'quote' ? 'quote' : 'pending'
          }
        });
      } catch (error) {
        console.error('Error loading document editor:', error);
        if (active) setError(error.message);
      }
    }
    load();
    return () => { active = false; };
  }, [currentUser.uid, editing, id, type]);

  async function handleSave(invoice, options) {
    setSaving(true);
    setError('');
    try {
      await invoiceService.saveWithDetails({
        ...invoice, userId: currentUser.uid, type,
        status: type === 'quote' ? 'quote' : invoice.status
      }, { ...options, id: editing ? id : undefined });
      navigate(editing ? `${basePath}/${id}` : basePath);
    } catch (error) {
      console.error('Error saving document:', error);
      setError(`Nothing was saved. ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <Link to={basePath}>Back to {type === 'quote' ? 'quotes' : 'invoices'}</Link>
      {error && <p role="alert">{error}</p>}
      {!readyData && !error && <p>Loading...</p>}
      {readyData && <InvoiceForm
        key={editorKey}
        onSave={handleSave}
        clients={readyData.clients}
        items={readyData.items}
        initialData={readyData.initialData}
        suggestedNumber={readyData.suggestedNumber}
        history={readyData.invoices.filter(invoice => invoice.id !== id)}
        existingNumbers={readyData.invoices.filter(invoice => invoice.id !== id && isQuote(invoice) === (type === 'quote')).map(invoice => String(invoice.invoiceNumber))}
        editing={editing}
        saving={saving}
      />}
    </div>
  );
}
