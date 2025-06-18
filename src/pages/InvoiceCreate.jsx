import React, { useEffect, useState } from 'react';
import InvoiceForm from '../components/InvoiceForm';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/InvoiceServices';
import { clientService } from '../services/clientService';
import { itemService } from '../services/itemService';
import { useAuth } from '../contexts/AuthContext';

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientList, itemList] = await Promise.all([
          clientService.getClients(currentUser.uid),
          itemService.getItems(currentUser.uid)
        ]);
        setClients(clientList);
        setItems(itemList);
      } catch (e) {
        setClients([]);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleSave = async (invoice) => {
    try {
      // Save invoice
      await invoiceService.createInvoice({ ...invoice, userId: currentUser.uid });
      // Save recipient as client if not already saved
      if (invoice.recipient && invoice.recipient.email) {
        const exists = clients.some(c => c.email === invoice.recipient.email);
        if (!exists) {
          await clientService.createClient({ ...invoice.recipient, userId: currentUser.uid });
        }
      }
      // Save new line items for reuse
      for (const item of invoice.lineItems) {
        const exists = items.some(i => i.description === item.description && i.unitPrice === item.unitPrice);
        if (!exists && item.description) {
          await itemService.createItem({ ...item, userId: currentUser.uid });
        }
      }
      navigate('/invoices');
    } catch (error) {
      alert('Failed to save invoice: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <InvoiceForm onSave={handleSave} clients={clients} items={items} />
    </div>
  );
}
