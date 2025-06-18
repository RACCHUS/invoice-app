import React, { useEffect, useState } from 'react';
import InvoiceForm from '../components/InvoiceForm';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/InvoiceServices';
import { clientService } from '../services/clientService';
import { itemService } from '../services/itemService';
import { useAuth } from '../contexts/AuthContext';

export default function QuoteCreate() {
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

  const handleSave = async (quote) => {
    try {
      await invoiceService.createInvoice({ ...quote, userId: currentUser.uid, type: 'quote', status: 'quote' });
      navigate('/quotes');
    } catch (error) {
      alert('Failed to save quote: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <InvoiceForm onSave={handleSave} clients={clients} items={items} initialData={{ status: 'quote', type: 'quote' }} />
    </div>
  );
}
