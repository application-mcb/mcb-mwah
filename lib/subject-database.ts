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
  where,
  deleteField,
} from 'firebase/firestore'
import { db } from './firebase-server'

// Available subject colors (16 colors from Tailwind 700-800)
export const SUBJECT_COLORS = [
  'blue-900',
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
  'indigo-800',
] as const

export type SubjectColor = (typeof SUBJECT_COLORS)[number]

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

// Subject data structure for Firestore
export interface SubjectData {
  id: string // Auto-generated ID (e.g., "subject-math-grade-7")
  code: string // Subject code (e.g., "MATH101", "ENG202")
  name: string // Subject name (e.g., "Mathematics", "English")
  description: string // Detailed description of the subject
  gradeLevels: number[] // Grade levels this subject belongs to (7, 8, 9, 10, 11, 12)
  gradeIds: string[] // Specific grade IDs (supports strands like G11 ABM)
  courseCodes: string[] // College course codes this subject applies to (legacy)
  courseSelections: {
    code: string
    year: number
    semester: 'first-sem' | 'second-sem'
  }[] // College course selections with year and semester
  color: SubjectColor // Color theme for the subject
  lectureUnits: number // Number of lecture units for this subject
  labUnits: number // Number of lab units for this subject
  totalUnits: number // Total units (lecture + lab)
  prerequisites?: string[] // Array of subject IDs that must be completed before taking this subject
  postrequisites?: string[] // Array of subject IDs that require this subject as a prerequisite
  teacherAssignments?: Record<string, string[]> // { [sectionId]: teacherId[] } - Multiple teachers per section
  createdAt: string // ISO string (serialized from Firestore timestamp)
  updatedAt: string // ISO string (serialized from Firestore timestamp)
  createdBy: string // UID of the registrar who created it

  // Backward compatibility fields (optional)
  gradeLevel?: number // Legacy field for old subjects
}

// Input type for creating subjects (allows FieldValue for timestamps)
export interface CreateSubjectData
  extends Omit<SubjectData, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: any // Can be FieldValue or Date
  updatedAt: any // Can be FieldValue or Date
}

// Firestore database class for subjects
export class SubjectDatabase {
  private static collectionName = 'subjects'

  // Generate subject ID
  private static generateSubjectId(code: string): string {
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    return `subject-${cleanCode}`
  }

