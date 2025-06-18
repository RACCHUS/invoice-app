import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'clients';

export const clientService = {
  // Create a new client
  async createClient(clientData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...clientData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  // Get all clients for a user
  async getClients(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const clients = [];
      querySnapshot.forEach((doc) => {
        clients.push({ id: doc.id, ...doc.data() });
      });
      return clients;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  // Update a client
  async updateClient(clientId, updateData) {
    try {
      const clientRef = doc(db, COLLECTION_NAME, clientId);
      await updateDoc(clientRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  // Delete a client
  async deleteClient(clientId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }
};