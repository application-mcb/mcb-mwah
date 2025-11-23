import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase-server'
import { SubjectDatabase } from './subject-database'
import { SectionDatabase, GradeDatabase } from './grade-section-database'

// Metadata fields that should be excluded from subject processing
const METADATA_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'studentName',
  'studentSection',
  'studentLevel',
  'studentSemester',
])

export interface EnrollmentData {
  id?: string // Document ID from Firestore
  userId: string
  personalInfo: {
    firstName: string
    middleName?: string
    lastName: string
    nameExtension?: string
    email: string
    phone: string
    birthDay: string
    birthMonth: string
    birthYear: string
    citizenship: string
    civilStatus: string
    gender: string
    placeOfBirth: string
    religion?: string
  }
  enrollmentInfo: {
    gradeLevel?: string // For high school
    gradeId?: string // For high school - grade identifier (e.g., "grade-11-shs-stem")
    department?: string // For high school (JHS/SHS)
    strand?: string // For SHS
    semester?: 'first-sem' | 'second-sem' // For college and SHS
    courseId?: string // For college
    courseCode?: string // For college
    courseName?: string // For college
    yearLevel?: number // For college
    schoolYear: string
    enrollmentDate: string
    status: string
    orNumber?: string
    scholarship?: string
    studentId?: string
    sectionId?: string
    studentType?: 'regular' | 'irregular'
    level: 'high-school' | 'college'
  }
  selectedSubjects?: string[]
  documents: {
    [key: string]: {
      name: string
      url: string
      uploadedAt: string
    }
  }
  submittedAt: string
  updatedAt: string
}

export interface SystemConfig {
  ayCode: string
  currentAY?: string
  academicYear?: string
  AYCode?: string
  activeAY?: string
  semester?: string
  enrollmentStartPeriodHS?: string
  enrollmentEndPeriodHS?: string
  enrollmentStartPeriodCollege?: string
  enrollmentEndPeriodCollege?: string
}

// Utility function to get or derive gradeId from enrollment info
// This ensures backward compatibility with legacy records that don't have gradeId stored
export function getOrDeriveGradeId(enrollmentInfo: any): string | undefined {
  // If gradeId already exists, return it
  if (enrollmentInfo?.gradeId) {
    return enrollmentInfo.gradeId
  }

  // Only derive for high school enrollments
  if (enrollmentInfo?.level !== 'high-school') {
    return undefined
  }

  const gradeLevel = enrollmentInfo?.gradeLevel
  const department = enrollmentInfo?.department
  const strand = enrollmentInfo?.strand

  // Need at least gradeLevel and department to derive gradeId
  if (!gradeLevel || !department) {
    return undefined
  }

  // Reconstruct gradeId using same pattern as GradeDatabase.generateGradeId()
  // Pattern: grade-{gradeLevel}-{department}-{strand} for SHS, grade-{gradeLevel}-{department} for JHS
  if (department === 'SHS' && strand) {
    return `grade-${gradeLevel}-${department.toLowerCase()}-${strand.toLowerCase()}`
  }
  return `grade-${gradeLevel}-${department.toLowerCase()}`
}

export class EnrollmentDatabase {
  // Helper function to generate document ID based on enrollment info
  // Format: AY2526_first_semester_BSIT_1 (college) or AY2526_first_semester_STEM_11 (SHS) or AY2526_JHS_7 (JHS)
  static generateDocumentId(ayCode: string, enrollmentInfo: any): string {
    const level = enrollmentInfo?.level
    const semester = enrollmentInfo?.semester
    const department = enrollmentInfo?.department

    // College: AY2526_first_semester_BSIT_1
    if (level === 'college' && semester) {
      const courseCode = enrollmentInfo?.courseCode || ''
      const yearLevel = enrollmentInfo?.yearLevel || ''
      const semesterStr =
        semester === 'first-sem' ? 'first_semester' : 'second_semester'
      return `${ayCode}_${semesterStr}_${courseCode}_${yearLevel}`
    }

    // SHS: AY2526_first_semester_STEM_11
    if (level === 'high-school' && department === 'SHS' && semester) {
      const strand = enrollmentInfo?.strand || ''
      const gradeLevel = enrollmentInfo?.gradeLevel || ''
      const semesterStr =
        semester === 'first-sem' ? 'first_semester' : 'second_semester'
      return `${ayCode}_${semesterStr}_${strand}_${gradeLevel}`
    }

    // JHS: AY2526_JHS_7 (unchanged)
    if (level === 'high-school' && department === 'JHS') {
      const gradeLevel = enrollmentInfo?.gradeLevel || ''
      return `${ayCode}_JHS_${gradeLevel}`
    }

    // Fallback for legacy enrollments
    return ayCode
  }

  // Helper function to generate enrollment document ID (with userId prefix)
  static generateEnrollmentDocumentId(
    userId: string,
    ayCode: string,
    enrollmentInfo: any
  ): string {
    const docId = this.generateDocumentId(ayCode, enrollmentInfo)
    return `${userId}_${docId}`
  }

