import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvoiceForm from '../components/InvoiceForm';
import { invoiceService } from '../services/InvoiceServices';
import { clientService } from '../services/clientService';
import { itemService } from '../services/itemService';
import { useAuth } from '../contexts/AuthContext';

export default function InvoiceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientList, itemList, invoiceData] = await Promise.all([
          clientService.getClients(currentUser.uid),
          itemService.getItems(currentUser.uid),
          invoiceService.getInvoiceById(id)
        ]);
        setClients(clientList);
        setItems(itemList);
        setInvoice(invoiceData);
      } catch (e) {
        setClients([]);
        setItems([]);
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, id]);

  const handleSave = async (updatedInvoice) => {
    try {
      await invoiceService.updateInvoice(id, updatedInvoice);
      navigate(`/invoices/${id}`);
    } catch (error) {
      alert('Failed to update invoice: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!invoice) return <div>Invoice not found.</div>;

  return (
    <div className="container">
      <InvoiceForm onSave={handleSave} clients={clients} items={items} initialData={invoice} />
    </div>
  );
}
