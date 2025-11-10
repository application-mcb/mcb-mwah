import { db } from '@/lib/firebase-server'
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDoc,
} from 'firebase/firestore'

export interface SubjectAssignmentData {
  id: string
  level: 'high-school' | 'college'
  gradeLevel?: number
  courseCode?: string
  courseName?: string
  yearLevel?: number
  semester?: 'first-sem' | 'second-sem'
  strand?: string // For SHS
  subjectSetId: string
  registrarUid: string
  createdAt: string
  updatedAt: string
}

export interface CreateSubjectAssignmentData {
  level: 'high-school' | 'college'
  gradeLevel?: number
  courseCode?: string
  courseName?: string
  yearLevel?: number
  semester?: 'first-sem' | 'second-sem'
  strand?: string // For SHS
  subjectSetId: string
  registrarUid: string
}

export interface UpdateSubjectAssignmentData {
  level?: 'high-school' | 'college'
  gradeLevel?: number
  courseCode?: string
  courseName?: string
  yearLevel?: number
  semester?: 'first-sem' | 'second-sem'
  strand?: string // For SHS
  subjectSetId?: string
}

export class SubjectAssignmentDatabase {
  private collectionName = 'subjectAssignments'

  async getAllSubjectAssignments(): Promise<SubjectAssignmentData[]> {
    try {
      const subjectAssignmentsRef = collection(db, this.collectionName)
      const q = query(subjectAssignmentsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SubjectAssignmentData[]
    } catch (error) {
      console.error('Error fetching subject assignments:', error)
      throw new Error('Failed to fetch subject assignments')
    }
  }

  async getSubjectAssignmentById(
    id: string
  ): Promise<SubjectAssignmentData | null> {
    try {
      const subjectAssignmentRef = doc(db, this.collectionName, id)
      const docSnap = await getDoc(subjectAssignmentRef)

      if (!docSnap.exists()) {
        return null
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as SubjectAssignmentData
    } catch (error) {
      console.error('Error fetching subject assignment:', error)
      throw new Error('Failed to fetch subject assignment')
    }
  }

  async createSubjectAssignment(
    data: CreateSubjectAssignmentData
  ): Promise<SubjectAssignmentData> {
    try {
      // Filter out undefined values to avoid Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      )

      const subjectAssignmentData = {
        ...cleanData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const docRef = await addDoc(
        collection(db, this.collectionName),
        subjectAssignmentData
      )

      return {
        id: docRef.id,
        ...subjectAssignmentData,
      } as SubjectAssignmentData
    } catch (error) {
      console.error('Error creating subject assignment:', error)
      throw new Error('Failed to create subject assignment')
    }
  }

  async updateSubjectAssignment(
    id: string,
    data: UpdateSubjectAssignmentData
  ): Promise<SubjectAssignmentData> {
    try {
      // Filter out undefined values to avoid Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      )

      const updateData = {
        ...cleanData,
        updatedAt: new Date().toISOString(),
      }

      const subjectAssignmentRef = doc(db, this.collectionName, id)
      await updateDoc(subjectAssignmentRef, updateData)

      const updatedDoc = await getDoc(subjectAssignmentRef)
      if (!updatedDoc.exists()) {
        throw new Error('Subject assignment not found')
      }

      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as SubjectAssignmentData
    } catch (error) {
      console.error('Error updating subject assignment:', error)
      throw new Error('Failed to update subject assignment')
    }
  }

  async deleteSubjectAssignment(id: string): Promise<void> {
    try {
      const subjectAssignmentRef = doc(db, this.collectionName, id)
      await deleteDoc(subjectAssignmentRef)
    } catch (error) {
      console.error('Error deleting subject assignment:', error)
      throw new Error('Failed to delete subject assignment')
    }
  }

  async getSubjectAssignmentsByCourse(
    courseCode: string
  ): Promise<SubjectAssignmentData[]> {
    try {
      const subjectAssignmentsRef = collection(db, this.collectionName)
      const q = query(
        subjectAssignmentsRef,
        where('courseCode', '==', courseCode),
        orderBy('yearLevel', 'asc'),
        orderBy('semester', 'asc')
      )
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SubjectAssignmentData[]
    } catch (error) {
      console.error('Error fetching subject assignments by course:', error)
      throw new Error('Failed to fetch subject assignments by course')
    }
  }

  async getSubjectAssignmentsByCourseAndYear(
    courseCode: string,
    yearLevel: number
  ): Promise<SubjectAssignmentData[]> {
    try {
      const subjectAssignmentsRef = collection(db, this.collectionName)
      const q = query(
        subjectAssignmentsRef,
        where('courseCode', '==', courseCode),
        where('yearLevel', '==', yearLevel),
        orderBy('semester', 'asc')
      )
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SubjectAssignmentData[]
    } catch (error) {
      console.error(
        'Error fetching subject assignments by course and year:',
        error
      )
      throw new Error('Failed to fetch subject assignments by course and year')
    }
  }

  async getSubjectAssignmentsByCourseYearSemester(
    courseCode: string,
    yearLevel: number,
    semester: 'first-sem' | 'second-sem'
  ): Promise<SubjectAssignmentData | null> {
    try {
      const subjectAssignmentsRef = collection(db, this.collectionName)
      const q = query(
        subjectAssignmentsRef,
        where('courseCode', '==', courseCode),
        where('yearLevel', '==', yearLevel),
        where('semester', '==', semester)
      )
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return null
      }

      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as SubjectAssignmentData
    } catch (error) {
      console.error(
        'Error fetching subject assignment by course, year, and semester:',
        error
      )
      throw new Error(
        'Failed to fetch subject assignment by course, year, and semester'
      )
    }
  }

  // Get subject assignment for SHS by grade level, semester, and strand
  async getSubjectAssignmentByGradeSemesterStrand(
    gradeLevel: number,
    semester: 'first-sem' | 'second-sem',
    strand: string
  ): Promise<SubjectAssignmentData | null> {
    try {
      const subjectAssignmentsRef = collection(db, this.collectionName)
      const q = query(
        subjectAssignmentsRef,
        where('level', '==', 'high-school'),
        where('gradeLevel', '==', gradeLevel),
        where('semester', '==', semester),
        where('strand', '==', strand)
      )
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return null
      }

      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as SubjectAssignmentData
    } catch (error) {
      console.error(
        'Error fetching subject assignment by grade, semester, and strand:',
        error
      )
      throw new Error(
        'Failed to fetch subject assignment by grade, semester, and strand'
      )
    }
  }
}

export const subjectAssignmentDatabase = new SubjectAssignmentDatabase()
