// Server-side only - Firestore database operations for registrars
// This file should only be imported in API routes or server-side code

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase-server';

// Utility function to serialize Firestore data for client components
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }

  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized;
  }

  return data;
}

// Registrar data structure for Firestore
export interface RegistrarData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'registrar';
  photoURL?: string;
  createdAt: string; // ISO string (serialized from Firestore timestamp)
  updatedAt: string; // ISO string (serialized from Firestore timestamp)
  lastLoginAt: string; // ISO string (serialized from Firestore timestamp)
}

// Input type for creating registrars (allows FieldValue for timestamps)
export interface CreateRegistrarData extends Omit<RegistrarData, 'createdAt' | 'updatedAt' | 'lastLoginAt'> {
  createdAt: any; // Can be FieldValue or Date
  updatedAt: any; // Can be FieldValue or Date
  lastLoginAt: any; // Can be FieldValue or Date
}

// Firestore database class for registrars
export class RegistrarDatabase {
  private static collectionName = 'registrars';

  // Create a new registrar document
  static async createRegistrar(registrarData: CreateRegistrarData): Promise<RegistrarData> {
    try {
      const registrarRef = doc(collection(db, this.collectionName), registrarData.uid);
      
      const registrar: any = {
        ...registrarData,
        role: 'registrar',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      await setDoc(registrarRef, registrar);
      
      // Return the serialized registrar data
      const createdRegistrar = await this.getRegistrar(registrarData.uid);
      return createdRegistrar!;
    } catch (error) {
      console.error('Error creating registrar:', error);
      throw new Error('Failed to create registrar account');
    }
  }

  // Get registrar by UID
  static async getRegistrar(uid: string): Promise<RegistrarData | null> {
    try {
      const registrarRef = doc(db, this.collectionName, uid);
      const registrarSnap = await getDoc(registrarRef);

      if (registrarSnap.exists()) {
        const data = registrarSnap.data();
        // Serialize Firestore Timestamps to ISO strings for client components
        return serializeFirestoreData(data) as RegistrarData;
      }
      return null;
    } catch (error) {
      console.error('Error getting registrar:', error);
      throw new Error('Failed to get registrar data');
    }
  }

  // Get registrar by email
  static async getRegistrarByEmail(email: string): Promise<RegistrarData | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        // Serialize Firestore Timestamps to ISO strings for client components
        return serializeFirestoreData(data) as RegistrarData;
      }
      return null;
    } catch (error) {
      console.error('Error getting registrar by email:', error);
      throw new Error('Failed to get registrar by email');
    }
  }

  // Update registrar profile
  static async updateRegistrar(uid: string, updateData: Partial<RegistrarData>): Promise<RegistrarData | null> {
    try {
      const registrarRef = doc(db, this.collectionName, uid);
      
      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(registrarRef, updatePayload);
      
      // Return updated registrar data
      const updatedRegistrar = await this.getRegistrar(uid);
      return updatedRegistrar;
    } catch (error) {
      console.error('Error updating registrar:', error);
      throw new Error('Failed to update registrar profile');
    }
  }

  // Update last login time
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      const registrarRef = doc(db, this.collectionName, uid);
      await updateDoc(registrarRef, {
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Failed to update last login time');
    }
  }

  // Check if registrar exists
  static async registrarExists(uid: string): Promise<boolean> {
    try {
      const registrar = await this.getRegistrar(uid);
      return registrar !== null;
    } catch (error) {
      console.error('Error checking if registrar exists:', error);
      return false;
    }
  }

  // Check if user has registrar role
  static async hasRegistrarRole(uid: string): Promise<boolean> {
    try {
      const registrar = await this.getRegistrar(uid);
      return registrar !== null && registrar.role === 'registrar';
    } catch (error) {
      console.error('Error checking registrar role:', error);
      return false;
    }
  }

  // Get all registrars (for admin purposes)
  static async getAllRegistrars(): Promise<RegistrarData[]> {
    try {
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Serialize Firestore Timestamps to ISO strings for client components
        return serializeFirestoreData(data) as RegistrarData;
      });
    } catch (error) {
      console.error('Error getting all registrars:', error);
      throw new Error('Failed to get all registrars');
    }
  }
}