  // Get system configuration (academic year, etc.)
  static async getSystemConfig(): Promise<SystemConfig> {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'system'))

      if (!configDoc.exists()) {
        // Return default config if not found
        return {
          ayCode: 'AY2526',
          currentAY: 'AY2526',
        }
      }

      const configData = configDoc.data() || {}

      // Try to find AY code from various possible fields
      let ayCode =
        configData.currentAY ||
        configData.academicYear ||
        configData.AYCode ||
        configData.activeAY ||
        configData.AY

      if (!ayCode) {
        // Look for any field that matches AY pattern
        const ayKey = Object.keys(configData).find((k) =>
          /^AY\d{2}\d{2}$/.test(k)
        )
        if (ayKey) ayCode = ayKey
      }

      if (!ayCode || !/^AY\d{2}\d{2}$/.test(ayCode)) {
        ayCode = 'AY2526' // fallback
      }

      return {
        ayCode,
        currentAY: configData.currentAY,
        academicYear: configData.academicYear,
        AYCode: configData.AYCode,
        activeAY: configData.activeAY,
        semester: configData.semester || '1',
        enrollmentStartPeriodHS: configData.enrollmentStartPeriodHS,
        enrollmentEndPeriodHS: configData.enrollmentEndPeriodHS,
        enrollmentStartPeriodCollege: configData.enrollmentStartPeriodCollege,
        enrollmentEndPeriodCollege: configData.enrollmentEndPeriodCollege,
      }
    } catch (error) {
      console.error('Error fetching system config:', error)
      return {
        ayCode: 'AY2526',
        currentAY: 'AY2526',
      }
    }
  }

  // Update system configuration (academic year, semester, and enrollment duration)
  static async updateSystemConfig(
    ay: string,
    semester?: string,
    enrollmentStartPeriodHS?: string | null,
    enrollmentEndPeriodHS?: string | null,
    enrollmentStartPeriodCollege?: string | null,
    enrollmentEndPeriodCollege?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate AY format (e.g., AY2526)
      if (!/^AY\d{2}\d{2}$/.test(ay)) {
        return {
          success: false,
          error: 'Invalid AY format. Expected format: AY2526',
        }
      }

      // Validate semester if provided
      if (semester !== undefined && !/^[12]$/.test(semester)) {
        return {
          success: false,
          error: 'Invalid semester. Must be 1 or 2',
        }
      }

      const configRef = doc(db, 'config', 'system')

      // Prepare update data
      const updateData: any = {
        AY: ay,
        updatedAt: serverTimestamp(),
      }

      // Add semester if provided
      if (semester !== undefined) {
        updateData.semester = semester
      }

      // Add enrollment duration for high school if provided
      if (
        enrollmentStartPeriodHS !== undefined &&
        enrollmentStartPeriodHS !== null
      ) {
        updateData.enrollmentStartPeriodHS = enrollmentStartPeriodHS
      }
      if (
        enrollmentEndPeriodHS !== undefined &&
        enrollmentEndPeriodHS !== null
      ) {
        updateData.enrollmentEndPeriodHS = enrollmentEndPeriodHS
      }

      // Add enrollment duration for college if provided
      if (
        enrollmentStartPeriodCollege !== undefined &&
        enrollmentStartPeriodCollege !== null
      ) {
        updateData.enrollmentStartPeriodCollege = enrollmentStartPeriodCollege
      }
      if (
        enrollmentEndPeriodCollege !== undefined &&
        enrollmentEndPeriodCollege !== null
      ) {
        updateData.enrollmentEndPeriodCollege = enrollmentEndPeriodCollege
      }

      // Use setDoc with merge to create or update
      await setDoc(configRef, updateData, { merge: true })

      console.log(
        `  System config updated: AY = ${ay}${
          semester ? `, Semester = ${semester}` : ''
        }${
          enrollmentStartPeriodHS
            ? `, HS Enrollment: ${enrollmentStartPeriodHS} to ${enrollmentEndPeriodHS}`
            : ''
        }${
          enrollmentStartPeriodCollege
            ? `, College Enrollment: ${enrollmentStartPeriodCollege} to ${enrollmentEndPeriodCollege}`
            : ''
        }`
      )
      return { success: true }
    } catch (error) {
      console.error('Error updating system config:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update system configuration',
      }
    }
  }

  // Helper function to remove undefined values from objects (Firestore doesn't allow undefined)
  // Preserves Firebase FieldValue objects (like serverTimestamp()) and other special objects
  private static removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }
    // Preserve Firebase FieldValue objects and other special objects (they have special constructors)
    if (
      typeof obj === 'object' &&
      obj.constructor !== Object &&
      obj.constructor !== Array
    ) {
      return obj
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeUndefinedValues(item))
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value)
        }
      }
      return cleaned
    }
    return obj
  }

  // Submit enrollment data
  static async submitEnrollment(
    userId: string,
    enrollmentData: Partial<EnrollmentData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for dynamic AY code
      const systemConfig = await this.getSystemConfig()
      const ayCode = systemConfig.ayCode

      // Generate document IDs using new format
      const enrollmentInfo = enrollmentData.enrollmentInfo as any
      const subCollectionDocId = this.generateDocumentId(ayCode, enrollmentInfo)
      const docId = this.generateEnrollmentDocumentId(
        userId,
        ayCode,
        enrollmentInfo
      )

      // Create the enrollment document in subcollection
      const enrollmentRef = doc(
        db,
        'students',
        userId,
        'enrollment',
        subCollectionDocId
      )

      const completeEnrollmentData = {
        userId,
        ...enrollmentData,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Remove undefined values before saving (Firestore doesn't allow undefined)
      const cleanedEnrollmentData = this.removeUndefinedValues(
        completeEnrollmentData
      )

      await setDoc(enrollmentRef, cleanedEnrollmentData)

      // Also save to top-level enrollments collection
      const topLevelEnrollmentRef = doc(db, 'enrollments', docId)
      const isSHS =
        enrollmentInfo?.level === 'high-school' &&
        enrollmentInfo?.department === 'SHS'
      const isCollege = enrollmentInfo?.level === 'college'
      const semester = enrollmentInfo?.semester
      const topLevelPayload: any = {
        userId,
        ayCode,
        enrollmentData: cleanedEnrollmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      if ((isCollege || isSHS) && semester) {
        topLevelPayload.semester = semester
      }
      // Remove undefined values before saving
      const cleanedTopLevelPayload = this.removeUndefinedValues(topLevelPayload)
      await setDoc(topLevelEnrollmentRef, cleanedTopLevelPayload)

      console.log(
        `  Enrollment submitted successfully for user ${userId} in ${ayCode}${
          (isCollege || isSHS) && semester ? ` (${semester})` : ''
        }`
      )
      return { success: true }
    } catch (error) {
      console.error('Error submitting enrollment:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Get user's enrollment status
  // For college: checks enrollment with current AY + semester
  // For high school: checks enrollment with current AY only
  //
  // OPTIMIZED FOR SCALABILITY:
  // 1. Direct document lookups (O(1)) are used first - most efficient
  // 2. Query is only used as last resort for edge cases
  // 3. Order: New format → Old format → Subcollection → Query fallback
  static async getEnrollment(
    userId: string,
    ayCode?: string,
    semester?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!ayCode) {
        const systemConfig = await this.getSystemConfig()
        ayCode = systemConfig.ayCode
      }

      // OPTIMIZATION 1: Direct document lookup - NEW format (most efficient, O(1))
      // For college: enrollments/{userId}_{ayCode}_{semester}
      if (semester) {
        const newFormatDocId = `${userId}_${ayCode}_${semester}`
        const newFormatRef = doc(db, 'enrollments', newFormatDocId)
        const newFormatDoc = await getDoc(newFormatRef)

        if (newFormatDoc.exists()) {
          const docData = newFormatDoc.data()
          if (docData.enrollmentData) {
            const enrollmentData = docData.enrollmentData
            // Verify it matches (should always match if document exists, but double-check)
            if (
              enrollmentData.enrollmentInfo?.schoolYear === ayCode &&
              enrollmentData.enrollmentInfo?.semester === semester &&
              enrollmentData.enrollmentInfo?.level === 'college'
            ) {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
        }
      }

      // OPTIMIZATION 2: Direct document lookup - Subcollection NEW format (O(1))
      // For college/SHS: students/{userId}/enrollment/{new_format_doc_id}
      // Note: We can't generate exact new format ID without enrollment info, so we try common patterns
      if (semester) {
        // Try to find enrollment by querying subcollection and matching semester
        const subcolRef = collection(db, 'students', userId, 'enrollment')
        const subcolSnap = await getDocs(subcolRef)

        for (const docSnap of subcolSnap.docs) {
          const enrollmentData = docSnap.data()
          // Check if this enrollment matches the requested semester and AY
          if (
            enrollmentData.enrollmentInfo?.semester === semester &&
            enrollmentData.enrollmentInfo?.schoolYear === ayCode
          ) {
            // For college, verify level
            if (enrollmentData.enrollmentInfo?.level === 'college') {
              return {
                success: true,
                data: enrollmentData,
              }
            }
            // For SHS, verify department
            if (
              enrollmentData.enrollmentInfo?.level === 'high-school' &&
              enrollmentData.enrollmentInfo?.department === 'SHS'
            ) {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
        }
      }

      // OPTIMIZATION 3: Direct document lookup - OLD format (O(1))
      // enrollments/{userId}_{ayCode} - used for both college and high school before semester-based IDs
      const oldFormatDocId = `${userId}_${ayCode}`
      const oldFormatRef = doc(db, 'enrollments', oldFormatDocId)
      const oldFormatDoc = await getDoc(oldFormatRef)

      if (oldFormatDoc.exists()) {
        const enrollmentDoc = oldFormatDoc.data()
        if (enrollmentDoc.enrollmentData) {
          const enrollmentData = enrollmentDoc.enrollmentData
          const enrollmentAY = enrollmentData.enrollmentInfo?.schoolYear
          const enrollmentSemester = enrollmentData.enrollmentInfo?.semester
          const enrollmentLevel = enrollmentData.enrollmentInfo?.level

          // For college: must match AY + semester
          if (semester && enrollmentLevel === 'college') {
            if (enrollmentAY === ayCode && enrollmentSemester === semester) {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
          // For SHS: must match AY + semester + department
          else if (
            semester &&
            enrollmentLevel === 'high-school' &&
            enrollmentData.enrollmentInfo?.department === 'SHS'
          ) {
            if (enrollmentAY === ayCode && enrollmentSemester === semester) {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
          // For JHS: must match AY only (no semester)
          else if (
            !semester &&
            (enrollmentLevel === 'high-school' ||
              (!enrollmentLevel && !enrollmentSemester))
          ) {
            const enrollmentDept = enrollmentData.enrollmentInfo?.department
            // Exclude SHS enrollments (they have semesters)
            if (enrollmentAY === ayCode && enrollmentDept !== 'SHS') {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
        }
      }

      // OPTIMIZATION 4: Subcollection without semester (JHS or legacy) - O(1)
      if (!semester) {
        // Try old format first
        const subCollectionDocId = ayCode
        const enrollmentRef = doc(
          db,
          'students',
          userId,
          'enrollment',
          subCollectionDocId
        )
        const enrollmentDoc = await getDoc(enrollmentRef)

        if (enrollmentDoc.exists()) {
          const enrollmentData = enrollmentDoc.data()
          // Verify it's for JHS (no semester, not SHS)
          const enrollmentDept = enrollmentData.enrollmentInfo?.department
          if (
            enrollmentData.enrollmentInfo?.schoolYear === ayCode &&
            (enrollmentData.enrollmentInfo?.level === 'high-school' ||
              !enrollmentData.enrollmentInfo?.semester) &&
            enrollmentDept !== 'SHS'
          ) {
            return {
              success: true,
              data: enrollmentData,
            }
          }
        }

        // Also try new JHS format: AY2526_JHS_7
        const jhsPattern = `${ayCode}_JHS_`
        const subcolRef = collection(db, 'students', userId, 'enrollment')
        const subcolSnap = await getDocs(subcolRef)

        for (const docSnap of subcolSnap.docs) {
          if (docSnap.id.startsWith(jhsPattern)) {
            const enrollmentData = docSnap.data()
            if (
              enrollmentData.enrollmentInfo?.schoolYear === ayCode &&
              enrollmentData.enrollmentInfo?.department === 'JHS' &&
              !enrollmentData.enrollmentInfo?.semester
            ) {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
        }
      }

      // FALLBACK: Query only if all direct lookups fail (for edge cases)
      // This is O(n) where n = number of enrollments for this user in this AY
      // In practice, this should rarely execute since direct lookups cover 99% of cases
      const enrollmentsRef = collection(db, 'enrollments')
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('userId', '==', userId),
        where('ayCode', '==', ayCode)
      )

      const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

      for (const docSnapshot of enrollmentsSnapshot.docs) {
        const enrollmentDoc = docSnapshot.data()
        if (enrollmentDoc.enrollmentData) {
          const enrollmentData = enrollmentDoc.enrollmentData
          const enrollmentAY = enrollmentData.enrollmentInfo?.schoolYear
          const enrollmentSemester = enrollmentData.enrollmentInfo?.semester
          const enrollmentLevel = enrollmentData.enrollmentInfo?.level

          // For college: must match AY + semester
          if (semester && enrollmentLevel === 'college') {
            if (enrollmentAY === ayCode && enrollmentSemester === semester) {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
          // For SHS: must match AY + semester + department
          else if (
            semester &&
            enrollmentLevel === 'high-school' &&
            enrollmentData.enrollmentInfo?.department === 'SHS'
          ) {
            if (enrollmentAY === ayCode && enrollmentSemester === semester) {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
          // For JHS: must match AY only (no semester)
          else if (
            !semester &&
            (enrollmentLevel === 'high-school' ||
              (!enrollmentLevel && !enrollmentSemester))
          ) {
            const enrollmentDept = enrollmentData.enrollmentInfo?.department
            // Exclude SHS enrollments (they have semesters)
            if (enrollmentAY === ayCode && enrollmentDept !== 'SHS') {
              return {
                success: true,
                data: enrollmentData,
              }
            }
          }
        }
      }

      return {
        success: false,
        error: 'No enrollment found for this user',
      }
    } catch (error) {
      console.error('Error fetching enrollment:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Check if student exists
  static async getStudent(
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const studentRef = doc(db, 'students', userId)
      const studentDoc = await getDoc(studentRef)

      if (!studentDoc.exists()) {
        return {
          success: false,
          error: 'Student not found',
        }
      }

      return {
        success: true,
        data: studentDoc.data(),
      }
    } catch (error) {
      console.error('Error fetching student:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Get all enrollments for registrar view
  static async getAllEnrollments(
    ayCode?: string
  ): Promise<{ success: boolean; data?: EnrollmentData[]; error?: string }> {
    try {
      if (!ayCode) {
        const systemConfig = await this.getSystemConfig()
        ayCode = systemConfig.ayCode
      }

      // Get all enrollments from the top-level enrollments collection
      const enrollmentsRef = collection(db, 'enrollments')
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('ayCode', '==', ayCode)
        // Note: ordering removed to avoid composite index requirement
        // orderBy('updatedAt', 'desc')
      )

      const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
      const enrollments: EnrollmentData[] = []

      for (const doc of enrollmentsSnapshot.docs) {
        const enrollmentDoc = doc.data()
        if (enrollmentDoc.enrollmentData) {
          enrollments.push({
            ...enrollmentDoc.enrollmentData,
            // Add document ID for reference
            id: doc.id,
          })
        }
      }

      // Sort enrollments by updatedAt in descending order (most recent first)
      enrollments.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime()
        const dateB = new Date(b.updatedAt).getTime()
        return dateB - dateA // Descending order
      })

      return {
        success: true,
        data: enrollments,
      }
    } catch (error) {
      console.error('Error fetching all enrollments:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Get all enrolled students (status='enrolled') - for student management
  static async getAllEnrolledStudents(): Promise<{
    success: boolean
    data?: EnrollmentData[]
    error?: string
  }> {
    try {
      // Get all enrollments with status='enrolled' from the top-level enrollments collection
      const enrollmentsRef = collection(db, 'enrollments')
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('enrollmentData.enrollmentInfo.status', '==', 'enrolled')
      )

      const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
      const enrollments: EnrollmentData[] = []

      for (const doc of enrollmentsSnapshot.docs) {
        const enrollmentDoc = doc.data()
        if (enrollmentDoc.enrollmentData) {
          enrollments.push({
            ...enrollmentDoc.enrollmentData,
            // Add document ID for reference
            id: doc.id,
          })
        }
      }

      // Sort enrollments by updatedAt in descending order (most recent first)
      enrollments.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime()
        const dateB = new Date(b.updatedAt).getTime()
        return dateB - dateA // Descending order
      })

      return {
        success: true,
        data: enrollments,
      }
    } catch (error) {
      console.error('Error fetching all enrolled students:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Helper function to build student metadata for studentGrades document
  private static async buildStudentMetadata(
    userId: string,
    ayCode: string,
    enrollmentData?: any,
    levelParam?: 'college' | 'high-school'
  ): Promise<{
    studentName: string
    studentSection: string
    studentLevel: string
    studentSemester: string
  }> {
    let studentName = ''
    let studentSection = ''
    let studentLevel = ''
    let studentSemester = ''

    // Get enrollment data if not provided
    if (!enrollmentData) {
      const enrollmentResult = await this.getEnrollment(userId, ayCode)
      if (enrollmentResult.success && enrollmentResult.data) {
        enrollmentData = enrollmentResult.data
      }
    }

    // Build studentName from personalInfo
    if (enrollmentData?.personalInfo) {
      const { firstName, middleName, lastName, nameExtension } =
        enrollmentData.personalInfo
      const nameParts = [
        firstName || '',
        middleName || '',
        lastName || '',
        nameExtension || '',
      ].filter((part) => part.trim() !== '')
      studentName = nameParts.join(' ').trim()
    }

    // Build studentSection from sectionId
    const sectionId = enrollmentData?.enrollmentInfo?.sectionId
    if (sectionId) {
      try {
        const section = await SectionDatabase.getSection(sectionId)
        if (section) {
          studentSection = section.sectionName
        }
      } catch (error) {
        console.warn(`Failed to fetch section ${sectionId}:`, error)
      }
    }

    // Build studentLevel and studentSemester based on level
    const enrollmentInfo = enrollmentData?.enrollmentInfo || {}
    const level = enrollmentInfo.level || levelParam

    if (level === 'college') {
      const courseCode = enrollmentInfo.courseCode || ''
      const yearLevel = enrollmentInfo.yearLevel || ''
      const semester = enrollmentInfo.semester || ''

      // Format: "BSIT 1 - S1" where S1 = first-sem, S2 = second-sem
      const semesterNumber =
        semester === 'first-sem' ? '1' : semester === 'second-sem' ? '2' : ''
      studentLevel =
        courseCode && yearLevel
          ? `${courseCode} ${yearLevel}${
              semesterNumber ? ` - S${semesterNumber}` : ''
            }`
          : ''
      studentSemester = semester || ''
    } else {
      // High school
      const gradeLevel = enrollmentInfo.gradeLevel || ''
      const gradeId = getOrDeriveGradeId(enrollmentInfo)
      let strand = ''

      // Fetch grade data to get strand for SHS
      if (gradeId) {
        try {
          const grade = await GradeDatabase.getGrade(gradeId)
          if (grade && grade.department === 'SHS' && grade.strand) {
            strand = grade.strand
          }
        } catch (error) {
          console.warn(`Failed to fetch grade ${gradeId}:`, error)
        }
      }

      // Format: "Grade 7" for JHS or "Grade 11 ABM" for SHS
      if (gradeLevel) {
        studentLevel = `Grade ${gradeLevel}${strand ? ` ${strand}` : ''}`
      }
      // For SHS, include semester; for JHS, empty
      if (
        enrollmentData?.enrollmentInfo?.department === 'SHS' &&
        enrollmentData?.enrollmentInfo?.semester
      ) {
        studentSemester = enrollmentData.enrollmentInfo.semester
      } else {
        studentSemester = '' // Empty for JHS
      }
    }

    return {
      studentName,
      studentSection,
      studentLevel,
      studentSemester,
    }
  }

  // Enroll student - update status and create studentGrades subcollection
  static async enrollStudent(
    userId: string,
    selectedSubjects: string[],
    orNumber?: string,
    scholarship?: string,
    studentId?: string,
    studentType?: 'regular' | 'irregular',
    level?: 'college' | 'high-school',
    semester?: 'first-sem' | 'second-sem'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig()
      const ayCode = systemConfig.ayCode

      // First, try to get existing enrollment to determine document ID format
      // Try new format first, then fall back to old format
      let enrollmentDataForId: any = null
      let subCollectionDocId: string
      let topLevelDocId: string

      // Try to get enrollment with semester (for college/SHS)
      if (semester) {
        const enrollmentResult = await this.getEnrollment(
          userId,
          ayCode,
          semester
        )
        if (enrollmentResult.success && enrollmentResult.data) {
          enrollmentDataForId = enrollmentResult.data
        }
      }

      // If not found, try without semester (for JHS or legacy)
      if (!enrollmentDataForId) {
        const enrollmentResult = await this.getEnrollment(userId, ayCode)
        if (enrollmentResult.success && enrollmentResult.data) {
          enrollmentDataForId = enrollmentResult.data
        }
      }

      // Generate document IDs using new format if we have enrollment info
      if (enrollmentDataForId?.enrollmentInfo) {
        subCollectionDocId = this.generateDocumentId(
          ayCode,
          enrollmentDataForId.enrollmentInfo
        )
        topLevelDocId = this.generateEnrollmentDocumentId(
          userId,
          ayCode,
          enrollmentDataForId.enrollmentInfo
        )
      } else {
        // Fallback to old format for backward compatibility
        subCollectionDocId = semester ? `${ayCode}_${semester}` : ayCode
        topLevelDocId = semester
          ? `${userId}_${ayCode}_${semester}`
          : `${userId}_${ayCode}`
      }

      // Check if enrollment document exists, if not create it
      const enrollmentRef = doc(
        db,
        'students',
        userId,
        'enrollment',
        subCollectionDocId
      )
      const enrollmentDoc = await getDoc(enrollmentRef)

      if (!enrollmentDoc.exists()) {
        // Create the enrollment document first
        const enrollmentData = {
          userId,
          personalInfo: {}, // Will be filled from top-level enrollment
          enrollmentInfo: {
            gradeLevel: '',
            schoolYear: ayCode,
            enrollmentDate: new Date().toISOString(),
            status: 'enrolled',
            orNumber: orNumber || '',
            scholarship: scholarship || '',
            studentId: studentId || '',
            studentType: studentType || 'regular', // Preserve studentType
          },
          selectedSubjects,
          documents: {},
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        // Try to get data from top-level enrollment
        const topLevelEnrollmentRef = doc(db, 'enrollments', topLevelDocId)
        const topLevelDoc = await getDoc(topLevelEnrollmentRef)

        if (topLevelDoc.exists()) {
          const topLevelData = topLevelDoc.data()
          if (topLevelData?.enrollmentData) {
            enrollmentData.personalInfo =
              topLevelData.enrollmentData.personalInfo || {}
            enrollmentData.enrollmentInfo.gradeLevel =
              topLevelData.enrollmentData.enrollmentInfo?.gradeLevel || ''
            enrollmentData.enrollmentInfo.studentType =
              topLevelData.enrollmentData.enrollmentInfo?.studentType ||
              studentType ||
              'regular'
            enrollmentData.documents =
              topLevelData.enrollmentData.documents || {}
            enrollmentData.submittedAt =
              topLevelData.enrollmentData.submittedAt || serverTimestamp()
          }
        }

        // Remove undefined values before saving (Firestore doesn't allow undefined)
        const cleanedEnrollmentDataForEnroll =
          this.removeUndefinedValues(enrollmentData)
        await setDoc(enrollmentRef, cleanedEnrollmentDataForEnroll)
      } else {
        // Update existing enrollment status
        const enrollmentUpdate = {
          'enrollmentInfo.status': 'enrolled',
          'enrollmentInfo.enrollmentDate': new Date().toISOString(),
          'enrollmentInfo.orNumber': orNumber || '',
          'enrollmentInfo.scholarship': scholarship || '',
          'enrollmentInfo.studentType': studentType || 'regular',
          selectedSubjects: selectedSubjects,
          updatedAt: serverTimestamp(),
        }

        await updateDoc(enrollmentRef, enrollmentUpdate)
      }

      // Update student document with studentId
      if (studentId) {
        const studentRef = doc(db, 'students', userId)
        await updateDoc(studentRef, {
          studentId: studentId,
          updatedAt: serverTimestamp(),
        })
      }

      // Get enrollment data for metadata
      const enrollmentRefForMetadata = doc(
        db,
        'students',
        userId,
        'enrollment',
        subCollectionDocId
      )
      const enrollmentDocSnap = await getDoc(enrollmentRefForMetadata)
      let enrollmentDataForMetadata: any = null

      if (enrollmentDocSnap.exists()) {
        enrollmentDataForMetadata = enrollmentDocSnap.data()
      } else {
        // Try top-level enrollment
        const topLevelEnrollmentRef = doc(db, 'enrollments', topLevelDocId)
        const topLevelDocSnap = await getDoc(topLevelEnrollmentRef)
        if (topLevelDocSnap.exists()) {
          const topLevelData = topLevelDocSnap.data()
          enrollmentDataForMetadata = topLevelData?.enrollmentData
        }
      }

      // Build student metadata
      const studentMetadata = await this.buildStudentMetadata(
        userId,
        ayCode,
        enrollmentDataForMetadata,
        level
      )

      // Resolve assigned subjects (use subject assignments if available, fallback to selected subjects)
      const assignedSubjects = await this.resolveAssignedSubjects(
        enrollmentDataForMetadata || { level, selectedSubjects }
      )

      // Create studentGrades subcollection
      const studentGradesRef = collection(
        db,
        'students',
        userId,
        'studentGrades'
      )

      // Get subject details for each assigned subject
      const subjectDetails: {
        [subjectId: string]: {
          subjectName: string
          period1: null
          period2: null
          period3: null
          period4: null
        }
      } = {}

      for (const subjectId of assignedSubjects) {
        try {
          const subject = await SubjectDatabase.getSubject(subjectId)
          if (subject) {
            subjectDetails[subjectId] = {
              subjectName: subject.name,
              period1: null,
              period2: null,
              period3: null,
              period4: null,
            }
          }
        } catch (error) {
          console.warn(`Failed to get details for subject ${subjectId}:`, error)
          // Still include the subject with just the ID as name if we can't fetch details
          subjectDetails[subjectId] = {
            subjectName: subjectId,
            period1: null,
            period2: null,
            period3: null,
            period4: null,
          }
        }
      }

      // Generate grade document ID using new format
      // Use enrollment info if available, otherwise use level/semester params
      let gradeDocId: string
      if (enrollmentDataForId?.enrollmentInfo) {
        gradeDocId = this.generateDocumentId(
          ayCode,
          enrollmentDataForId.enrollmentInfo
        )
      } else if (level && semester) {
        // For college/SHS, generate ID from params (fallback)
        const enrollmentInfoForId: any = { level, semester }
        if (level === 'college') {
          // Would need course/year info, but we don't have it here
          // Use old format as fallback
          gradeDocId = `${ayCode}_${semester}`
        } else {
          // SHS - would need grade/strand, use old format as fallback
          gradeDocId = `${ayCode}_${semester}`
        }
      } else {
        // JHS or legacy - use old format
        gradeDocId = ayCode
      }

      // Create/update the studentGrades document using new format
      const gradesDocRef = doc(studentGradesRef, gradeDocId)
      const gradesDocSnap = await getDoc(gradesDocRef)

      if (gradesDocSnap.exists()) {
        // Update existing document - merge subjects and update metadata
        await updateDoc(gradesDocRef, {
          ...subjectDetails,
          studentName: studentMetadata.studentName,
          studentSection: studentMetadata.studentSection,
          studentLevel: studentMetadata.studentLevel,
          studentSemester: studentMetadata.studentSemester,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new document with metadata
        await setDoc(gradesDocRef, {
          ...subjectDetails,
          studentName: studentMetadata.studentName,
          studentSection: studentMetadata.studentSection,
          studentLevel: studentMetadata.studentLevel,
          studentSemester: studentMetadata.studentSemester,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // Also update the top-level enrollments collection
      const topLevelEnrollmentRef = doc(db, 'enrollments', topLevelDocId)
      const topLevelDoc = await getDoc(topLevelEnrollmentRef)

      if (topLevelDoc.exists()) {
        // Update existing document
        await updateDoc(topLevelEnrollmentRef, {
          'enrollmentData.enrollmentInfo.status': 'enrolled',
          'enrollmentData.enrollmentInfo.enrollmentDate':
            new Date().toISOString(),
          'enrollmentData.enrollmentInfo.orNumber': orNumber || '',
          'enrollmentData.enrollmentInfo.scholarship': scholarship || '',
          'enrollmentData.enrollmentInfo.studentType': studentType || 'regular',
          updatedAt: serverTimestamp(),
        })

        // Update student document with studentId
        if (studentId) {
          const studentRef = doc(db, 'students', userId)
          await updateDoc(studentRef, {
            studentId: studentId,
            updatedAt: serverTimestamp(),
          })
        }
      } else {
        // Create the document if it doesn't exist
        const enrollmentData = {
          userId,
          ayCode,
          enrollmentData: {
            userId,
            personalInfo: {},
            enrollmentInfo: {
              gradeLevel: '',
              schoolYear: ayCode,
              enrollmentDate: new Date().toISOString(),
              status: 'enrolled',
              orNumber: orNumber || '',
              scholarship: scholarship || '',
              studentType: studentType || 'regular',
            },
            documents: {},
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
        // Remove undefined values before saving (Firestore doesn't allow undefined)
        const cleanedTopLevelEnrollmentData =
          this.removeUndefinedValues(enrollmentData)
        await setDoc(topLevelEnrollmentRef, cleanedTopLevelEnrollmentData)
      }

      console.log(
        `  Student ${userId} enrolled successfully in ${ayCode} with ${selectedSubjects.length} subjects`
      )
      return { success: true }
    } catch (error) {
      console.error('Error enrolling student:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Revoke student enrollment - delete subcollections and reset status
  static async revokeEnrollment(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig()
      const ayCode = systemConfig.ayCode

      // Delete the studentGrades document
      const studentGradesRef = doc(
        db,
        'students',
        userId,
        'studentGrades',
        ayCode
      )
      try {
        await deleteDoc(studentGradesRef)
      } catch (error) {
        console.warn(
          `Could not delete studentGrades document (might not exist):`,
          error
        )
      }

      // Reset enrollment status to 'pending' and remove enrollment date
      const enrollmentRef = doc(db, 'students', userId, 'enrollment', ayCode)
      const enrollmentUpdate = {
        'enrollmentInfo.status': 'pending',
        'enrollmentInfo.enrollmentDate': deleteField(), // Remove the enrollment date
        updatedAt: serverTimestamp(),
      }

      await updateDoc(enrollmentRef, enrollmentUpdate)

      // Also update the top-level enrollments collection status
      const topLevelEnrollmentRef = doc(
        db,
        'enrollments',
        `${userId}_${ayCode}`
      )
      const topLevelUpdate = {
        'enrollmentData.enrollmentInfo.status': 'pending',
        'enrollmentData.enrollmentInfo.enrollmentDate': deleteField(), // Remove the enrollment date
        updatedAt: serverTimestamp(),
      }

      await updateDoc(topLevelEnrollmentRef, topLevelUpdate)

      return { success: true }
    } catch (error) {
      console.error('Error revoking enrollment:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Delete enrollment permanently - completely remove enrollment documents
  static async deleteEnrollment(
    userId: string,
    level?: 'college' | 'high-school',
    semester?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig()
      const ayCode = systemConfig.ayCode

      // First, get the enrollment to retrieve the full enrollment info
      // This is necessary to generate the correct document IDs
      const enrollmentResult = await this.getEnrollment(
        userId,
        ayCode,
        semester
      )

      if (!enrollmentResult.success || !enrollmentResult.data) {
        return {
          success: false,
          error: 'Enrollment not found',
        }
      }

      const enrollmentData = enrollmentResult.data
      const enrollmentInfo = enrollmentData.enrollmentInfo || {}

      // Generate document IDs using the same logic as submitEnrollment
      const subCollectionDocId = this.generateDocumentId(ayCode, enrollmentInfo)
      const docId = this.generateEnrollmentDocumentId(
        userId,
        ayCode,
        enrollmentInfo
      )

      // Delete the enrollment document from students subcollection
      const enrollmentRef = doc(
        db,
        'students',
        userId,
        'enrollment',
        subCollectionDocId
      )
      try {
        await deleteDoc(enrollmentRef)
        console.log(
          `  Deleted enrollment document from students subcollection: ${subCollectionDocId}`
        )
      } catch (error) {
        console.warn(
          `Could not delete enrollment document from students subcollection (might not exist):`,
          error
        )
      }

      // Delete the enrollment from top-level enrollments collection
      const topLevelEnrollmentRef = doc(db, 'enrollments', docId)
      try {
        await deleteDoc(topLevelEnrollmentRef)
        console.log(
          `  Deleted enrollment document from top-level collection: ${docId}`
        )
      } catch (error) {
        console.warn(
          `Could not delete top-level enrollment document (might not exist):`,
          error
        )
      }

      console.log('  Enrollment deleted successfully for user:', userId)
      return { success: true }
    } catch (error) {
      console.error('Error deleting enrollment:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Assign section to student enrollment
  static async assignSection(
    userId: string,
    sectionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig()
      const ayCode = systemConfig.ayCode
      const semester =
        systemConfig.semester && systemConfig.semester !== 'None'
          ? systemConfig.semester
          : undefined

      const normalizeSemester = (value?: string) => {
        if (!value) return undefined
        const lower = value.toLowerCase()
        if (lower.includes('first')) return 'first'
        if (lower.includes('second')) return 'second'
        return lower
      }

      // Get current enrollment to check if student is already assigned to a different section
      const currentEnrollment = await this.getEnrollment(
        userId,
        ayCode,
        semester
      )
      let enrollmentInfo = currentEnrollment.data?.enrollmentInfo

      const targetSemester = normalizeSemester(
        enrollmentInfo?.semester || semester
      )

      // Locate the exact enrollment document reference
      let enrollmentDocRef = doc(db, 'students', userId, 'enrollment', ayCode)
      let enrollmentDocSnap = await getDoc(enrollmentDocRef)

      if (!enrollmentDocSnap.exists()) {
        const enrollmentSubcolRef = collection(
          db,
          'students',
          userId,
          'enrollment'
        )
        const enrollmentSubcolSnap = await getDocs(enrollmentSubcolRef)

        for (const docSnap of enrollmentSubcolSnap.docs) {
          const enrollmentData = docSnap.data()
          const docSemester = normalizeSemester(
            enrollmentData.enrollmentInfo?.semester
          )
          const fallbackSemesterFromId = (() => {
            const lowerId = docSnap.id.toLowerCase()
            if (lowerId.includes('first')) return 'first'
            if (lowerId.includes('second')) return 'second'
            return undefined
          })()
          const semesterMatches =
            !targetSemester ||
            docSemester === targetSemester ||
            fallbackSemesterFromId === targetSemester
          const ayMatches =
            enrollmentData.enrollmentInfo?.schoolYear === ayCode ||
            docSnap.id.includes(ayCode)

          if (ayMatches && semesterMatches) {
            enrollmentDocRef = docSnap.ref
            enrollmentDocSnap = docSnap
            enrollmentInfo = enrollmentData.enrollmentInfo
            break
          }

          // Keep fallback to first document in case we don't find exact match
        }

        if (!enrollmentDocSnap.exists() && enrollmentSubcolSnap.docs.length) {
          const fallbackDoc = enrollmentSubcolSnap.docs[0]
          enrollmentDocRef = fallbackDoc.ref
          enrollmentDocSnap = fallbackDoc
          enrollmentInfo = fallbackDoc.data().enrollmentInfo
        }
      }

      if (!enrollmentDocSnap.exists()) {
        return {
          success: false,
          error: `Enrollment document not found for student in academic year ${ayCode}. Please ensure the student is properly enrolled.`,
        }
      }

      const currentSectionId = enrollmentInfo?.sectionId

      // If student is currently assigned to a different section, remove them from that section's students array
      if (currentSectionId && currentSectionId !== sectionId) {
        const oldSectionRef = doc(db, 'sections', currentSectionId)
        const oldSectionUpdate = {
          students: arrayRemove(userId),
          updatedAt: serverTimestamp(),
        }
        await updateDoc(oldSectionRef, oldSectionUpdate)
        console.log(
          `  Removed student ${userId} from old section ${currentSectionId}`
        )
      }

      // Update the enrollment document with section assignment
      const enrollmentUpdate = {
        'enrollmentInfo.sectionId': sectionId,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(enrollmentDocRef, enrollmentUpdate)

      // Also update the top-level enrollments collection
      // Check multiple possible document ID formats
      const possibleDocIds = [
        `${userId}_${ayCode}`,
        ...(enrollmentInfo?.semester
          ? [`${userId}_${ayCode}_${enrollmentInfo.semester}`]
          : []),
        `${userId}_${enrollmentDocSnap.id}`,
      ]

      for (const docId of possibleDocIds) {
        const topLevelEnrollmentRef = doc(db, 'enrollments', docId)
        const topLevelDoc = await getDoc(topLevelEnrollmentRef)

        if (topLevelDoc.exists()) {
          const topLevelUpdate = {
            'enrollmentData.enrollmentInfo.sectionId': sectionId,
            updatedAt: serverTimestamp(),
          }
          await updateDoc(topLevelEnrollmentRef, topLevelUpdate)
          break // Found and updated, no need to check other formats
        }
      }

      // Add student to new section's students array
      const sectionRef = doc(db, 'sections', sectionId)
      const sectionUpdate = {
        students: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(sectionRef, sectionUpdate)

      // Update studentGrades document with new section name
      try {
        const section = await SectionDatabase.getSection(sectionId)
        if (section) {
          const studentGradesRef = doc(
            db,
            'students',
            userId,
            'studentGrades',
            ayCode
          )
          const gradesDocSnap = await getDoc(studentGradesRef)

          if (gradesDocSnap.exists()) {
            await updateDoc(studentGradesRef, {
              studentSection: section.sectionName,
              updatedAt: serverTimestamp(),
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to update studentGrades with section name:`, error)
      }

      console.log(
        `  Section ${sectionId} assigned to student ${userId} in ${ayCode}`
      )
      return { success: true }
    } catch (error) {
      console.error('Error assigning section:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Unassign section from student enrollment
  static async unassignSection(
    userId: string,
    sectionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig()
      const ayCode = systemConfig.ayCode

      // Update the enrollment document to remove section assignment
      const enrollmentRef = doc(db, 'students', userId, 'enrollment', ayCode)
      const enrollmentUpdate = {
        'enrollmentInfo.sectionId': deleteField(),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(enrollmentRef, enrollmentUpdate)

      // Also update the top-level enrollments collection
      const topLevelEnrollmentRef = doc(
        db,
        'enrollments',
        `${userId}_${ayCode}`
      )
      const topLevelUpdate = {
        'enrollmentData.enrollmentInfo.sectionId': deleteField(),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(topLevelEnrollmentRef, topLevelUpdate)

      // Remove student from section's students array
      const sectionRef = doc(db, 'sections', sectionId)
      const sectionUpdate = {
        students: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(sectionRef, sectionUpdate)

      // Update studentGrades document to clear section name
      try {
        const studentGradesRef = doc(
          db,
          'students',
          userId,
          'studentGrades',
          ayCode
        )
        const gradesDocSnap = await getDoc(studentGradesRef)

        if (gradesDocSnap.exists()) {
          await updateDoc(studentGradesRef, {
            studentSection: '',
            updatedAt: serverTimestamp(),
          })
        }
      } catch (error) {
        console.warn(
          `Failed to update studentGrades to clear section name:`,
          error
        )
      }

      console.log(
        `  Section ${sectionId} unassigned from student ${userId} in ${ayCode}`
      )
      return { success: true }
    } catch (error) {
      console.error('Error unassigning section:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Get the latest student ID from config
  static async getLatestStudentId(): Promise<{
    success: boolean
    latestId?: string
    error?: string
  }> {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'system'))

      if (!configDoc.exists()) {
        return {
          success: false,
          error: 'System configuration not found',
        }
      }

      const configData = configDoc.data() || {}
      const latestId = configData.latestId

      if (!latestId) {
        return {
          success: false,
          error: 'latestId field not found in system configuration',
        }
      }

      return {
        success: true,
        latestId: latestId as string,
      }
    } catch (error) {
      console.error('Error fetching latest student ID:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Update the latest student ID in config
  static async updateLatestStudentId(
    newLatestId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const configRef = doc(db, 'config', 'system')
      await updateDoc(configRef, {
        latestId: newLatestId,
        updatedAt: serverTimestamp(),
      })

      console.log(`  Latest student ID updated to: ${newLatestId}`)
      return { success: true }
    } catch (error) {
      console.error('Error updating latest student ID:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Resolve assigned subjects for a student based on enrollment info and subject assignments
  private static async resolveAssignedSubjects(
    enrollmentInfo: any
  ): Promise<string[]> {
    if (!enrollmentInfo) return []

    if (enrollmentInfo.level === 'college') {
      // For college students, check if there are subject assignments
      const subjectAssignmentsRef = collection(db, 'subject-assignments')
      const q = query(
        subjectAssignmentsRef,
        where('level', '==', 'college'),
        where('courseCode', '==', enrollmentInfo.courseCode),
        where('yearLevel', '==', parseInt(enrollmentInfo.yearLevel || '1')),
        where('semester', '==', enrollmentInfo.semester)
      )

      const assignmentSnapshot = await getDocs(q)
      if (!assignmentSnapshot.empty) {
        const assignment = assignmentSnapshot.docs[0].data()
        const subjectSetsRef = collection(db, 'subject-sets')
        const subjectSetDoc = await getDoc(
          doc(subjectSetsRef, assignment.subjectSetId)
        )

        if (subjectSetDoc.exists()) {
          const subjectSet = subjectSetDoc.data()
          return subjectSet?.subjects || []
        }
      }
    } else {
      // For high school students
      const gradeLevel = parseInt(enrollmentInfo.gradeLevel || '0')
      if (gradeLevel > 0) {
        const subjectAssignmentsRef = collection(db, 'subject-assignments')
        const q = query(
          subjectAssignmentsRef,
          where('level', '==', 'high-school'),
          where('gradeLevel', '==', gradeLevel)
        )

        const assignmentSnapshot = await getDocs(q)
        if (!assignmentSnapshot.empty) {
          const assignment = assignmentSnapshot.docs[0].data()
          const subjectSetsRef = collection(db, 'subject-sets')
          const subjectSetDoc = await getDoc(
            doc(subjectSetsRef, assignment.subjectSetId)
          )

          if (subjectSetDoc.exists()) {
            const subjectSet = subjectSetDoc.data()
            return subjectSet?.subjects || []
          }
        }
      }
    }

    // Fallback: return selected subjects if no assignments found
    return enrollmentInfo.selectedSubjects || []
  }

  // Update grades document when subject assignments change
  static async updateGradesForSubjectAssignmentChange(
    level: 'college' | 'high-school',
    courseCode?: string,
    gradeLevel?: number,
    yearLevel?: number,
    semester?: 'first-sem' | 'second-sem',
    ayCode?: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Get current academic year if not provided
      const systemConfig = await this.getSystemConfig()
      const targetAyCode = ayCode || systemConfig.ayCode

      // Find all students that match the criteria
      const studentsQuery = query(collection(db, 'students'))
      const studentsSnapshot = await getDocs(studentsQuery)

      let updatedCount = 0
      const errors: string[] = []

      for (const studentDoc of studentsSnapshot.docs) {
        const userId = studentDoc.id

        try {
          // Get enrollment data for this student
          const enrollmentResult = await this.getEnrollment(
            userId,
            targetAyCode
          )
          if (!enrollmentResult.success || !enrollmentResult.data) continue

          const enrollmentData = enrollmentResult.data

          // Check if this student matches the criteria
          let matchesCriteria = false
          if (
            level === 'college' &&
            enrollmentData.enrollmentInfo?.level === 'college'
          ) {
            if (
              courseCode &&
              enrollmentData.enrollmentInfo.courseCode === courseCode &&
              yearLevel &&
              parseInt(enrollmentData.enrollmentInfo.yearLevel || '1') ===
                yearLevel &&
              semester &&
              enrollmentData.enrollmentInfo.semester === semester
            ) {
              matchesCriteria = true
            }
          } else if (
            level === 'high-school' &&
            enrollmentData.enrollmentInfo?.level === 'high-school'
          ) {
            if (
              gradeLevel &&
              parseInt(enrollmentData.enrollmentInfo.gradeLevel || '0') ===
                gradeLevel
            ) {
              matchesCriteria = true
            }
          }

          if (matchesCriteria) {
            // Get the new assigned subjects
            const assignedSubjects = await this.resolveAssignedSubjects(
              enrollmentData.enrollmentInfo
            )

            // Get current grades document
            const gradesRef = doc(
              db,
              'students',
              userId,
              'studentGrades',
              targetAyCode
            )
            const gradesSnap = await getDoc(gradesRef)

            if (gradesSnap.exists()) {
              const currentGrades = gradesSnap.data()
              const currentSubjectIds = Object.keys(currentGrades).filter(
                (key) => !METADATA_FIELDS.has(key)
              )

              // Find subjects to add and remove
              const subjectsToAdd = assignedSubjects.filter(
                (id) => !currentSubjectIds.includes(id)
              )
              const subjectsToRemove = currentSubjectIds.filter(
                (id) => !assignedSubjects.includes(id)
              )

              // Add new subjects
              const updateData: any = {}
              for (const subjectId of subjectsToAdd) {
                try {
                  const subject = await SubjectDatabase.getSubject(subjectId)
                  if (subject) {
                    updateData[subjectId] = {
                      subjectName: subject.name,
                      period1: null,
                      period2: null,
                      period3: null,
                      period4: null,
                    }
                  }
                } catch (error) {
                  console.warn(
                    `Failed to get details for subject ${subjectId}:`,
                    error
                  )
                }
              }

              // Remove old subjects
              for (const subjectId of subjectsToRemove) {
                updateData[subjectId] = deleteField()
              }

              if (Object.keys(updateData).length > 0) {
                updateData.updatedAt = serverTimestamp()
                await updateDoc(gradesRef, updateData)
                updatedCount++
              }
            }
          }
        } catch (error) {
          const errorMsg = `Failed to update grades for student ${userId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      return {
        success: true,
        message: `Updated grades for ${updatedCount} students. ${
          errors.length > 0 ? `Errors: ${errors.join(', ')}` : ''
        }`,
      }
    } catch (error) {
      console.error(
        'Error updating grades for subject assignment change:',
        error
      )
      return {
        success: false,
        message: 'Failed to update grades for subject assignment change',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Test Firebase connection
  static async testConnection(): Promise<{
    success: boolean
    message: string
    error?: string
  }> {
    try {
      // Try to access the config collection
      const configCollection = collection(db, 'config')
      const configQuery = query(configCollection)
      const configSnapshot = await getDocs(configQuery)

      return {
        success: true,
        message: `Firebase connection working. Found ${configSnapshot.size} documents in config collection.`,
      }
    } catch (error) {
      console.error('Firebase connection test failed:', error)
      return {
        success: false,
        message: 'Firebase connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  static async getSubjectsByIds(
    subjectIds: string[]
  ): Promise<{ success: boolean; subjects?: any[]; error?: string }> {
    try {
      if (!subjectIds || subjectIds.length === 0) {
        return { success: true, subjects: [] }
      }

      const subjectsRef = collection(db, 'subjects')
      const subjects: any[] = []

      // Firebase 'in' queries are limited to 10 items, so we need to batch them
      const batchSize = 10
      for (let i = 0; i < subjectIds.length; i += batchSize) {
        const batch = subjectIds.slice(i, i + batchSize)
        const q = query(
          subjectsRef,
          where(
            '__name__',
            'in',
            batch.map((id) => doc(db, 'subjects', id))
          )
        )
        const snapshot = await getDocs(q)

        snapshot.docs.forEach((doc) => {
          subjects.push({
            id: doc.id,
            ...doc.data(),
          })
        })
      }

      return { success: true, subjects }
    } catch (error) {
      console.error('Error fetching subjects by IDs:', error)
      return { success: false, error: 'Failed to fetch subjects' }
    }
  }
}
