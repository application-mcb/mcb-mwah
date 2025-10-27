// Server-side only - Firestore database operations for grades and sections
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
import {
  GradeData,
  SectionData,
  CreateGradeData,
  CreateSectionData,
  GradeColor,
  GRADE_COLORS,
  Department,
  DEPARTMENTS,
  SectionRank,
  SECTION_RANKS
} from './types/grade-section';

// Re-export types for backward compatibility with existing imports
export type { GradeData, SectionData, CreateGradeData, CreateSectionData, GradeColor, Department, SectionRank };
export { GRADE_COLORS, DEPARTMENTS, SECTION_RANKS };

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

// Types are now imported from shared types file

// Firestore database class for grades
export class GradeDatabase {
  private static collectionName = 'grades';

  // Generate grade ID
  private static generateGradeId(gradeLevel: number, department: Department, strand?: string): string {
    if (department === 'SHS' && strand) {
      return `grade-${gradeLevel}-${department.toLowerCase()}-${strand.toLowerCase()}`;
    }
    return `grade-${gradeLevel}-${department.toLowerCase()}`;
  }

  // Create a new grade document
  static async createGrade(gradeData: CreateGradeData): Promise<GradeData> {
    try {
      // Validate department
      if (!DEPARTMENTS.includes(gradeData.department)) {
        throw new Error(`Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}`);
      }

      // Validate grade level
      if (gradeData.gradeLevel < 1 || gradeData.gradeLevel > 12) {
        throw new Error('Grade level must be between 1 and 12');
      }

      // Validate description length
      if (gradeData.description.length > 150) {
        throw new Error('Description must not exceed 150 characters');
      }

      const gradeId = this.generateGradeId(gradeData.gradeLevel, gradeData.department, gradeData.strand);

      // Check if grade with same parameters already exists
      const existingGrade = await this.getGrade(gradeId);
      if (existingGrade) {
        const gradeDisplayName = gradeData.strand && (gradeData.gradeLevel === 11 || gradeData.gradeLevel === 12)
          ? `G${gradeData.gradeLevel}${gradeData.strand}`
          : `Grade ${gradeData.gradeLevel}`;
        throw new Error(`${gradeDisplayName} for ${gradeData.department} already exists`);
      }

      const gradeRef = doc(collection(db, this.collectionName), gradeId);

      const grade: any = {
        id: gradeId,
        ...gradeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(gradeRef, grade);

      // Return the serialized grade data
      const createdGrade = await this.getGrade(gradeId);
      return createdGrade!;
    } catch (error) {
      console.error('Error creating grade:', error);
      throw new Error('Failed to create grade');
    }
  }

  // Get grade by ID
  static async getGrade(id: string): Promise<GradeData | null> {
    try {
      const gradeRef = doc(db, this.collectionName, id);
      const gradeSnap = await getDoc(gradeRef);

      if (gradeSnap.exists()) {
        const data = gradeSnap.data();
        return serializeFirestoreData(data) as GradeData;
      }
      return null;
    } catch (error) {
      console.error('Error getting grade:', error);
      throw new Error('Failed to get grade data');
    }
  }

  // Get all grades with limits
  static async getAllGrades(limitCount: number = 500): Promise<GradeData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount) // Add limit to prevent excessive data loading
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as GradeData;
      });
    } catch (error) {
      console.error('Error getting all grades:', error);
      throw new Error('Failed to get all grades');
    }
  }

  // Get grades by department
  static async getGradesByDepartment(department: Department): Promise<GradeData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('department', '==', department),
        orderBy('gradeLevel', 'asc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as GradeData;
      });
    } catch (error) {
      console.error('Error getting grades by department:', error);
      throw new Error('Failed to get grades by department');
    }
  }

  // Update grade
  static async updateGrade(id: string, updateData: Partial<CreateGradeData>): Promise<GradeData | null> {
    try {
      // Validate department if provided
      if (updateData.department && !DEPARTMENTS.includes(updateData.department)) {
        throw new Error(`Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}`);
      }

      // Validate grade level if provided
      if (updateData.gradeLevel !== undefined && (updateData.gradeLevel < 1 || updateData.gradeLevel > 12)) {
        throw new Error('Grade level must be between 1 and 12');
      }

      // Validate description length if provided
      if (updateData.description && updateData.description.length > 150) {
        throw new Error('Description must not exceed 150 characters');
      }

      const gradeRef = doc(db, this.collectionName, id);

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(gradeRef, updatePayload);

      // Return updated grade data
      const updatedGrade = await this.getGrade(id);
      return updatedGrade;
    } catch (error) {
      console.error('Error updating grade:', error);
      throw new Error('Failed to update grade');
    }
  }

  // Delete grade
  static async deleteGrade(id: string): Promise<boolean> {
    try {
      // First check if there are any sections for this grade
      const sections = await SectionDatabase.getSectionsByGrade(id);
      if (sections.length > 0) {
        throw new Error('Cannot delete grade that has sections. Delete all sections first.');
      }

      const gradeRef = doc(db, this.collectionName, id);
      await deleteDoc(gradeRef);
      return true;
    } catch (error) {
      console.error('Error deleting grade:', error);
      throw new Error('Failed to delete grade');
    }
  }

  // Check if grade exists
  static async gradeExists(id: string): Promise<boolean> {
    try {
      const grade = await this.getGrade(id);
      return grade !== null;
    } catch (error) {
      console.error('Error checking if grade exists:', error);
      return false;
    }
  }
}

