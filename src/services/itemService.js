import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'items';

export const itemService = {
  // Create a new item
  async createItem(itemData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // Get all items for a user
  async getItems(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      return items;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Update an item
  async updateItem(itemId, updateData) {
    try {
      const itemRef = doc(db, COLLECTION_NAME, itemId);
      await updateDoc(itemRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  // Delete an item
  async deleteItem(itemId) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }
};
