// Server-side only - Firestore database operations for subjects
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

// Available subject colors (16 colors from Tailwind 700-800)
export const SUBJECT_COLORS = [
  'blue-700',
  'blue-800',
  'red-700',
  'red-800',
  'emerald-700',
  'emerald-800',
  'yellow-700',
  'yellow-800',
  'orange-700',
  'orange-800',
  'violet-700',
  'violet-800',
  'purple-700',
  'purple-800',
  'indigo-700',
  'indigo-800'
] as const;

export type SubjectColor = typeof SUBJECT_COLORS[number];

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

// Subject data structure for Firestore
export interface SubjectData {
  id: string; // Auto-generated ID (e.g., "subject-math-grade-7")
  code: string; // Subject code (e.g., "MATH101", "ENG202")
  name: string; // Subject name (e.g., "Mathematics", "English")
  description: string; // Detailed description of the subject
  gradeLevel: number; // Grade level this subject belongs to (7, 8, 9, 10, 11, 12)
  color: SubjectColor; // Color theme for the subject
  lectureUnits: number; // Number of lecture units for this subject
  labUnits: number; // Number of lab units for this subject
  totalUnits: number; // Total units (lecture + lab)
  teacherAssignments?: Record<string, string[]>; // { [sectionId]: teacherId[] } - Multiple teachers per section
  createdAt: string; // ISO string (serialized from Firestore timestamp)
  updatedAt: string; // ISO string (serialized from Firestore timestamp)
  createdBy: string; // UID of the registrar who created it
}

// Input type for creating subjects (allows FieldValue for timestamps)
export interface CreateSubjectData extends Omit<SubjectData, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: any; // Can be FieldValue or Date
  updatedAt: any; // Can be FieldValue or Date
}

// Firestore database class for subjects
export class SubjectDatabase {
  private static collectionName = 'subjects';

  // Generate subject ID
  private static generateSubjectId(code: string, gradeLevel: number): string {
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `subject-${cleanCode}-grade-${gradeLevel}`;
  }