// Firestore database class for sections
export class SectionDatabase {
  private static collectionName = 'sections';

  // Generate section ID
  private static generateSectionId(grade: string, department: Department, sectionName: string): string {
    const cleanSectionName = sectionName.toLowerCase().replace(/\s+/g, '-');
    return `section-${grade.toLowerCase().replace(/\s+/g, '')}-${department.toLowerCase()}-${cleanSectionName}`;
  }

  // Create a new section document
  static async createSection(sectionData: CreateSectionData): Promise<SectionData> {
    try {
      // Validate department
      if (!DEPARTMENTS.includes(sectionData.department)) {
        throw new Error(`Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}`);
      }

      // Validate rank
      if (!SECTION_RANKS.includes(sectionData.rank)) {
        throw new Error(`Invalid section rank. Must be one of: ${SECTION_RANKS.join(', ')}`);
      }

      // Check if either gradeId or courseId is provided
      if (!sectionData.gradeId && !sectionData.courseId) {
        throw new Error('Either gradeId or courseId must be provided');
      }

      // Check if grade exists (if gradeId is provided)
      if (sectionData.gradeId) {
        const gradeExists = await GradeDatabase.gradeExists(sectionData.gradeId);
        if (!gradeExists) {
          throw new Error('Referenced grade does not exist');
        }
      }

      // Note: Course validation is done in the API route

      const sectionId = this.generateSectionId(sectionData.grade, sectionData.department, sectionData.sectionName);

      // Check if section with same parameters already exists
      const existingSection = await this.getSection(sectionId);
      if (existingSection) {
        throw new Error(`Section "${sectionData.sectionName}" already exists for ${sectionData.grade} in ${sectionData.department}`);
      }

      const sectionRef = doc(collection(db, this.collectionName), sectionId);

      const section: any = {
        id: sectionId,
        ...sectionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(sectionRef, section);

      // Return the serialized section data
      const createdSection = await this.getSection(sectionId);
      return createdSection!;
    } catch (error) {
      console.error('Error creating section:', error);
      throw new Error('Failed to create section');
    }
  }

  // Get section by ID
  static async getSection(id: string): Promise<SectionData | null> {
    try {
      const sectionRef = doc(db, this.collectionName, id);
      const sectionSnap = await getDoc(sectionRef);

      if (sectionSnap.exists()) {
        const data = sectionSnap.data();
        return serializeFirestoreData(data) as SectionData;
      }
      return null;
    } catch (error) {
      console.error('Error getting section:', error);
      throw new Error('Failed to get section data');
    }
  }

  // Get all sections with limits
  static async getAllSections(limitCount: number = 1000): Promise<SectionData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount) // Add limit to prevent excessive data loading
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as SectionData;
      });
    } catch (error) {
      console.error('Error getting all sections:', error);
      throw new Error('Failed to get all sections');
    }
  }

  // Get sections by grade ID
  static async getSectionsByGrade(gradeId: string): Promise<SectionData[]> {
    try {
      // Simplified query without ordering to avoid index requirement
      const q = query(
        collection(db, this.collectionName),
        where('gradeId', '==', gradeId)
      );
      const querySnapshot = await getDocs(q);

      // Sort sections by rank on the client side
      const sections = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as SectionData;
      });

      // Sort by rank (A, B, C, D, E, F, G, H)
      return sections.sort((a, b) => a.rank.localeCompare(b.rank));
    } catch (error) {
      console.error('Error getting sections by grade:', error);
      throw new Error('Failed to get sections by grade');
    }
  }

  // Get sections by department
  static async getSectionsByDepartment(department: Department): Promise<SectionData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('department', '==', department),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as SectionData;
      });
    } catch (error) {
      console.error('Error getting sections by department:', error);
      throw new Error('Failed to get sections by department');
    }
  }

  // Update section
  static async updateSection(id: string, updateData: Partial<CreateSectionData>): Promise<SectionData | null> {
    try {
      // Validate department if provided
      if (updateData.department && !DEPARTMENTS.includes(updateData.department)) {
        throw new Error(`Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}`);
      }

      // Validate rank if provided
      if (updateData.rank && !SECTION_RANKS.includes(updateData.rank)) {
        throw new Error(`Invalid section rank. Must be one of: ${SECTION_RANKS.join(', ')}`);
      }

      // Check grade exists if gradeId is being updated
      if (updateData.gradeId) {
        const gradeExists = await GradeDatabase.gradeExists(updateData.gradeId);
        if (!gradeExists) {
          throw new Error('Referenced grade does not exist');
        }
      }

      const sectionRef = doc(db, this.collectionName, id);

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(sectionRef, updatePayload);

      // Return updated section data
      const updatedSection = await this.getSection(id);
      return updatedSection;
    } catch (error) {
      console.error('Error updating section:', error);
      throw new Error('Failed to update section');
    }
  }

  // Delete section
  static async deleteSection(id: string): Promise<boolean> {
    try {
      const sectionRef = doc(db, this.collectionName, id);
      await deleteDoc(sectionRef);
      return true;
    } catch (error) {
      console.error('Error deleting section:', error);
      throw new Error('Failed to delete section');
    }
  }

  // Check if section exists
  static async sectionExists(id: string): Promise<boolean> {
    try {
      const section = await this.getSection(id);
      return section !== null;
    } catch (error) {
      console.error('Error checking if section exists:', error);
      return false;
    }
  }
}
