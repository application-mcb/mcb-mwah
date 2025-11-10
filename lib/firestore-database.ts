// Server-side only - Firestore database operations
// This file should only be imported in API routes or server-side code

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase-server'

// Utility function to serialize Firestore data for client components
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString()
  }

  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData)
  }

  if (typeof data === 'object') {
    const serialized: any = {}
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value)
    }
    return serialized
  }

  return data
}

// Student data structure for Firestore
export interface StudentData {
  uid: string
  email: string
  firstName: string
  middleName?: string
  lastName: string
  nameExtension?: string
  phoneNumber: string
  birthMonth: string
  birthDay: string
  birthYear: string
  gender: string
  civilStatus: string
  religion?: string
  placeOfBirth?: string
  citizenship?: string
  streetName: string
  province: string
  municipality: string
  barangay: string
  zipCode: string
  guardianName: string
  guardianPhone: string
  guardianEmail?: string
  guardianRelationship: string
  emergencyContact?: string
  previousSchoolName: string
  previousSchoolType: string
  previousSchoolProvince: string
  previousSchoolMunicipality: string
  photoURL?: string
  provider: 'email' | 'google' | 'magic-link'
  studentId?: string // Generated student ID
  academicDataUsageAgreement: boolean
  createdAt: string // ISO string (serialized from Firestore timestamp)
  updatedAt: string // ISO string (serialized from Firestore timestamp)
  lastLoginAt: string // ISO string (serialized from Firestore timestamp)
}

// Input type for creating students (allows FieldValue for timestamps)
export interface CreateStudentData
  extends Omit<StudentData, 'createdAt' | 'updatedAt' | 'lastLoginAt'> {
  createdAt: any // Can be FieldValue or Date
  updatedAt: any // Can be FieldValue or Date
  lastLoginAt: any // Can be FieldValue or Date
}

// Firestore database class for students
export class StudentDatabase {
  private static collectionName = 'students'

  // Create a new student document
  static async createStudent(
    studentData: CreateStudentData
  ): Promise<StudentData> {
    try {
      const studentRef = doc(
        collection(db, this.collectionName),
        studentData.uid
      )

      const student: any = {
        ...studentData,
        academicDataUsageAgreement: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      }

      await setDoc(studentRef, student)

      // Return the serialized student data
      const createdStudent = await this.getStudent(studentData.uid)
      return createdStudent!
    } catch (error) {
      console.error('Error creating student:', error)
      throw new Error('Failed to create student account')
    }
  }

  // Get student by UID
  static async getStudent(uid: string): Promise<StudentData | null> {
    try {
      const studentRef = doc(db, this.collectionName, uid)
      const studentSnap = await getDoc(studentRef)

      if (studentSnap.exists()) {
        const data = studentSnap.data()
        // Serialize Firestore Timestamps to ISO strings for client components
        return serializeFirestoreData(data) as StudentData
      }
      return null
    } catch (error) {
      console.error('Error getting student:', error)
      throw new Error('Failed to get student data')
    }
  }

  // Update student profile
  static async updateStudent(
    uid: string,
    updateData: Partial<StudentData>
  ): Promise<StudentData | null> {
    try {
      const studentRef = doc(db, this.collectionName, uid)

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(studentRef, updatePayload)

      // Return updated student data
      const updatedStudent = await this.getStudent(uid)
      return updatedStudent
    } catch (error) {
      console.error('Error updating student:', error)
      throw new Error('Failed to update student profile')
    }
  }

  // Get student by email
  static async getStudentByEmail(email: string): Promise<StudentData | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email)
      )

      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data()
        // Serialize Firestore Timestamps to ISO strings for client components
        return serializeFirestoreData(data) as StudentData
      }
      return null
    } catch (error) {
      console.error('Error getting student by email:', error)
      throw new Error('Failed to get student by email')
    }
  }

  // Update last login time
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      const studentRef = doc(db, this.collectionName, uid)
      await updateDoc(studentRef, {
        lastLoginAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error updating last login:', error)
      throw new Error('Failed to update last login time')
    }
  }

  // Check if student exists
  static async studentExists(uid: string): Promise<boolean> {
    try {
      const student = await this.getStudent(uid)
      return student !== null
    } catch (error) {
      console.error('Error checking if student exists:', error)
      return false
    }
  }

  // Get all students (for admin purposes)
  static async getAllStudents(): Promise<StudentData[]> {
    try {
      const q = query(collection(db, this.collectionName))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        // Serialize Firestore Timestamps to ISO strings for client components
        return serializeFirestoreData(data) as StudentData
      })
    } catch (error) {
      console.error('Error getting all students:', error)
      throw new Error('Failed to get all students')
    }
  }
}