  // Create a new subject document
  static async createSubject(
    subjectData: CreateSubjectData
  ): Promise<SubjectData> {
    try {
      // Validate color
      if (!SUBJECT_COLORS.includes(subjectData.color)) {
        throw new Error(
          `Invalid subject color. Must be one of: ${SUBJECT_COLORS.join(', ')}`
        )
      }

      // Validate that at least one grade level or course code or course selection is provided
      if (
        (!subjectData.gradeLevels || subjectData.gradeLevels.length === 0) &&
        (!subjectData.gradeIds || subjectData.gradeIds.length === 0) &&
        (!subjectData.courseCodes || subjectData.courseCodes.length === 0) &&
        (!subjectData.courseSelections ||
          subjectData.courseSelections.length === 0)
      ) {
        throw new Error(
          'At least one grade level or college course must be specified'
        )
      }

      // Validate grade levels if provided
      if (subjectData.gradeLevels && subjectData.gradeLevels.length > 0) {
        for (const gradeLevel of subjectData.gradeLevels) {
          if (gradeLevel < 1 || gradeLevel > 12) {
            throw new Error('All grade levels must be between 1 and 12')
          }
        }
      }

      // Validate grade IDs if provided
      if (subjectData.gradeIds && subjectData.gradeIds.length > 0) {
        for (const gradeId of subjectData.gradeIds) {
          if (typeof gradeId !== 'string' || gradeId.trim() === '') {
            throw new Error('All grade IDs must be valid non-empty strings')
          }
        }
      }

      // Validate units
      if (subjectData.lectureUnits < 0 || subjectData.lectureUnits > 10) {
        throw new Error('Lecture units must be between 0 and 10')
      }
      if (subjectData.labUnits < 0 || subjectData.labUnits > 10) {
        throw new Error('Lab units must be between 0 and 10')
      }

      // Validate subject code format
      if (!/^[A-Z0-9]{2,10}$/.test(subjectData.code.toUpperCase())) {
        throw new Error(
          'Subject code must be 2-10 uppercase letters and numbers only'
        )
      }

      // Validate description length
      if (subjectData.description.length > 300) {
        throw new Error('Description must not exceed 300 characters')
      }

      const subjectId = this.generateSubjectId(subjectData.code)
      const subjectRef = doc(collection(db, this.collectionName), subjectId)

      // Extract unique course codes from courseSelections if courseCodes is empty
      let finalCourseCodes = subjectData.courseCodes || []
      if (
        finalCourseCodes.length === 0 &&
        subjectData.courseSelections &&
        subjectData.courseSelections.length > 0
      ) {
        finalCourseCodes = Array.from(
          new Set(subjectData.courseSelections.map((sel: any) => sel.code))
        )
      }

      const uniqueGradeLevels = Array.from(
        new Set(subjectData.gradeLevels || [])
      )
      const uniqueGradeIds = Array.from(
        new Set((subjectData.gradeIds || []).map((id: any) => String(id)))
      )

      const subject: any = {
        id: subjectId,
        ...subjectData,
        gradeLevels: uniqueGradeLevels,
        gradeIds: uniqueGradeIds,
        courseCodes: finalCourseCodes, // Ensure courseCodes is always populated
        totalUnits: subjectData.lectureUnits + subjectData.labUnits,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(subjectRef, subject)

      // Return the serialized subject data
      const createdSubject = await this.getSubject(subjectId)
      return createdSubject!
    } catch (error) {
      console.error('Error creating subject:', error)
      throw new Error('Failed to create subject')
    }
  }

  // Get subject by ID
  static async getSubject(id: string): Promise<SubjectData | null> {
    try {
      const subjectRef = doc(db, this.collectionName, id)
      const subjectSnap = await getDoc(subjectRef)

      if (subjectSnap.exists()) {
        const data = subjectSnap.data()
        const serialized = serializeFirestoreData(data) as any
        if (!serialized.courseCodes) {
          serialized.courseCodes = []
        }
        if (!serialized.gradeIds) {
          serialized.gradeIds = []
        }
        return serialized as SubjectData
      }
      return null
    } catch (error) {
      console.error('Error getting subject:', error)
      throw new Error('Failed to get subject data')
    }
  }

  // Get all subjects
  static async getAllSubjects(): Promise<SubjectData[]> {
    try {
      console.log('Attempting to fetch all subjects from Firestore...')
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      )
      console.log('Query created, executing getDocs...')
      const querySnapshot = await getDocs(q)
      console.log(`Found ${querySnapshot.docs.length} subjects in Firestore`)

      const subjects = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        // Handle backward compatibility for old subjects
        const serializedData = serializeFirestoreData(data) as any

        // If old structure (gradeLevel), convert to new structure (gradeLevels)
        if (serializedData.gradeLevel && !serializedData.gradeLevels) {
          serializedData.gradeLevels = [serializedData.gradeLevel]
          delete serializedData.gradeLevel
        }

        // Ensure courseCodes exists
        if (!serializedData.courseCodes) {
          serializedData.courseCodes = []
        }

        if (!serializedData.gradeIds) {
          serializedData.gradeIds = []
        }
        return serializedData as SubjectData
      })

