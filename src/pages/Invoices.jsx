import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/InvoiceServices';
import InvoiceTable from '../components/InvoiceTable';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [clientFilter, setClientFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchInvoices();
  }, [currentUser]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const fetchedInvoices = await invoiceService.getInvoices(currentUser.uid);
      setInvoices(fetchedInvoices);
      console.log('Invoices state:', fetchedInvoices); // Debug log
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceService.deleteInvoice(invoiceId);
        setInvoices(invoices.filter(inv => inv.id !== invoiceId));
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  // Get unique client names for filter dropdown
  const clientNames = Array.from(new Set(invoices.map(inv => inv.recipient?.name || inv.clientName).filter(Boolean)));

  // Enhanced filtering logic
  const filteredInvoices = invoices.filter(invoice => {
    // Status filter
    if (filter !== 'all' && invoice.status !== filter) return false;
    // Client filter
    if (clientFilter && (invoice.recipient?.name || invoice.clientName) !== clientFilter) return false;
    // Date range filter
    if (dateRange.from && new Date(invoice.date) < new Date(dateRange.from)) return false;
    if (dateRange.to && new Date(invoice.date) > new Date(dateRange.to)) return false;
    // Free-text search (number, client, email, etc)
    if (search) {
      const s = search.toLowerCase();
      if (!(
        (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(s)) ||
        (invoice.recipient?.name && invoice.recipient.name.toLowerCase().includes(s)) ||
        (invoice.clientName && invoice.clientName.toLowerCase().includes(s)) ||
        (invoice.recipient?.email && invoice.recipient.email.toLowerCase().includes(s)) ||
        (invoice.clientEmail && invoice.clientEmail.toLowerCase().includes(s))
      )) return false;
    }
    return true;
  });

  // Sorting logic
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
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

  if (loading) {
    return (
      <div className="centered-screen">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading invoices...</p>
        </div>
      </div>
    );
  }
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
              <h1 className="page-title">Invoices</h1>
            </div>
            <Link
              to="/invoices/new"
              className="primary-btn"
            >
              Create New Invoice
            </Link>
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
          <div className="filter-btn-group">
            <button
              onClick={() => setFilter('all')}
              className={`filter-btn${filter === 'all' ? ' active all' : ''}`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`filter-btn${filter === 'pending' ? ' active pending' : ''}`}
            >
              Pending ({invoices.filter(inv => inv.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`filter-btn${filter === 'paid' ? ' active paid' : ''}`}
            >
              Paid ({invoices.filter(inv => inv.status === 'paid').length})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`filter-btn${filter === 'overdue' ? ' active overdue' : ''}`}
            >
              Overdue ({invoices.filter(inv => inv.status === 'overdue').length})
            </button>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="table-card">
          <InvoiceTable 
            invoices={sortedInvoices} 
            onDelete={handleDeleteInvoice}
          />
        </div>
      </main>
    </div>
  );
}