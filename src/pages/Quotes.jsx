import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/InvoiceServices';
import InvoiceTable from '../components/InvoiceTable';
import { Link } from 'react-router-dom';

export default function Quotes() {
  const { currentUser } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchQuotes = async () => {
      setLoading(true);
      try {
        const all = await invoiceService.getInvoices(currentUser.uid);
        setQuotes(all.filter(q => q.type === 'quote' || q.status === 'quote'));
      } catch (e) {
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title">Quotes</h2>
        <Link to="/quotes/new" className="btn-primary">Create Quote</Link>
      </div>
      <InvoiceTable invoices={quotes} />
    </div>
  );
}
