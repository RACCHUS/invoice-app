import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'invoices';

export const invoiceService = {
  // Create a new invoice
  async createInvoice(invoiceData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...invoiceData,
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
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const invoices = [];
      querySnapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() });
      });
      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  // Get a single invoice by ID
  async getInvoiceById(invoiceId) {
    try {
      const invoiceRef = doc(db, COLLECTION_NAME, invoiceId);
      const docSnap = await getDocs(query(collection(db, COLLECTION_NAME), where('__name__', '==', invoiceId)));
      if (!docSnap.empty) {
        const docData = docSnap.docs[0];
        return { id: docData.id, ...docData.data() };
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
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  // Delete an invoice
  async deleteInvoice(invoiceId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
};