  // Create a new subject document
  static async createSubject(subjectData: CreateSubjectData): Promise<SubjectData> {
    try {
      // Validate color
      if (!SUBJECT_COLORS.includes(subjectData.color)) {
        throw new Error(`Invalid subject color. Must be one of: ${SUBJECT_COLORS.join(', ')}`);
      }

      // Validate grade level
      if (subjectData.gradeLevel < 1 || subjectData.gradeLevel > 12) {
        throw new Error('Grade level must be between 1 and 12');
      }

      // Validate units
      if (subjectData.lectureUnits < 0 || subjectData.lectureUnits > 10) {
        throw new Error('Lecture units must be between 0 and 10');
      }
      if (subjectData.labUnits < 0 || subjectData.labUnits > 10) {
        throw new Error('Lab units must be between 0 and 10');
      }

      // Validate subject code format
      if (!/^[A-Z0-9]{2,10}$/.test(subjectData.code.toUpperCase())) {
        throw new Error('Subject code must be 2-10 uppercase letters and numbers only');
      }

      // Validate description length
      if (subjectData.description.length > 300) {
        throw new Error('Description must not exceed 300 characters');
      }

      const subjectId = this.generateSubjectId(subjectData.code, subjectData.gradeLevel);
      const subjectRef = doc(collection(db, this.collectionName), subjectId);

      const subject: any = {
        id: subjectId,
        ...subjectData,
        totalUnits: subjectData.lectureUnits + subjectData.labUnits,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(subjectRef, subject);

      // Return the serialized subject data
      const createdSubject = await this.getSubject(subjectId);
      return createdSubject!;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw new Error('Failed to create subject');
    }
  }

  // Get subject by ID
  static async getSubject(id: string): Promise<SubjectData | null> {
    try {
      const subjectRef = doc(db, this.collectionName, id);
      const subjectSnap = await getDoc(subjectRef);

      if (subjectSnap.exists()) {
        const data = subjectSnap.data();
        return serializeFirestoreData(data) as SubjectData;
      }
      return null;
    } catch (error) {
      console.error('Error getting subject:', error);
      throw new Error('Failed to get subject data');
    }
  }

  // Get all subjects
  static async getAllSubjects(): Promise<SubjectData[]> {
    try {
      console.log('Attempting to fetch all subjects from Firestore...');
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      console.log('Query created, executing getDocs...');
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} subjects in Firestore`);

      const subjects = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing subject:', doc.id, data.name);
        return serializeFirestoreData(data) as SubjectData;
      });

      console.log(`Successfully processed ${subjects.length} subjects`);
      return subjects;
    } catch (error) {
      console.error('Error getting all subjects:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to get all subjects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get subjects by grade level
  static async getSubjectsByGradeLevel(gradeLevel: number): Promise<SubjectData[]> {
    try {
      // First try with composite index (where + orderBy)
      try {
        const q = query(
          collection(db, this.collectionName),
          where('gradeLevel', '==', gradeLevel),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const subjects = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return serializeFirestoreData(data) as SubjectData;
        });

        // Sort by name after fetching (client-side sort)
        return subjects.sort((a, b) => a.name.localeCompare(b.name));
      } catch (indexError) {
        console.warn('Composite index not available, falling back to client-side filtering');

        // Fallback: Get all subjects and filter client-side
        const allSubjects = await this.getAllSubjects();
        return allSubjects
          .filter(subject => subject.gradeLevel === gradeLevel)
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    } catch (error) {
      console.error('Error getting subjects by grade level:', error);
      throw new Error('Failed to get subjects by grade level');
    }
  }

  // Get subjects by color
  static async getSubjectsByColor(color: SubjectColor): Promise<SubjectData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('color', '==', color),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as SubjectData;
      });
    } catch (error) {
      console.error('Error getting subjects by color:', error);
      throw new Error('Failed to get subjects by color');
    }
  }

  // Update subject
  static async updateSubject(id: string, updateData: Partial<CreateSubjectData>): Promise<SubjectData | null> {
    try {
      // Validate color if provided
      if (updateData.color && !SUBJECT_COLORS.includes(updateData.color)) {
        throw new Error(`Invalid subject color. Must be one of: ${SUBJECT_COLORS.join(', ')}`);
      }

      // Validate grade level if provided
      if (updateData.gradeLevel !== undefined && (updateData.gradeLevel < 1 || updateData.gradeLevel > 12)) {
        throw new Error('Grade level must be between 1 and 12');
      }

      // Validate units if provided
      if (updateData.lectureUnits !== undefined && (updateData.lectureUnits < 0 || updateData.lectureUnits > 10)) {
        throw new Error('Lecture units must be between 0 and 10');
      }
      if (updateData.labUnits !== undefined && (updateData.labUnits < 0 || updateData.labUnits > 10)) {
        throw new Error('Lab units must be between 0 and 10');
      }

      // Validate description length if provided
      if (updateData.description && updateData.description.length > 300) {
        throw new Error('Description must not exceed 300 characters');
      }

      const subjectRef = doc(db, this.collectionName, id);

      // Calculate total units if lecture or lab units are being updated
      const updatePayload: any = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      // If updating units, recalculate total
      if (updateData.lectureUnits !== undefined || updateData.labUnits !== undefined) {
        const currentSubject = await this.getSubject(id);
        if (currentSubject) {
          const newLectureUnits = updateData.lectureUnits !== undefined ? updateData.lectureUnits : currentSubject.lectureUnits;
          const newLabUnits = updateData.labUnits !== undefined ? updateData.labUnits : currentSubject.labUnits;
          updatePayload.totalUnits = newLectureUnits + newLabUnits;
        }
      }

      await updateDoc(subjectRef, updatePayload);

      // Return updated subject data
      const updatedSubject = await this.getSubject(id);
      return updatedSubject;
    } catch (error) {
      console.error('Error updating subject:', error);
      throw new Error('Failed to update subject');
    }
  }

  // Delete subject
  static async deleteSubject(id: string): Promise<boolean> {
    try {
      // Check if subject is used in any subject sets
      const subjectSets = await SubjectSetDatabase.getSubjectSetsContainingSubject(id);
      if (subjectSets.length > 0) {
        throw new Error('Cannot delete subject that is used in subject sets. Remove from subject sets first.');
      }

      const subjectRef = doc(db, this.collectionName, id);
      await deleteDoc(subjectRef);
      return true;
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw new Error('Failed to delete subject');
    }
  }

  // Check if subject exists
  static async subjectExists(id: string): Promise<boolean> {
    try {
      const subject = await this.getSubject(id);
      return subject !== null;
    } catch (error) {
      console.error('Error checking if subject exists:', error);
      return false;
    }
  }

  // Search subjects by name
  static async searchSubjects(searchTerm: string): Promise<SubjectData[]> {
    try {
      // Get all subjects and filter client-side since Firestore doesn't support partial text search
      const allSubjects = await this.getAllSubjects();
      const searchLower = searchTerm.toLowerCase();

      return allSubjects.filter(subject =>
        subject.name.toLowerCase().includes(searchLower) ||
        subject.description.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching subjects:', error);
      throw new Error('Failed to search subjects');
    }
  }
}

// Subject Set data structure for Firestore
export interface SubjectSetData {
  id: string; // Auto-generated ID (e.g., "subject-set-g10-core")
  name: string; // Subject set name (e.g., "G10 Core Subjects")
  description: string; // Description of the subject set
  subjects: string[]; // Array of subject IDs
  gradeLevel: number; // Grade level for this subject set
  color: SubjectColor; // Color theme for the subject set
  createdAt: string; // ISO string (serialized from Firestore timestamp)
  updatedAt: string; // ISO string (serialized from Firestore timestamp)
  createdBy: string; // UID of the registrar who created it
}

// Input type for creating subject sets
export interface CreateSubjectSetData extends Omit<SubjectSetData, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: any;
  updatedAt: any;
}

// Firestore database class for subject sets
export class SubjectSetDatabase {
  private static collectionName = 'subjectSets';

  // Generate subject set ID
  private static generateSubjectSetId(name: string, gradeLevel: number): string {
    const cleanName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `subject-set-${cleanName}-grade-${gradeLevel}`;
  }

  // Create a new subject set document
  static async createSubjectSet(subjectSetData: CreateSubjectSetData): Promise<SubjectSetData> {
    try {
      // Validate color
      if (!SUBJECT_COLORS.includes(subjectSetData.color)) {
        throw new Error(`Invalid subject set color. Must be one of: ${SUBJECT_COLORS.join(', ')}`);
      }

      // Validate grade level
      if (subjectSetData.gradeLevel < 1 || subjectSetData.gradeLevel > 12) {
        throw new Error('Grade level must be between 1 and 12');
      }

      // Validate subjects exist
      for (const subjectId of subjectSetData.subjects) {
        const subjectExists = await SubjectDatabase.subjectExists(subjectId);
        if (!subjectExists) {
          throw new Error(`Subject with ID ${subjectId} does not exist`);
        }
      }

      // Validate description length
      if (subjectSetData.description.length > 300) {
        throw new Error('Description must not exceed 300 characters');
      }

      const subjectSetId = this.generateSubjectSetId(subjectSetData.name, subjectSetData.gradeLevel);
      const subjectSetRef = doc(collection(db, this.collectionName), subjectSetId);

      const subjectSet: any = {
        id: subjectSetId,
        ...subjectSetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(subjectSetRef, subjectSet);

      // Return the serialized subject set data
      const createdSubjectSet = await this.getSubjectSet(subjectSetId);
      return createdSubjectSet!;
    } catch (error) {
      console.error('Error creating subject set:', error);
      throw new Error('Failed to create subject set');
    }
  }

  // Get subject set by ID
  static async getSubjectSet(id: string): Promise<SubjectSetData | null> {
    try {
      const subjectSetRef = doc(db, this.collectionName, id);
      const subjectSetSnap = await getDoc(subjectSetRef);

      if (subjectSetSnap.exists()) {
        const data = subjectSetSnap.data();
        return serializeFirestoreData(data) as SubjectSetData;
      }
      return null;
    } catch (error) {
      console.error('Error getting subject set:', error);
      throw new Error('Failed to get subject set data');
    }
  }

  // Get all subject sets
  static async getAllSubjectSets(): Promise<SubjectSetData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as SubjectSetData;
      });
    } catch (error) {
      console.error('Error getting all subject sets:', error);
      throw new Error('Failed to get all subject sets');
    }
  }

  // Get subject sets by grade level
  static async getSubjectSetsByGradeLevel(gradeLevel: number): Promise<SubjectSetData[]> {
    try {
      // First try with composite index (where + orderBy)
      try {
        const q = query(
          collection(db, this.collectionName),
          where('gradeLevel', '==', gradeLevel),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const subjectSets = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return serializeFirestoreData(data) as SubjectSetData;
        });

        // Sort by name after fetching (client-side sort)
        return subjectSets.sort((a, b) => a.name.localeCompare(b.name));
      } catch (indexError) {
        console.warn('Composite index not available for subject sets, falling back to client-side filtering');

        // Fallback: Get all subject sets and filter client-side
        const allSubjectSets = await this.getAllSubjectSets();
        return allSubjectSets
          .filter(subjectSet => subjectSet.gradeLevel === gradeLevel)
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    } catch (error) {
      console.error('Error getting subject sets by grade level:', error);
      throw new Error('Failed to get subject sets by grade level');
    }
  }

  // Get subject sets that contain a specific subject
  static async getSubjectSetsContainingSubject(subjectId: string): Promise<SubjectSetData[]> {
    try {
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);

      const subjectSets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as SubjectSetData;
      });

      // Filter subject sets that contain the subject
      return subjectSets.filter(subjectSet =>
        subjectSet.subjects.includes(subjectId)
      );
    } catch (error) {
      console.error('Error getting subject sets containing subject:', error);
      throw new Error('Failed to get subject sets containing subject');
    }
  }

  // Update subject set
  static async updateSubjectSet(id: string, updateData: Partial<CreateSubjectSetData>): Promise<SubjectSetData | null> {
    try {
      // Validate color if provided
      if (updateData.color && !SUBJECT_COLORS.includes(updateData.color)) {
        throw new Error(`Invalid subject set color. Must be one of: ${SUBJECT_COLORS.join(', ')}`);
      }

      // Validate grade level if provided
      if (updateData.gradeLevel !== undefined && (updateData.gradeLevel < 1 || updateData.gradeLevel > 12)) {
        throw new Error('Grade level must be between 1 and 12');
      }

      // Validate subjects exist if provided
      if (updateData.subjects) {
        for (const subjectId of updateData.subjects) {
          const subjectExists = await SubjectDatabase.subjectExists(subjectId);
          if (!subjectExists) {
            throw new Error(`Subject with ID ${subjectId} does not exist`);
          }
        }
      }

      // Validate description length if provided
      if (updateData.description && updateData.description.length > 300) {
        throw new Error('Description must not exceed 300 characters');
      }

      const subjectSetRef = doc(db, this.collectionName, id);

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(subjectSetRef, updatePayload);

      // Return updated subject set data
      const updatedSubjectSet = await this.getSubjectSet(id);
      return updatedSubjectSet;
    } catch (error) {
      console.error('Error updating subject set:', error);
      throw new Error('Failed to update subject set');
    }
  }

  // Delete subject set
  static async deleteSubjectSet(id: string): Promise<boolean> {
    try {
      const subjectSetRef = doc(db, this.collectionName, id);
      await deleteDoc(subjectSetRef);
      return true;
    } catch (error) {
      console.error('Error deleting subject set:', error);
      throw new Error('Failed to delete subject set');
    }
  }

  // Check if subject set exists
  static async subjectSetExists(id: string): Promise<boolean> {
    try {
      const subjectSet = await this.getSubjectSet(id);
      return subjectSet !== null;
    } catch (error) {
      console.error('Error checking if subject set exists:', error);
      return false;
    }
  }
}
