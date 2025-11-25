import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import {
  EnrollmentDatabase,
  getOrDeriveGradeId,
} from '@/lib/enrollment-database'

// GET /api/grades/[id]/students - Get all students enrolled in a specific grade level for current AY
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gradeId } = await params

    if (!gradeId) {
      return NextResponse.json(
        { error: 'Grade ID is required' },
        { status: 400 }
      )
    }

    // Get current academic year
    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const ayCode = systemConfig.ayCode

    const enrolledStudents: Array<{
      userId: string
      studentId?: string
      studentName: string
      studentSection: string
    }> = []

    // Query enrollments collection for current AY
    // Note: We filter by gradeId in code to avoid composite index requirements
    const enrollmentsRef = collection(db, 'enrollments')
    const enrollmentsQuery = query(
      enrollmentsRef,
      where('ayCode', '==', ayCode)
    )
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

    console.log(
      `[Grade Students API] Querying for gradeId: ${gradeId}, AY: ${ayCode}, Total enrollments: ${enrollmentsSnapshot.docs.length}`
    )

    // Batch fetch all student documents to get studentId and studentName
    const studentIdMap = new Map<string, string>()
    const studentNameMap = new Map<string, string>()
    const userIdsToFetch = new Set<string>()

    // Collect section IDs to fetch section names
    const sectionIdsToFetch = new Set<string>()
    const sectionNameMap = new Map<string, string>()

    // First pass: collect all userIds and sectionIds (only for enrolled students)
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data()
      const enrollmentInfo = enrollmentData?.enrollmentData?.enrollmentInfo
      const userId = enrollmentData?.enrollmentData?.userId

      // Check if this enrollment matches the gradeId
      const enrollmentGradeId = getOrDeriveGradeId(enrollmentInfo)
      if (enrollmentGradeId !== gradeId) {
        continue
      }

      // Filter by enrollment status - only include enrolled students
      const enrollmentStatus = enrollmentInfo?.status
      if (enrollmentStatus !== 'enrolled') {
        continue
      }

      if (userId) {
        userIdsToFetch.add(userId)
      }

      const sectionId = enrollmentInfo?.sectionId
      if (sectionId) {
        sectionIdsToFetch.add(sectionId)
      }
    }

    // Fetch student documents in parallel
    const fetchStudentPromises = Array.from(userIdsToFetch).map(
      async (userId) => {
        try {
          const studentDocRef = doc(db, 'students', userId)
          const studentDoc = await getDoc(studentDocRef)
          if (studentDoc.exists()) {
            const data = studentDoc.data()

            // Get studentId
            const studentId = data?.studentId
            if (
              studentId &&
              typeof studentId === 'string' &&
              studentId.trim() !== ''
            ) {
              studentIdMap.set(userId, studentId.trim())
            }

            // Get studentName from firstName and lastName
            const firstName = data?.firstName || ''
            const middleName = data?.middleName || ''
            const lastName = data?.lastName || ''
            const nameExtension = data?.nameExtension || ''

            const fullName = [firstName, middleName, lastName, nameExtension]
              .filter(Boolean)
              .join(' ')
              .trim()

            if (fullName) {
              studentNameMap.set(userId, fullName)
            }
          }
        } catch (err) {
          console.error(
            `[Grade Students API] Failed to fetch student data for ${userId}:`,
            err
          )
        }
      }
    )

    // Fetch section documents in parallel to get section names
    const fetchSectionPromises = Array.from(sectionIdsToFetch).map(
      async (sectionId) => {
        try {
          const sectionDocRef = doc(db, 'sections', sectionId)
          const sectionDoc = await getDoc(sectionDocRef)
          if (sectionDoc.exists()) {
            const data = sectionDoc.data()
            const sectionName = data?.sectionName || sectionId
            sectionNameMap.set(sectionId, sectionName)
          } else {
            // Fallback to sectionId if document doesn't exist
            sectionNameMap.set(sectionId, sectionId)
          }
        } catch (err) {
          console.error(
            `[Grade Students API] Failed to fetch section data for ${sectionId}:`,
            err
          )
          // Fallback to sectionId on error
          sectionNameMap.set(sectionId, sectionId)
        }
      }
    )

    // Wait for all fetches to complete
    await Promise.all([...fetchStudentPromises, ...fetchSectionPromises])

    console.log(
      `[Grade Students API] Fetched studentIds for ${studentIdMap.size} out of ${userIdsToFetch.size} students`
    )
    console.log(
      `[Grade Students API] Fetched section names for ${sectionNameMap.size} sections`
    )

    // Build the final enrolled students array
    // Filter by gradeId in code and deduplicate per student
    const studentEntries = new Map<
      string,
      {
        userId: string
        studentId?: string
        studentName: string
        studentSection: string
      }
    >()

    const pickBetterEntry = (
      currentEntry:
        | {
            userId: string
            studentId?: string
            studentName: string
            studentSection: string
          }
        | undefined,
      candidate: {
        userId: string
        studentId?: string
        studentName: string
        studentSection: string
      }
    ) => {
      if (!currentEntry) {
        return candidate
      }

      const currentHasSection = !!currentEntry.studentSection
      const candidateHasSection = !!candidate.studentSection

      if (!currentHasSection && candidateHasSection) {
        return candidate
      }

      const currentHasId = !!currentEntry.studentId
      const candidateHasId = !!candidate.studentId

      if (!currentHasId && candidateHasId) {
        return candidate
      }

      return currentEntry
    }

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data()
      const enrollmentInfo = enrollmentData?.enrollmentData
      const enrollmentInfoData = enrollmentInfo?.enrollmentInfo || {}
      const userId = enrollmentInfo?.userId

      if (!userId) {
        continue
      }

      // Filter by gradeId
      const enrollmentGradeId = getOrDeriveGradeId(enrollmentInfoData)
      if (enrollmentGradeId !== gradeId) {
        continue
      }

      // Filter by enrollment status - only include enrolled students
      const enrollmentStatus = enrollmentInfoData?.status
      if (enrollmentStatus !== 'enrolled') {
        continue
      }

      const personalInfo = enrollmentInfo?.personalInfo || {}

      // Get student name (prefer from student document, fallback to enrollment data)
      const studentName =
        studentNameMap.get(userId) ||
        `${personalInfo.firstName || ''} ${personalInfo.middleName || ''} ${
          personalInfo.lastName || ''
        }`.trim() ||
        ''

      // Get section name (prefer from section document, fallback to sectionId)
      const sectionId = enrollmentInfoData.sectionId || ''
      const sectionName = sectionId
        ? sectionNameMap.get(sectionId) || sectionId
        : ''

      const candidate = {
        userId,
        studentId: studentIdMap.get(userId),
        studentName: studentName,
        studentSection: sectionName,
      }

      const bestEntry = pickBetterEntry(studentEntries.get(userId), candidate)
      studentEntries.set(userId, bestEntry)
    }

    const dedupedStudents = Array.from(studentEntries.values())

    console.log(
      `[Grade Students API] Stats - Grade ${gradeId}, AY ${ayCode}, Final count: ${dedupedStudents.length}`
    )

    return NextResponse.json({
      success: true,
      gradeId,
      ayCode,
      count: dedupedStudents.length,
      students: dedupedStudents,
    })
  } catch (error) {
    console.error('Error fetching students for grade:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch students'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
