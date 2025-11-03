// Server-side only - Firestore database operations for teachers
// This file should only be imported in API routes or server-side code

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  where
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

// Teacher data structure for Firestore
export interface TeacherData {
  id: string; // Auto-generated ID
  firstName: string;
  middleName?: string;
  lastName: string;
  extension?: string;
  email: string;
  phone: string;
  uid?: string; // Firebase user ID
  status?: 'active' | 'inactive';
  createdAt: string; // ISO string (serialized from Firestore timestamp)
  updatedAt: string; // ISO string (serialized from Firestore timestamp)
  createdBy: string; // UID of the registrar who created it
}

// Input type for creating teachers (allows FieldValue for timestamps)
export interface CreateTeacherData extends Omit<TeacherData, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: any; // Can be FieldValue or Date
  updatedAt: any; // Can be FieldValue or Date
}

// Firestore database class for teachers
export class TeacherDatabase {
  private static collectionName = 'teachers';

  // Generate teacher ID
  private static generateTeacherId(firstName: string, lastName: string): string {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    return `teacher-${cleanFirst}-${cleanLast}`;
  }

  // Create a new teacher document
  static async createTeacher(teacherData: CreateTeacherData): Promise<TeacherData> {
    try {
      const teacherId = this.generateTeacherId(teacherData.firstName, teacherData.lastName);
      const teacherRef = doc(collection(db, this.collectionName), teacherId);

      const teacher: any = {
        id: teacherId,
        ...teacherData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(teacherRef, teacher);

      // Return the serialized teacher data
      const createdTeacher = await this.getTeacher(teacherId);
      return createdTeacher!;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw new Error('Failed to create teacher');
    }
  }

  // Get teacher by ID
  static async getTeacher(id: string): Promise<TeacherData | null> {
    try {
      const teacherRef = doc(db, this.collectionName, id);
      const teacherSnap = await getDoc(teacherRef);

      if (teacherSnap.exists()) {
        const data = teacherSnap.data();
        return serializeFirestoreData(data) as TeacherData;
      }
      return null;
    } catch (error) {
      console.error('Error getting teacher:', error);
      throw new Error('Failed to get teacher data');
    }
  }

  // Get all teachers
  static async getAllTeachers(): Promise<TeacherData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as TeacherData;
      });
    } catch (error) {
      console.error('Error getting all teachers:', error);
      throw new Error('Failed to get all teachers');
    }
  }

  // Get teachers by status
  static async getTeachersByStatus(status: 'active' | 'inactive'): Promise<TeacherData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as TeacherData;
      });
    } catch (error) {
      console.error('Error getting teachers by status:', error);
      throw new Error('Failed to get teachers by status');
    }
  }

  // Update teacher
  static async updateTeacher(id: string, updateData: Partial<CreateTeacherData>): Promise<TeacherData | null> {
    try {
      const teacherRef = doc(db, this.collectionName, id);

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(teacherRef, updatePayload);

      // Return updated teacher data
      const updatedTeacher = await this.getTeacher(id);
      return updatedTeacher;
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw new Error('Failed to update teacher');
    }
  }

  // Delete teacher
  static async deleteTeacher(id: string): Promise<boolean> {
    try {
      const teacherRef = doc(db, this.collectionName, id);
      await deleteDoc(teacherRef);
      return true;
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw new Error('Failed to delete teacher');
    }
  }

  // Get teacher by UID
  static async getTeacherByUid(uid: string): Promise<TeacherData | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('uid', '==', uid)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return serializeFirestoreData(data) as TeacherData;
      }
      return null;
    } catch (error) {
      console.error('Error getting teacher by UID:', error);
      throw new Error('Failed to get teacher by UID');
    }
  }

  // Get teacher by email
  static async getTeacherByEmail(email: string): Promise<TeacherData | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return serializeFirestoreData(data) as TeacherData;
      }
      return null;
    } catch (error) {
      console.error('Error getting teacher by email:', error);
      throw new Error('Failed to get teacher by email');
    }
  }

  // Check if teacher exists
  static async teacherExists(id: string): Promise<boolean> {
    try {
      const teacher = await this.getTeacher(id);
      return teacher !== null;
    } catch (error) {
      console.error('Error checking if teacher exists:', error);
      return false;
    }
  }
}

