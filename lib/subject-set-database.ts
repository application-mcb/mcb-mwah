// Server-side only - Firestore database operations for subject sets
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
  where,
  limit
} from 'firebase/firestore';
import { db } from './firebase-server';
import { SubjectSetData, CreateSubjectSetData, SUBJECT_COLORS } from './types/subject';
import { logger } from './logger';

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

      // Validate subjects exist - We'll need to import SubjectDatabase here
      const { SubjectDatabase } = await import('./subject-database');
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

      // Check if subject set with same name and grade level already exists
      const existingSubjectSet = await this.getSubjectSet(subjectSetId);
      if (existingSubjectSet) {
        throw new Error(`A subject set with name "${subjectSetData.name}" already exists for grade ${subjectSetData.gradeLevel}`);
      }

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
      logger.error('Failed to create subject set', error, { operation: 'create', resource: 'subjectSet' });
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
      logger.error('Failed to get subject set', error, { operation: 'read', resource: 'subjectSet', subjectSetId: id });
      throw new Error('Failed to get subject set data');
    }
  }

  // Get all subject sets with limits
  static async getAllSubjectSets(limitCount: number = 1000): Promise<SubjectSetData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount) // Add limit to prevent excessive data loading
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as SubjectSetData;
      });
    } catch (error) {
      logger.error('Failed to get all subject sets', error, { operation: 'read', resource: 'subjectSets' });
      throw new Error('Failed to get all subject sets');
    }
  }

  // Get subject sets by grade level with limit
  static async getSubjectSetsByGradeLevel(gradeLevel: number, limitCount: number = 500): Promise<SubjectSetData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('gradeLevel', '==', gradeLevel),
        orderBy('name', 'asc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as SubjectSetData;
      });
    } catch (error) {
      logger.error('Failed to get subject sets by grade level', error, { operation: 'read', resource: 'subjectSets', gradeLevel: gradeLevel.toString() });
      throw new Error('Failed to get subject sets by grade level');
    }
  }

  // Get subject sets that contain a specific subject with limits
  static async getSubjectSetsContainingSubject(subjectId: string, limitCount: number = 100): Promise<SubjectSetData[]> {
    try {
      // Add limit to prevent loading too much data
      const q = query(collection(db, this.collectionName), limit(limitCount));
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
      logger.error('Failed to get subject sets containing subject', error, { operation: 'read', resource: 'subjectSets', subjectId });
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
        const { SubjectDatabase } = await import('./subject-database');
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

      const updatePayload: any = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(subjectSetRef, updatePayload);

      // Return updated subject set data
      const updatedSubjectSet = await this.getSubjectSet(id);
      return updatedSubjectSet;
    } catch (error) {
      logger.error('Failed to update subject set', error, { operation: 'update', resource: 'subjectSet', subjectSetId: id });
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
      logger.error('Failed to delete subject set', error, { operation: 'delete', resource: 'subjectSet', subjectSetId: id });
      throw new Error('Failed to delete subject set');
    }
  }

  // Check if subject set exists
  static async subjectSetExists(id: string): Promise<boolean> {
    try {
      const subjectSet = await this.getSubjectSet(id);
      return subjectSet !== null;
    } catch (error) {
      logger.error('Failed to check if subject set exists', error, { operation: 'check', resource: 'subjectSet', subjectSetId: id });
      return false;
    }
  }
}