      console.log(`Successfully processed ${subjects.length} subjects`)
      return subjects
    } catch (error) {
      console.error('Error getting all subjects:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw new Error(
        `Failed to get all subjects: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  // Get subjects by grade level (supports both old and new data structure)
  static async getSubjectsByGradeLevel(
    gradeLevel: number
  ): Promise<SubjectData[]> {
    try {
      // Get all subjects and filter client-side since we now use arrays
      const allSubjects = await this.getAllSubjects()

      const filteredSubjects = allSubjects
        .filter((subject) => {
          // Support both old structure (gradeLevel) and new structure (gradeLevels)
          if (subject.gradeLevels && Array.isArray(subject.gradeLevels)) {
            return subject.gradeLevels.includes(gradeLevel)
          } else if (subject.gradeLevel) {
            return subject.gradeLevel === gradeLevel
          }
          return false
        })
        .sort((a, b) => a.name.localeCompare(b.name))

      return filteredSubjects
    } catch (error) {
      console.error('Error getting subjects by grade level:', error)
      throw new Error('Failed to get subjects by grade level')
    }
  }

  // Get subjects by course code
  static async getSubjectsByCourseCode(
    courseCode: string
  ): Promise<SubjectData[]> {
    try {
      const allSubjects = await this.getAllSubjects()
      return allSubjects
        .filter((subject) => {
          return subject.courseCodes && subject.courseCodes.includes(courseCode)
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Error getting subjects by course code:', error)
      throw new Error('Failed to get subjects by course code')
    }
  }

  // Get subjects by color
  static async getSubjectsByColor(color: SubjectColor): Promise<SubjectData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('color', '==', color),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return serializeFirestoreData(data) as SubjectData
      })
    } catch (error) {
      console.error('Error getting subjects by color:', error)
      throw new Error('Failed to get subjects by color')
    }
  }

  // Update subject
  static async updateSubject(
    id: string,
    updateData: Partial<CreateSubjectData>
  ): Promise<SubjectData | null> {
    try {
      // Validate color if provided
      if (updateData.color && !SUBJECT_COLORS.includes(updateData.color)) {
        throw new Error(
          `Invalid subject color. Must be one of: ${SUBJECT_COLORS.join(', ')}`
        )
      }

      // Validate grade levels if provided
      if (updateData.gradeLevels !== undefined) {
        if (!Array.isArray(updateData.gradeLevels)) {
          throw new Error('Grade levels must be an array')
        }
        for (const gradeLevel of updateData.gradeLevels) {
          if (gradeLevel < 1 || gradeLevel > 12) {
            throw new Error('All grade levels must be between 1 and 12')
          }
        }
        updateData.gradeLevels = Array.from(new Set(updateData.gradeLevels))
      }

      // Validate grade IDs if provided
      if (updateData.gradeIds !== undefined) {
        if (!Array.isArray(updateData.gradeIds)) {
          throw new Error('Grade IDs must be an array')
        }
        for (const gradeId of updateData.gradeIds) {
          if (typeof gradeId !== 'string' || gradeId.trim() === '') {
            throw new Error('All grade IDs must be valid non-empty strings')
          }
        }
        updateData.gradeIds = Array.from(
          new Set(updateData.gradeIds.map((id: any) => String(id)))
        )
      }

      // Validate course codes if provided
      if (updateData.courseCodes !== undefined) {
        if (!Array.isArray(updateData.courseCodes)) {
          throw new Error('Course codes must be an array')
        }
      }

      // Validate course selections if provided
      if (updateData.courseSelections !== undefined) {
        if (!Array.isArray(updateData.courseSelections)) {
          throw new Error('Course selections must be an array')
        }
        // Validate course selection structure
        for (const selection of updateData.courseSelections) {
          if (!selection.code || typeof selection.code !== 'string') {
            throw new Error('Each course selection must have a valid code')
          }
          if (!selection.year || selection.year < 1 || selection.year > 4) {
            throw new Error(
              'Each course selection must have a valid year (1-4)'
            )
          }
          if (
            !selection.semester ||
            !['first-sem', 'second-sem'].includes(selection.semester)
          ) {
            throw new Error(
              'Each course selection must have a valid semester (first-sem or second-sem)'
            )
          }
        }
      }

      // Validate that at least one grade level, course code, or course selection is provided
      const hasGradeLevels =
        updateData.gradeLevels !== undefined &&
        updateData.gradeLevels.length > 0
      const hasGradeIds =
        updateData.gradeIds !== undefined && updateData.gradeIds.length > 0
      const hasCourseCodes =
        updateData.courseCodes !== undefined &&
        updateData.courseCodes.length > 0
      const hasCourseSelections =
        updateData.courseSelections !== undefined &&
        updateData.courseSelections.length > 0

      // If any of these fields are being updated, at least one must have a value
      if (
        updateData.gradeLevels !== undefined ||
        updateData.gradeIds !== undefined ||
        updateData.courseCodes !== undefined ||
        updateData.courseSelections !== undefined
      ) {
        if (!hasGradeLevels && !hasGradeIds && !hasCourseCodes && !hasCourseSelections) {
          throw new Error(
            'At least one grade level, grade ID, college course code, or course selection must be provided'
          )
        }
      }

      // Validate units if provided
      if (
        updateData.lectureUnits !== undefined &&
        (updateData.lectureUnits < 0 || updateData.lectureUnits > 10)
      ) {
        throw new Error('Lecture units must be between 0 and 10')
      }
      if (
        updateData.labUnits !== undefined &&
        (updateData.labUnits < 0 || updateData.labUnits > 10)
      ) {
        throw new Error('Lab units must be between 0 and 10')
      }

      // Validate description length if provided
      if (updateData.description && updateData.description.length > 300) {
        throw new Error('Description must not exceed 300 characters')
      }

      const subjectRef = doc(db, this.collectionName, id)

      // Extract unique course codes from courseSelections if courseCodes is being updated and is empty
      let finalCourseCodes = updateData.courseCodes
      if (updateData.courseSelections !== undefined) {
        if (
          updateData.courseCodes === undefined ||
          (Array.isArray(updateData.courseCodes) &&
            updateData.courseCodes.length === 0)
        ) {
          if (updateData.courseSelections.length > 0) {
            finalCourseCodes = Array.from(
              new Set(updateData.courseSelections.map((sel: any) => sel.code))
            )
          } else {
            finalCourseCodes = []
          }
        }
      }

      // Calculate total units if lecture or lab units are being updated
      const updatePayload: any = {
        ...updateData,
        ...(finalCourseCodes !== undefined && {
          courseCodes: finalCourseCodes,
        }),
        updatedAt: serverTimestamp(),
      }

      // If updating gradeLevels, remove old gradeLevel field for backward compatibility
      if (updateData.gradeLevels !== undefined) {
        updatePayload.gradeLevel = deleteField() // Remove old field
      }

      // If updating units, recalculate total
      if (
        updateData.lectureUnits !== undefined ||
        updateData.labUnits !== undefined
      ) {
        const currentSubject = await this.getSubject(id)
        if (currentSubject) {
          const newLectureUnits =
            updateData.lectureUnits !== undefined
              ? updateData.lectureUnits
              : currentSubject.lectureUnits
          const newLabUnits =
            updateData.labUnits !== undefined
              ? updateData.labUnits
              : currentSubject.labUnits
          updatePayload.totalUnits = newLectureUnits + newLabUnits
        }
      }

      await updateDoc(subjectRef, updatePayload)

      // Return updated subject data
      const updatedSubject = await this.getSubject(id)
      return updatedSubject
    } catch (error) {
      console.error('Error updating subject:', error)
      throw new Error('Failed to update subject')
    }
  }

  // Delete subject
  static async deleteSubject(id: string): Promise<boolean> {
    try {
      // Check if subject is used in any subject sets
      const subjectSets =
        await SubjectSetDatabase.getSubjectSetsContainingSubject(id)
      if (subjectSets.length > 0) {
        throw new Error(
          'Cannot delete subject that is used in subject sets. Remove from subject sets first.'
        )
      }

      const subjectRef = doc(db, this.collectionName, id)
      await deleteDoc(subjectRef)
      return true
    } catch (error) {
      console.error('Error deleting subject:', error)
      throw new Error('Failed to delete subject')
    }
  }

  // Check if subject exists
  static async subjectExists(id: string): Promise<boolean> {
    try {
      const subject = await this.getSubject(id)
      return subject !== null
    } catch (error) {
      console.error('Error checking if subject exists:', error)
      return false
    }
  }

  // Search subjects by name
  static async searchSubjects(searchTerm: string): Promise<SubjectData[]> {
    try {
      // Get all subjects and filter client-side since Firestore doesn't support partial text search
      const allSubjects = await this.getAllSubjects()
      const searchLower = searchTerm.toLowerCase()

      return allSubjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchLower) ||
          subject.description.toLowerCase().includes(searchLower)
      )
    } catch (error) {
      console.error('Error searching subjects:', error)
      throw new Error('Failed to search subjects')
    }
  }
}

// Subject Set data structure for Firestore
export interface SubjectSetData {
  id: string // Auto-generated ID (e.g., "subject-set-g10-core")
  name: string // Subject set name (e.g., "G10 Core Subjects")
  description: string // Description of the subject set
  subjects: string[] // Array of subject IDs
  gradeLevels: number[] // Grade levels this subject set applies to
  courseSelections: {
    code: string
    year: number
    semester: 'first-sem' | 'second-sem'
  }[] // College course selections with year and semester
  color: SubjectColor // Color theme for the subject set
  createdAt: string // ISO string (serialized from Firestore timestamp)
  updatedAt: string // ISO string (serialized from Firestore timestamp)
  createdBy: string // UID of the registrar who created it
  // Backward compatibility
  gradeLevel?: number // Old single grade level field (deprecated)
}

// Input type for creating subject sets
export interface CreateSubjectSetData
  extends Omit<SubjectSetData, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: any
  updatedAt: any
}

// Firestore database class for subject sets
export class SubjectSetDatabase {
  private static collectionName = 'subjectSets'

  // Generate subject set ID
  private static generateSubjectSetId(
    name: string,
    gradeLevel: number
  ): string {
    const cleanName = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    return `subject-set-${cleanName}-grade-${gradeLevel}`
  }

  // Create a new subject set document
  static async createSubjectSet(
    subjectSetData: CreateSubjectSetData
  ): Promise<SubjectSetData> {
    try {
      // Validate color
      if (!SUBJECT_COLORS.includes(subjectSetData.color)) {
        throw new Error(
          `Invalid subject set color. Must be one of: ${SUBJECT_COLORS.join(
            ', '
          )}`
        )
      }

      // Validate grade level
      if (subjectSetData.gradeLevel < 1 || subjectSetData.gradeLevel > 12) {
        throw new Error('Grade level must be between 1 and 12')
      }

      // Validate subjects exist
      for (const subjectId of subjectSetData.subjects) {
        const subjectExists = await SubjectDatabase.subjectExists(subjectId)
        if (!subjectExists) {
          throw new Error(`Subject with ID ${subjectId} does not exist`)
        }
      }

      // Validate description length
      if (subjectSetData.description.length > 300) {
        throw new Error('Description must not exceed 300 characters')
      }

      const subjectSetId = this.generateSubjectSetId(
        subjectSetData.name,
        subjectSetData.gradeLevel
      )
      const subjectSetRef = doc(
        collection(db, this.collectionName),
        subjectSetId
      )

      const subjectSet: any = {
        id: subjectSetId,
        ...subjectSetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(subjectSetRef, subjectSet)

      // Return the serialized subject set data
      const createdSubjectSet = await this.getSubjectSet(subjectSetId)
      return createdSubjectSet!
    } catch (error) {
      console.error('Error creating subject set:', error)
      throw new Error('Failed to create subject set')
    }
  }

  // Get subject set by ID
  static async getSubjectSet(id: string): Promise<SubjectSetData | null> {
    try {
      const subjectSetRef = doc(db, this.collectionName, id)
      const subjectSetSnap = await getDoc(subjectSetRef)

      if (subjectSetSnap.exists()) {
        const data = subjectSetSnap.data()
        return serializeFirestoreData(data) as SubjectSetData
      }
      return null
    } catch (error) {
      console.error('Error getting subject set:', error)
      throw new Error('Failed to get subject set data')
    }
  }

  // Get all subject sets
  static async getAllSubjectSets(): Promise<SubjectSetData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return serializeFirestoreData(data) as SubjectSetData
      })
    } catch (error) {
      console.error('Error getting all subject sets:', error)
      throw new Error('Failed to get all subject sets')
    }
  }

  // Get subject sets by grade level
  static async getSubjectSetsByGradeLevel(
    gradeLevel: number
  ): Promise<SubjectSetData[]> {
    try {
      // First try with composite index (where + orderBy)
      try {
        const q = query(
          collection(db, this.collectionName),
          where('gradeLevel', '==', gradeLevel),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)

        const subjectSets = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return serializeFirestoreData(data) as SubjectSetData
        })

        // Sort by name after fetching (client-side sort)
        return subjectSets.sort((a, b) => a.name.localeCompare(b.name))
      } catch (indexError) {
        console.warn(
          'Composite index not available for subject sets, falling back to client-side filtering'
        )

        // Fallback: Get all subject sets and filter client-side
        const allSubjectSets = await this.getAllSubjectSets()
        return allSubjectSets
          .filter((subjectSet) => subjectSet.gradeLevel === gradeLevel)
          .sort((a, b) => a.name.localeCompare(b.name))
      }
    } catch (error) {
      console.error('Error getting subject sets by grade level:', error)
      throw new Error('Failed to get subject sets by grade level')
    }
  }

  // Get subject sets that contain a specific subject
  static async getSubjectSetsContainingSubject(
    subjectId: string
  ): Promise<SubjectSetData[]> {
    try {
      const q = query(collection(db, this.collectionName))
      const querySnapshot = await getDocs(q)

      const subjectSets = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return serializeFirestoreData(data) as SubjectSetData
      })

      // Filter subject sets that contain the subject
      return subjectSets.filter((subjectSet) =>
        subjectSet.subjects.includes(subjectId)
      )
    } catch (error) {
      console.error('Error getting subject sets containing subject:', error)
      throw new Error('Failed to get subject sets containing subject')
    }
  }

  // Update subject set
  static async updateSubjectSet(
    id: string,
    updateData: Partial<CreateSubjectSetData>
  ): Promise<SubjectSetData | null> {
    try {
      // Validate color if provided
      if (updateData.color && !SUBJECT_COLORS.includes(updateData.color)) {
        throw new Error(
          `Invalid subject set color. Must be one of: ${SUBJECT_COLORS.join(
            ', '
          )}`
        )
      }

      // Validate grade level if provided
      if (
        updateData.gradeLevel !== undefined &&
        (updateData.gradeLevel < 1 || updateData.gradeLevel > 12)
      ) {
        throw new Error('Grade level must be between 1 and 12')
      }

      // Validate subjects exist if provided
      if (updateData.subjects) {
        for (const subjectId of updateData.subjects) {
          const subjectExists = await SubjectDatabase.subjectExists(subjectId)
          if (!subjectExists) {
            throw new Error(`Subject with ID ${subjectId} does not exist`)
          }
        }
      }

      // Validate description length if provided
      if (updateData.description && updateData.description.length > 300) {
        throw new Error('Description must not exceed 300 characters')
      }

      const subjectSetRef = doc(db, this.collectionName, id)

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(subjectSetRef, updatePayload)

      // Return updated subject set data
      const updatedSubjectSet = await this.getSubjectSet(id)
      return updatedSubjectSet
    } catch (error) {
      console.error('Error updating subject set:', error)
      throw new Error('Failed to update subject set')
    }
  }

  // Delete subject set
  static async deleteSubjectSet(id: string): Promise<boolean> {
    try {
      const subjectSetRef = doc(db, this.collectionName, id)
      await deleteDoc(subjectSetRef)
      return true
    } catch (error) {
      console.error('Error deleting subject set:', error)
      throw new Error('Failed to delete subject set')
    }
  }

  // Check if subject set exists
  static async subjectSetExists(id: string): Promise<boolean> {
    try {
      const subjectSet = await this.getSubjectSet(id)
      return subjectSet !== null
    } catch (error) {
      console.error('Error checking if subject set exists:', error)
      return false
    }
  }
}
