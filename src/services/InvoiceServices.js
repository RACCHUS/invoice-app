import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { clientService } from './clientService';
import { itemService } from './itemService';
import { calculateTotals, normalizeInvoice, suggestNextNumber } from '../utils/invoiceData';
import { getClientDetails, mergeClientDetails } from '../utils/clientDetails';

const COLLECTION_NAME = 'invoices';

export const invoiceService = {
  // Create a new invoice
  async createInvoice(invoiceData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...invoiceData,
        ...calculateTotals(invoiceData.lineItems),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Get all invoices for a user
  async getInvoices(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const invoices = [];
      querySnapshot.forEach((doc) => {
        invoices.push(normalizeInvoice({ id: doc.id, ...doc.data() }));
      });
      return invoices.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  // Get a single invoice by ID
  async getInvoiceById(invoiceId) {
    try {
      const invoiceRef = doc(db, COLLECTION_NAME, invoiceId);
      const docSnap = await getDoc(invoiceRef);
      if (docSnap.exists()) {
        return normalizeInvoice({ id: docSnap.id, ...docSnap.data() });
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching invoice by ID:', error);
      throw error;
    }
  },

  // Update an invoice
  async updateInvoice(invoiceId, updateData) {
    try {
      const invoiceRef = doc(db, COLLECTION_NAME, invoiceId);
      await updateDoc(invoiceRef, {
        ...updateData,
        ...(updateData.lineItems ? calculateTotals(updateData.lineItems) : {}),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  async saveWithDetails(invoiceData, { id, saveClient = true, saveItems = true } = {}) {
    try {
      const batch = writeBatch(db);
      const invoiceRef = id ? doc(db, COLLECTION_NAME, id) : doc(collection(db, COLLECTION_NAME));
      const data = {
        ...invoiceData,
        ...calculateTotals(invoiceData.lineItems),
        updatedAt: serverTimestamp()
      };
      delete data.id;
      if (!id) data.createdAt = serverTimestamp();
      if (saveClient && invoiceData.recipient?.name?.trim()) {
        const clients = await clientService.getClients(invoiceData.userId);
        const recipient = invoiceData.recipient;
        const existing = clients.find(client => client.id === invoiceData.clientId)
          || clients.find(client => client.name.trim().toLowerCase() === recipient.name.trim().toLowerCase()
            && (!recipient.email || getClientDetails(client, 'emails').some(detail =>
              detail.value.toLowerCase() === recipient.email.trim().toLowerCase())));
        const clientRef = existing ? doc(db, 'clients', existing.id) : doc(collection(db, 'clients'));
        data.clientId = clientRef.id;
        const details = mergeClientDetails(existing || {}, recipient, invoiceData.jobSite || '');
        batch.set(clientRef, {
          ...details, userId: invoiceData.userId, updatedAt: serverTimestamp(),
          ...(!existing ? { createdAt: serverTimestamp() } : {})
        }, { merge: true });
      }
      if (saveItems) {
        const items = await itemService.getItems(invoiceData.userId);
        for (const item of invoiceData.lineItems) {
          if (!item.description.trim()) continue;
          const exists = items.some(saved => saved.description === item.description
            && Number(saved.unitPrice) === item.unitPrice && Number(saved.tax || 0) === item.tax);
          if (!exists) {
            const saved = { description: item.description, unitPrice: item.unitPrice, tax: item.tax };
            batch.set(doc(collection(db, 'items')), {
              ...saved, userId: invoiceData.userId,
              createdAt: serverTimestamp(), updatedAt: serverTimestamp()
            });
            items.push(saved);
          }
        }
      }
      if (id) batch.update(invoiceRef, data);
      else batch.set(invoiceRef, data);
      await batch.commit();
      return invoiceRef.id;
    } catch (error) {
      console.error('Error saving invoice and reusable details:', error);
      throw error;
    }
  },

  async convertToInvoice(invoice) {
    const invoices = await this.getInvoices(invoice.userId);
    const updatedData = {
      type: 'invoice', status: 'pending',
      invoiceNumber: suggestNextNumber(invoices),
      ...calculateTotals(invoice.lineItems)
    };
    await this.updateInvoice(invoice.id, updatedData);
    return updatedData;
  },

  // Delete an invoice
  async deleteInvoice(invoiceId) {
    if (!invoiceId) throw new Error('Missing invoice id to delete.');
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
};