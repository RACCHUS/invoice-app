import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/InvoiceServices';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    totalAmount: 0
  });

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, [currentUser]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const fetchedInvoices = await invoiceService.getInvoices(currentUser.uid);
      setInvoices(fetchedInvoices);
      
      // Calculate stats
      const totalInvoices = fetchedInvoices.length;
      const paidInvoices = fetchedInvoices.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = fetchedInvoices.filter(inv => inv.status === 'pending').length;
      const totalAmount = fetchedInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      setStats({
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        totalAmount
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date.seconds * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #2563eb', borderTop: '4px solid transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: 16, color: '#4b5563' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: 32 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1em' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5em 0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a202c' }}>Invoice App</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {currentUser.photoURL && (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    style={{ height: 32, width: 32, borderRadius: '50%' }}
                  />
                )}
                <span style={{ color: '#374151' }}>
                  Welcome, <span style={{ fontWeight: 600 }}>
                    {currentUser.displayName || currentUser.email}
                  </span>
                </span>
              </div>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: 12, borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div style={{ marginLeft: 16 }}>
                <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>Total Invoices</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: '#1a202c', margin: 0 }}>{stats.totalInvoices}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: 12, borderRadius: '50%', background: '#bbf7d0', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div style={{ marginLeft: 16 }}>
                <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>Paid Invoices</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: '#1a202c', margin: 0 }}>{stats.paidInvoices}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: 12, borderRadius: '50%', background: '#fef9c3', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div style={{ marginLeft: 16 }}>
                <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>Pending Invoices</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: '#1a202c', margin: 0 }}>{stats.pendingInvoices}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: 12, borderRadius: '50%', background: '#ede9fe', color: '#a21caf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div style={{ marginLeft: 16 }}>
                <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>Total Amount</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: '#1a202c', margin: 0 }}>{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a202c', marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <Link to="/invoices/new" style={{ display: 'flex', alignItems: 'center', padding: 16, border: '2px dashed #d1d5db', borderRadius: 12, textDecoration: 'none', color: '#1a202c', background: '#f9fafb', transition: 'border 0.2s, background 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: 8, background: '#dbeafe', borderRadius: 8 }}>
                    <svg style={{ width: 20, height: 20, color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span style={{ marginLeft: 12, fontSize: 15, fontWeight: 500 }}>Create New Invoice</span>
                </div>
              </Link>
              <Link to="/invoices" style={{ display: 'flex', alignItems: 'center', padding: 16, border: '2px dashed #d1d5db', borderRadius: 12, textDecoration: 'none', color: '#1a202c', background: '#f9fafb', transition: 'border 0.2s, background 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: 8, background: '#bbf7d0', borderRadius: 8 }}>
                    <svg style={{ width: 20, height: 20, color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span style={{ marginLeft: 12, fontSize: 15, fontWeight: 500 }}>View All Invoices</span>
                </div>
              </Link>
              <Link to="/clients" style={{ display: 'flex', alignItems: 'center', padding: 16, border: '2px dashed #d1d5db', borderRadius: 12, textDecoration: 'none', color: '#1a202c', background: '#f9fafb', transition: 'border 0.2s, background 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: 8, background: '#ede9fe', borderRadius: 8 }}>
                    <svg style={{ width: 20, height: 20, color: '#a21caf' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span style={{ marginLeft: 12, fontSize: 15, fontWeight: 500 }}>Manage Clients</span>
                </div>
              </Link>
              <Link to="/quotes/new" style={{ display: 'flex', alignItems: 'center', padding: 16, border: '2px dashed #d1d5db', borderRadius: 12, textDecoration: 'none', color: '#1a202c', background: '#f9fafb', transition: 'border 0.2s, background 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: 8, background: '#fef9c3', borderRadius: 8 }}>
                    <svg style={{ width: 20, height: 20, color: '#eab308' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span style={{ marginLeft: 12, fontSize: 15, fontWeight: 500 }}>Create New Quote</span>
                </div>
              </Link>
              <Link to="/quotes" style={{ display: 'flex', alignItems: 'center', padding: 16, border: '2px dashed #d1d5db', borderRadius: 12, textDecoration: 'none', color: '#1a202c', background: '#f9fafb', transition: 'border 0.2s, background 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: 8, background: '#fef9c3', borderRadius: 8 }}>
                    <svg style={{ width: 20, height: 20, color: '#eab308' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span style={{ marginLeft: 12, fontSize: 15, fontWeight: 500 }}>View All Quotes</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a202c' }}>Recent Invoices</h2>
              <Link to="/invoices" style={{ color: '#2563eb', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>View All</Link>
            </div>
            
            {invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3em 0' }}>
                <svg style={{ width: 48, height: 48, color: '#9ca3af', margin: '0 auto 1em' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p style={{ color: '#6b7280', marginBottom: 16 }}>No invoices yet</p>
                <Link to="/invoices/new" className="btn-primary">Create Your First Invoice</Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f3f4f6' }}>
                    <tr>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Invoice #</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Client</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Amount</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Status</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((invoice) => (
                      <tr key={invoice.id} style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1a202c' }}>#{invoice.invoiceNumber || invoice.id.slice(-6)}</td>
                        <td style={{ padding: '16px 24px', color: '#1a202c' }}>{invoice.clientName || 'Unknown Client'}</td>
                        <td style={{ padding: '16px 24px', color: '#1a202c' }}>{formatCurrency(invoice.total || 0)}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 12px', fontSize: 13, fontWeight: 600, borderRadius: 12, background: invoice.status === 'paid' ? '#bbf7d0' : invoice.status === 'pending' ? '#fef9c3' : '#fee2e2', color: invoice.status === 'paid' ? '#15803d' : invoice.status === 'pending' ? '#b45309' : '#b91c1c' }}>
                            {invoice.status || 'draft'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', color: '#6b7280' }}>{invoice.createdAt ? formatDate(invoice.createdAt) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}