import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { invoiceService } from '../services/InvoiceServices';

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchInvoices();
    }
  }, [currentUser]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedInvoices = await invoiceService.getInvoices(currentUser.uid);
      setInvoices(fetchedInvoices);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (invoiceData) => {
    try {
      const invoiceId = await invoiceService.createInvoice({
        ...invoiceData,
        userId: currentUser.uid
      });
      await fetchInvoices(); // Refresh the list
      return invoiceId;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateInvoice = async (invoiceId, updateData) => {
    try {
      await invoiceService.updateInvoice(invoiceId, updateData);
      await fetchInvoices(); // Refresh the list
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteInvoice = async (invoiceId) => {
    try {
      await invoiceService.deleteInvoice(invoiceId);
      setInvoices(invoices.filter(inv => inv.id !== invoiceId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getInvoiceStats = () => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingAmount = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalAmount,
      paidAmount,
      pendingAmount
    };
  };

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refreshInvoices: fetchInvoices,
    stats: getInvoiceStats()
  };
}
