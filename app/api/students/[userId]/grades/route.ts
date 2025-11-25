import { NextRequest, NextResponse } from 'next/server'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  collection,
} from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import {
  EnrollmentDatabase,
  getOrDeriveGradeId,
} from '@/lib/enrollment-database'
import { SectionDatabase, GradeDatabase } from '@/lib/grade-section-database'
import { METADATA_FIELDS } from '@/lib/grades-utils'

const deriveBaseAyCode = (docId: string): string => {
  if (!docId) return docId
  const [base] = docId.split('_')
  return base || docId
}

const deriveSemesterFromDocId = (
  docId: string
): 'first-sem' | 'second-sem' | undefined => {
  if (!docId) return undefined
  if (docId.includes('first_semester')) return 'first-sem'
  if (docId.includes('second_semester')) return 'second-sem'
  return undefined
}

// Helper function to refresh student metadata in studentGrades document
async function refreshStudentMetadata(
  userId: string,
  ayCode: string
): Promise<void> {
  try {
    const baseAyCode = deriveBaseAyCode(ayCode)
    const derivedSemester = deriveSemesterFromDocId(ayCode)

    // Get enrollment data - try derived semester first, then fallbacks
    let enrollmentResult = await EnrollmentDatabase.getEnrollment(
      userId,
      baseAyCode,
      derivedSemester
    )

    // If not found and might be college/SHS, try both semesters
    if (!enrollmentResult.success || !enrollmentResult.data) {
      const semestersToTry: ('first-sem' | 'second-sem')[] = [
        'first-sem',
        'second-sem',
      ].filter((sem) => sem !== derivedSemester) as (
        | 'first-sem'
        | 'second-sem'
      )[]

      for (const semester of semestersToTry) {
        enrollmentResult = await EnrollmentDatabase.getEnrollment(
          userId,
          baseAyCode,
          semester
        )
        if (enrollmentResult.success && enrollmentResult.data) {
          break
        }
      }
    }

    // Final fallback: try without semester (JHS or legacy)
    if (!enrollmentResult.success || !enrollmentResult.data) {
      enrollmentResult = await EnrollmentDatabase.getEnrollment(
        userId,
        baseAyCode
      )
    }

    if (!enrollmentResult.success || !enrollmentResult.data) {
      return
    }

    const enrollmentData = enrollmentResult.data
    const enrollmentInfo = enrollmentData.enrollmentInfo || {}
    const level = enrollmentInfo.level

    // Build studentName
    let studentName = ''
    if (enrollmentData.personalInfo) {
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

    // Build studentSection
    let studentSection = ''
    const sectionId = enrollmentInfo.sectionId
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

    // Build studentLevel and studentSemester
    let studentLevel = ''
    let studentSemester = ''

    if (level === 'college') {
      const courseCode = enrollmentInfo.courseCode || ''
      const yearLevel = enrollmentInfo.yearLevel || ''
      const semester = enrollmentInfo.semester || ''

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
      const gradeLevel = enrollmentInfo.gradeLevel || ''
      // Use backward compatible utility to get or derive gradeId
      const gradeId = getOrDeriveGradeId(enrollmentInfo)
      let strand = ''

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

      if (gradeLevel) {
        studentLevel = `Grade ${gradeLevel}${strand ? ` ${strand}` : ''}`
      }
      studentSemester = ''
    }

    // Build official student id if available
    const rawStudentId = enrollmentInfo?.studentId
    const studentOfficialId =
      typeof rawStudentId === 'string'
        ? rawStudentId.trim()
        : typeof rawStudentId === 'number'
        ? String(rawStudentId).trim()
        : ''

    // Update studentGrades document with metadata
    const studentGradesRef = doc(
      db,
      'students',
      userId,
      'studentGrades',
      ayCode
    )
    const gradesDocSnap = await getDoc(studentGradesRef)

    if (gradesDocSnap.exists()) {
      const updatePayload: Record<string, any> = {
        studentName,
        studentSection,
        studentLevel,
        studentSemester,
        updatedAt: serverTimestamp(),
      }

      if (studentOfficialId) {
        updatePayload.studentOfficialId = studentOfficialId
      }

      await updateDoc(studentGradesRef, updatePayload)
    }
  } catch (error) {
    console.warn(`Failed to refresh student metadata:`, error)
  }
}

// GET /api/students/[userId]/grades - Get student grades for a specific AY or batch grades for multiple students
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userIds = searchParams.get('userIds') // For batch requests
    const listPeriods = searchParams.get('listPeriods') === 'true'
    const explicitAyCode = searchParams.get('ayCode') || undefined
    const includeMetadata = searchParams.get('includeMetadata') === 'true'

    // Get current academic year from system config
    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const ayCode = systemConfig.ayCode

    const { userId } = await params

    // Handle batch grade requests
    if (userIds && userId === 'batch') {
      const userIdArray = userIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id)

      const gradePromises = userIdArray.map(async (studentId) => {
        try {
          const gradesRef = doc(
            db,
            'students',
            studentId,
            'studentGrades',
            ayCode
          )
          const gradesSnap = await getDoc(gradesRef)

          if (!gradesSnap.exists()) {
            return { userId: studentId, grades: {} }
          }

          const gradesData = gradesSnap.data()
          // Exclude metadata fields from grades response
          const {
            createdAt,
            updatedAt,
            studentName,
            studentSection,
            studentLevel,
            studentSemester,
            ...grades
          } = gradesData

          return { userId: studentId, grades }
        } catch (error) {
          console.error(`Error fetching grades for user ${studentId}:`, error)
          return { userId: studentId, grades: {} }
        }
      })

      const gradeResults = await Promise.all(gradePromises)

      return NextResponse.json({
        success: true,
        batchGrades: gradeResults,
        count: gradeResults.length,
      })
    }

    // Handle list of all grade periods/documents for a single student
    if (listPeriods) {
      const subcolRef = collection(db, 'students', userId, 'studentGrades')
      const snap = await getDocs(subcolRef)
      const periods = snap.docs.map((d) => ({
        id: d.id,
        label: d.id,
        ayCode: d.id,
      }))
      // Sort newest first by ID string (assumes AY format comparable lexicographically)
      periods.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
      return NextResponse.json({ periods, count: periods.length })
    }

    // Handle single student grades request

    // Prefer explicit ayCode from query if provided, otherwise system config
    const targetAyCode = explicitAyCode || ayCode

    // Get student grades for the specified AY
    const gradesRef = doc(db, 'students', userId, 'studentGrades', targetAyCode)
    const gradesSnap = await getDoc(gradesRef)

    if (!gradesSnap.exists()) {
      return NextResponse.json({
        grades: {},
        message: 'No grades found for this academic year',
      })
    }

    const gradesData = gradesSnap.data()

    // Remove metadata fields from grades response
    const {
      createdAt,
      updatedAt,
      studentName,
      studentSection,
      studentLevel,
      studentSemester,
      studentOfficialId,
      ...grades
    } = gradesData
    const metadata: Record<string, any> = {}

    if (studentName !== undefined) metadata.studentName = studentName
    if (studentSection !== undefined) metadata.studentSection = studentSection
    if (studentLevel !== undefined) metadata.studentLevel = studentLevel
    if (studentSemester !== undefined)
      metadata.studentSemester = studentSemester
    if (studentOfficialId !== undefined)
      metadata.studentOfficialId = studentOfficialId

    if (metadata.studentOfficialId === undefined) {
      try {
        await refreshStudentMetadata(userId, targetAyCode)
        const refreshedSnap = await getDoc(gradesRef)
        if (refreshedSnap.exists()) {
          const refreshedData = refreshedSnap.data()
          if (refreshedData.studentOfficialId !== undefined) {
            metadata.studentOfficialId = refreshedData.studentOfficialId
          }
        }
      } catch (error) {
        console.warn('Failed to refresh student official ID metadata:', error)
      }
    }

    if (includeMetadata) {
      return NextResponse.json({ grades, ayCode: targetAyCode, metadata })
    }

    return NextResponse.json({ grades, ayCode: targetAyCode })
  } catch (error) {
    console.error('Error fetching student grades:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch student grades'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PUT /api/students/[userId]/grades - Update student grades
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { grades } = await request.json()

    if (!grades || typeof grades !== 'object') {
      return NextResponse.json(
        { error: 'Grades data is required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const explicitAyCode = searchParams.get('ayCode') || undefined

    // Get current academic year from system config
    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const defaultAyCode = systemConfig.ayCode

    const { userId } = await params

    // Determine target AY
    const targetAyCode = explicitAyCode || defaultAyCode

    // Update student grades
    const gradesRef = doc(db, 'students', userId, 'studentGrades', targetAyCode)

    // Prepare update data
    const updateData = {
      ...grades,
      updatedAt: serverTimestamp(),
    }

    // Check if document exists first
    const gradesSnap = await getDoc(gradesRef)

    if (gradesSnap.exists()) {
      // Update existing document
      await updateDoc(gradesRef, updateData)
    } else {
      // Create new document
      await setDoc(gradesRef, {
        ...updateData,
        createdAt: serverTimestamp(),
      })
    }

    // Refresh student metadata to ensure it's up-to-date
    await refreshStudentMetadata(userId, targetAyCode)

    console.log(`  Updated grades for student ${userId} in AY ${targetAyCode}`)

    return NextResponse.json({
      success: true,
      message: 'Grades updated successfully',
    })
  } catch (error) {
    console.error('Error updating student grades:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update student grades'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/students/[userId]/grades - Create a brand new grade document (e.g., transferee record)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { ayCode, grades } = await request.json()

    if (!ayCode || typeof ayCode !== 'string') {
      return NextResponse.json(
        { error: 'Academic year code is required.' },
        { status: 400 }
      )
    }

    if (!grades || typeof grades !== 'object') {
      return NextResponse.json(
        { error: 'Grades payload is required.' },
        { status: 400 }
      )
    }

    const sanitizedAyCode = ayCode.trim()

    if (!sanitizedAyCode) {
      return NextResponse.json(
        { error: 'Academic year code cannot be empty.' },
        { status: 400 }
      )
    }

    const subjectEntries = Object.entries(grades).filter(
      ([key]) => !METADATA_FIELDS.has(key)
    )

    if (!subjectEntries.length) {
      return NextResponse.json(
        { error: 'At least one subject entry is required.' },
        { status: 400 }
      )
    }

    const { userId } = await params
    const targetRef = doc(
      db,
      'students',
      userId,
      'studentGrades',
      sanitizedAyCode
    )
    const existingSnap = await getDoc(targetRef)

    if (existingSnap.exists()) {
      return NextResponse.json(
        { error: 'A grade document for this academic year already exists.' },
        { status: 409 }
      )
    }

    const timestamp = serverTimestamp()

    await setDoc(targetRef, {
      ...grades,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    await refreshStudentMetadata(userId, sanitizedAyCode)

    return NextResponse.json({
      success: true,
      ayCode: sanitizedAyCode,
      message: 'Grade document created successfully.',
    })
  } catch (error) {
    console.error('Error creating custom grade document:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create grade document'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
