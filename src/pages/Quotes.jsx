import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/InvoiceServices';
import InvoiceTable from '../components/InvoiceTable';
import { Link } from 'react-router-dom';

export default function Quotes() {
  const { currentUser } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

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

  // Get unique client names for filter dropdown
  const clientNames = Array.from(new Set(quotes.map(q => q.recipient?.name || q.clientName).filter(Boolean)));

  // Filtering logic
  const filteredQuotes = quotes.filter(quote => {
    if (clientFilter && (quote.recipient?.name || quote.clientName) !== clientFilter) return false;
    if (dateRange.from && new Date(quote.date) < new Date(dateRange.from)) return false;
    if (dateRange.to && new Date(quote.date) > new Date(dateRange.to)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(
        (quote.invoiceNumber && quote.invoiceNumber.toLowerCase().includes(s)) ||
        (quote.recipient?.name && quote.recipient.name.toLowerCase().includes(s)) ||
        (quote.clientName && quote.clientName.toLowerCase().includes(s)) ||
        (quote.recipient?.email && quote.recipient.email.toLowerCase().includes(s)) ||
        (quote.clientEmail && quote.clientEmail.toLowerCase().includes(s))
      )) return false;
    }
    return true;
  });

  // Sorting logic
  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'client':
        aVal = (a.recipient?.name || a.clientName || '').toLowerCase();
        bVal = (b.recipient?.name || b.clientName || '').toLowerCase();
        break;
      case 'amount':
        aVal = a.total || 0;
        bVal = b.total || 0;
        break;
      case 'date':
      default:
        aVal = new Date(a.date);
        bVal = new Date(b.date);
        break;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) return (
    <div className="centered-screen">
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading quotes...</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-row">
            <div className="header-left">
              <Link to="/dashboard" className="back-link">
                ← Back to Dashboard
              </Link>
              <h1 className="page-title">Quotes</h1>
            </div>
            <Link to="/quotes/new" className="primary-btn">Create Quote</Link>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="app-main">
        {/* Search and Filters */}
        <div className="filter-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em', alignItems: 'center', marginBottom: 16 }}>
            <input
              className="form-input"
              style={{ maxWidth: 220 }}
              type="text"
              placeholder="Search by number, client, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="form-input"
              style={{ maxWidth: 180 }}
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
            >
              <option value="">All Clients</option>
              {clientNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <input
              className="form-input"
              style={{ maxWidth: 140 }}
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
              placeholder="From"
            />
            <input
              className="form-input"
              style={{ maxWidth: 140 }}
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
              placeholder="To"
            />
            <select
              className="form-input"
              style={{ maxWidth: 160 }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="client">Sort by Client</option>
              <option value="amount">Sort by Amount</option>
            </select>
            <button
              type="button"
              className="btn-secondary"
              style={{ minWidth: 40 }}
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        {/* Quotes Table */}
        <div className="table-card">
          <InvoiceTable invoices={sortedQuotes} />
        </div>
      </main>
    </div>
  );
}
