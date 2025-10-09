// Server-side only - Firestore database operations for courses
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
import { CourseData, COURSE_COLORS } from './types/course';
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

// Input type for creating courses (allows FieldValue for timestamps)
export interface CreateCourseData extends Omit<CourseData, 'createdAt' | 'updatedAt'> {
  createdAt: any; // Can be FieldValue or Date
  updatedAt: any; // Can be FieldValue or Date
}

// Firestore database class for courses
export class CourseDatabase {
  private static collectionName = 'courses';

  // Generate course ID (use code as the document ID)
  private static generateCourseId(code: string): string {
    return code.toUpperCase();
  }

  // Create a new course document
  static async createCourse(courseData: CreateCourseData): Promise<CourseData> {
    try {
      // Validate color
      if (!COURSE_COLORS.includes(courseData.color)) {
        throw new Error(`Invalid course color. Must be one of: ${COURSE_COLORS.join(', ')}`);
      }

      const courseId = this.generateCourseId(courseData.code);

      // Check if course with same code already exists
      const existingCourse = await this.getCourse(courseId);
      if (existingCourse) {
        throw new Error(`Course with code "${courseData.code}" already exists`);
      }

      const courseRef = doc(collection(db, this.collectionName), courseId);

      const course: any = {
        ...courseData,
        code: courseData.code.toUpperCase(),
        name: courseData.name.trim(),
        description: courseData.description.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(courseRef, course);

      // Return the serialized course data
      const createdCourse = await this.getCourse(courseId);
      return createdCourse!;
    } catch (error) {
      logger.error('Error creating course:', error);
      throw new Error('Failed to create course');
    }
  }

  // Get course by code
  static async getCourse(code: string): Promise<CourseData | null> {
    try {
      const courseRef = doc(db, this.collectionName, code.toUpperCase());
      const courseSnap = await getDoc(courseRef);

      if (courseSnap.exists()) {
        const data = courseSnap.data();
        return serializeFirestoreData(data) as CourseData;
      }
      return null;
    } catch (error) {
      logger.error('Error getting course:', error);
      throw new Error('Failed to get course data');
    }
  }

  // Get all courses with limits
  static async getAllCourses(limitCount: number = 500): Promise<CourseData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount) // Add limit to prevent excessive data loading
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return serializeFirestoreData(data) as CourseData;
      });
    } catch (error) {
      logger.error('Error getting all courses:', error);
      throw new Error('Failed to get all courses');
    }
  }

  // Update course
  static async updateCourse(code: string, updateData: Partial<CreateCourseData>): Promise<CourseData | null> {
    try {
      // Validate color if provided
      if (updateData.color && !COURSE_COLORS.includes(updateData.color)) {
        throw new Error(`Invalid course color. Must be one of: ${COURSE_COLORS.join(', ')}`);
      }

      const courseRef = doc(db, this.collectionName, code.toUpperCase());

      const updatePayload = {
        ...updateData,
        ...(updateData.code && { code: updateData.code.toUpperCase() }),
        ...(updateData.name && { name: updateData.name.trim() }),
        ...(updateData.description && { description: updateData.description.trim() }),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(courseRef, updatePayload);

      // Return updated course data
      const updatedCourseCode = updateData.code ? updateData.code.toUpperCase() : code.toUpperCase();
      const updatedCourse = await this.getCourse(updatedCourseCode);
      return updatedCourse;
    } catch (error) {
      logger.error('Error updating course:', error);
      throw new Error('Failed to update course');
    }
  }

  // Delete course
  static async deleteCourse(code: string): Promise<boolean> {
    try {
      const courseRef = doc(db, this.collectionName, code.toUpperCase());
      await deleteDoc(courseRef);
      return true;
    } catch (error) {
      logger.error('Error deleting course:', error);
      throw new Error('Failed to delete course');
    }
  }

  // Check if course exists
  static async courseExists(code: string): Promise<boolean> {
    try {
      const course = await this.getCourse(code);
      return course !== null;
    } catch (error) {
      logger.error('Error checking if course exists:', error);
      return false;
    }
  }

  // Search courses by name, code, or description
  static async searchCourses(searchTerm: string): Promise<CourseData[]> {
    try {
      // For Firestore, we'll do a simple search by getting all courses and filtering
      // In production, you might want to use Algolia or implement full-text search
      const allCourses = await this.getAllCourses();
      const term = searchTerm.toLowerCase();

      return allCourses.filter(course =>
        course.name.toLowerCase().includes(term) ||
        course.code.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term)
      );
    } catch (error) {
      logger.error('Error searching courses:', error);
      throw new Error('Failed to search courses');
    }
  }
}