import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvoiceForm from '../components/InvoiceForm';
import { invoiceService } from '../services/InvoiceServices';
import { clientService } from '../services/clientService';
import { itemService } from '../services/itemService';
import { useAuth } from '../contexts/AuthContext';

export default function QuoteEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [quote, setQuote] = useState(null);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientList, itemList, quoteData] = await Promise.all([
          clientService.getClients(currentUser.uid),
          itemService.getItems(currentUser.uid),
          invoiceService.getInvoiceById(id)
        ]);
        setClients(clientList);
        setItems(itemList);
        setQuote(quoteData);
      } catch (e) {
        setClients([]);
        setItems([]);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, id]);

  const handleSave = async (updatedQuote) => {
    try {
      await invoiceService.updateInvoice(id, { ...updatedQuote, type: 'quote', status: 'quote' });
      navigate('/quotes');
    } catch (error) {
      alert('Failed to update quote: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!quote) return <div>Quote not found.</div>;

  return (
    <div className="container">
      <InvoiceForm onSave={handleSave} clients={clients} items={items} initialData={quote} />
    </div>
  );
}