// Teacher data structure for Firestore
export interface TeacherData {
  id: string
  uid: string
  email: string
  firstName: string
  middleName?: string
  lastName: string
  extension?: string
  phone: string
  createdBy: string
  assignments: TeacherAssignment[]
  createdAt: string
  updatedAt: string
}

export interface TeacherAssignment {
  id: string
  subjectId: string
  subjectName: string
  sectionId: string
  sectionName: string
  gradeLevel: number
}

// Input type for creating teachers (allows FieldValue for timestamps)
export interface CreateTeacherData
  extends Omit<TeacherData, 'createdAt' | 'updatedAt'> {}

// Firestore database class for teachers
export class TeacherDatabase {
  private static collectionName = 'teachers'

  // Create a new teacher document
  static async createTeacher(
    teacherData: CreateTeacherData
  ): Promise<TeacherData> {
    try {
      const teacherRef = doc(
        collection(db, this.collectionName),
        teacherData.uid
      )

      // Generate teacher ID (format: TEA-YYYY-XXXXXX)
      const year = new Date().getFullYear()
      const randomNum = Math.floor(100000 + Math.random() * 900000)
      const teacherId = `TEA-${year}-${randomNum}`

      const teacher: any = {
        ...teacherData,
        teacherId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(teacherRef, teacher)

      // Return the serialized teacher data
      const createdTeacher = await this.getTeacher(teacherData.uid)
      return createdTeacher!
    } catch (error) {
      console.error('Error creating teacher:', error)
      throw new Error('Failed to create teacher account')
    }
  }

  // Get teacher by UID
  static async getTeacher(uid: string): Promise<TeacherData | null> {
    try {
      const teacherRef = doc(db, this.collectionName, uid)
      const teacherSnap = await getDoc(teacherRef)

      if (teacherSnap.exists()) {
        const data = teacherSnap.data()
        // Serialize Firestore Timestamps to ISO strings for client components
        return {
          ...serializeFirestoreData(data),
          id: teacherSnap.id,
        } as TeacherData
      }
      return null
    } catch (error) {
      console.error('Error getting teacher:', error)
      throw new Error('Failed to get teacher')
    }
  }

  // Get all teachers
  static async getAllTeachers(): Promise<TeacherData[]> {
    try {
      const teachersRef = collection(db, this.collectionName)
      const querySnapshot = await getDocs(teachersRef)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        // Serialize Firestore Timestamps to ISO strings for client components
        return {
          ...serializeFirestoreData(data),
          id: doc.id,
        } as TeacherData
      })
    } catch (error) {
      console.error('Error getting all teachers:', error)
      throw new Error('Failed to get all teachers')
    }
  }

  static async updateTeacher(
    teacherId: string,
    updateData: Partial<CreateTeacherData>
  ): Promise<TeacherData> {
    try {
      const teacherRef = doc(db, this.collectionName, teacherId)

      // Update the document
      await updateDoc(teacherRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      })

      // Return the updated teacher
      const updatedTeacher = await this.getTeacher(teacherId)
      if (!updatedTeacher) {
        throw new Error('Teacher not found after update')
      }
      return updatedTeacher
    } catch (error) {
      console.error('Error updating teacher:', error)
      throw new Error('Failed to update teacher')
    }
  }

  static async deleteTeacher(teacherId: string): Promise<void> {
    try {
      const teacherRef = doc(db, this.collectionName, teacherId)
      await deleteDoc(teacherRef)
    } catch (error) {
      console.error('Error deleting teacher:', error)
      throw new Error('Failed to delete teacher')
    }
  }
}
