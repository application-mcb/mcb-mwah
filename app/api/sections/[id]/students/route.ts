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
import { EnrollmentDatabase } from '@/lib/enrollment-database'

// GET /api/sections/[id]/students - Get all students enrolled in a specific section for current AY
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
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
      studentLevel: string
      studentSemester: string
    }> = []

    // Query enrollments collection for current AY
    // Note: We filter by sectionId in code to avoid composite index requirements
    const enrollmentsRef = collection(db, 'enrollments')
    const enrollmentsQuery = query(
      enrollmentsRef,
      where('ayCode', '==', ayCode)
    )
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

    console.log(
      `[Section Students API] Querying for sectionId: ${sectionId}, AY: ${ayCode}, Total enrollments: ${enrollmentsSnapshot.docs.length}`
    )

    // Batch fetch all student documents to get studentId and studentName
    const studentIdMap = new Map<string, string>()
    const studentNameMap = new Map<string, string>()
    const userIdsToFetch = new Set<string>()

    // First pass: collect all userIds
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data()
      const userId = enrollmentData?.enrollmentData?.userId
      if (userId) {
        userIdsToFetch.add(userId)
      }
    }

    // Fetch student documents in parallel
    const fetchPromises = Array.from(userIdsToFetch).map(async (userId) => {
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
          `[Section Students API] Failed to fetch student data for ${userId}:`,
          err
        )
      }
    })

    // Wait for all fetches to complete
    await Promise.all(fetchPromises)

    console.log(
      `[Section Students API] Fetched studentIds for ${studentIdMap.size} out of ${userIdsToFetch.size} students`
    )

    // Build the final enrolled students array
    // Filter by sectionId in code
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data()
      const enrollmentInfo = enrollmentData?.enrollmentData
      const userId = enrollmentInfo?.userId

      if (!userId) {
        continue
      }

      // Filter by sectionId
      const enrollmentSectionId = enrollmentInfo?.enrollmentInfo?.sectionId
      if (enrollmentSectionId !== sectionId) {
        continue
      }

      const personalInfo = enrollmentInfo?.personalInfo || {}
      const enrollmentInfoData = enrollmentInfo?.enrollmentInfo || {}

      // Get student name (prefer from student document, fallback to enrollment data)
      const studentName =
        studentNameMap.get(userId) ||
        `${personalInfo.firstName || ''} ${personalInfo.middleName || ''} ${
          personalInfo.lastName || ''
        }`.trim() ||
        ''

      enrolledStudents.push({
        userId,
        studentId: studentIdMap.get(userId),
        studentName: studentName,
        studentSection: sectionId, // Use sectionId directly since we've already filtered by it
        studentLevel: enrollmentInfoData.level || '',
        studentSemester: enrollmentInfoData.semester || '',
      })
    }

    console.log(
      `[Section Students API] Stats - Section ${sectionId}, AY ${ayCode}, Final count: ${enrolledStudents.length}`
    )

    return NextResponse.json({
      success: true,
      sectionId,
      ayCode,
      count: enrolledStudents.length,
      students: enrolledStudents,
    })
  } catch (error) {
    console.error('Error fetching students for section:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch students'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
