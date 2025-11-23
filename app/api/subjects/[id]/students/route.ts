import { NextRequest, NextResponse } from 'next/server'
import {
  collectionGroup,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import { EnrollmentDatabase } from '@/lib/enrollment-database'

// GET /api/subjects/[id]/students - Get all students enrolled in a specific subject for current AY
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
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

    // Use collectionGroup to query all studentGrades subcollections at once
    // This is much more efficient than fetching all students first
    const studentGradesRef = collectionGroup(db, 'studentGrades')

    // Query for documents where the document ID starts with the current AY
    // Document IDs can be: AY2526 (JHS) or AY2526_first_semester_BSIT_1 (college/SHS)
    const allGradesSnapshot = await getDocs(studentGradesRef)

    console.log(
      `[Subject Students API] Querying for subjectId: ${subjectId}, AY: ${ayCode}, Total docs: ${allGradesSnapshot.docs.length}`
    )

    // Metadata fields that should be excluded when checking for subjects
    const metadataFields = new Set([
      'studentName',
      'studentSection',
      'studentLevel',
      'studentSemester',
      'createdAt',
      'updatedAt',
    ])

    let docsChecked = 0
    let docsWithAY = 0
    let docsWithSubject = 0

    // First pass: collect all userIds that have this subject
    const userIdsToFetch = new Set<string>()
    const studentDataMap = new Map<
      string,
      {
        studentName: string
        studentSection: string
        studentLevel: string
        studentSemester: string
      }
    >()

    // Filter for current AY and check if subject exists
    for (const gradesDoc of allGradesSnapshot.docs) {
      docsChecked++

      // Document ID should start with the AY code (handles both simple and complex formats)
      // Format examples: "AY2526" or "AY2526_first_semester_BSIT_1"
      if (!gradesDoc.id.startsWith(ayCode)) {
        continue
      }

      docsWithAY++
      const gradesData = gradesDoc.data()

      // Debug: Log document structure for first few matching AY docs
      if (docsWithAY <= 3) {
        const allKeys = Object.keys(gradesData)
        const subjectKeys = allKeys.filter((k) => !metadataFields.has(k))
        console.log(
          `[Subject Students API] Sample doc ID: ${gradesDoc.id}, Path: ${
            gradesDoc.ref.path
          }, Subject keys found: ${subjectKeys.slice(0, 5).join(', ')}`
        )
      }

      // Check if this subject exists in the student's grades
      // Subject IDs are stored as keys in the document (not in metadata fields)
      // The value should be an object with subjectName, period1, etc.
      if (gradesData[subjectId] && !metadataFields.has(subjectId)) {
        docsWithSubject++
        const subjectData = gradesData[subjectId]

        // Verify it's actually a subject object (has subjectName property)
        if (
          subjectData &&
          typeof subjectData === 'object' &&
          'subjectName' in subjectData
        ) {
          // Extract userId from the document path: students/{userId}/studentGrades/{docId}
          const pathParts = gradesDoc.ref.path.split('/')
          const userId = pathParts[1] // students/{userId}/studentGrades/{docId}

          userIdsToFetch.add(userId)
          studentDataMap.set(userId, {
            studentName: gradesData.studentName || '',
            studentSection: gradesData.studentSection || '',
            studentLevel: gradesData.studentLevel || '',
            studentSemester: gradesData.studentSemester || '',
          })
        } else {
          console.warn(
            `[Subject Students API] Subject ${subjectId} found but invalid format in doc ${gradesDoc.id}:`,
            typeof subjectData,
            subjectData
          )
        }
      }
    }

    // Batch fetch all student documents to get studentId and studentName
    const studentIdMap = new Map<string, string>()
    const studentNameMap = new Map<string, string>()
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
          } else {
            console.warn(
              `[Subject Students API] Student ${userId} exists but has no valid studentId field. Data:`,
              { studentId, hasStudentId: 'studentId' in (data || {}) }
            )
          }

          // Get studentName from firstName and lastName if not in grades data
          const existingName = studentDataMap.get(userId)?.studentName
          if (!existingName || existingName.trim() === '') {
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
        } else {
          console.warn(
            `[Subject Students API] Student document not found for userId: ${userId}`
          )
        }
      } catch (err) {
        console.error(
          `[Subject Students API] Failed to fetch student data for ${userId}:`,
          err
        )
      }
    })

    // Wait for all fetches to complete
    await Promise.all(fetchPromises)

    console.log(
      `[Subject Students API] Fetched studentIds for ${studentIdMap.size} out of ${userIdsToFetch.size} students`
    )

    // Build the final enrolled students array
    for (const userId of userIdsToFetch) {
      const studentData = studentDataMap.get(userId)
      if (studentData) {
        // Use name from student document if grades data doesn't have it
        const studentName =
          studentData.studentName?.trim() || studentNameMap.get(userId) || ''

        enrolledStudents.push({
          userId,
          studentId: studentIdMap.get(userId),
          studentName: studentName,
          studentSection: studentData.studentSection,
          studentLevel: studentData.studentLevel,
          studentSemester: studentData.studentSemester,
        })
      }
    }

    console.log(
      `[Subject Students API] Stats - Checked: ${docsChecked}, With AY ${ayCode}: ${docsWithAY}, With subject ${subjectId}: ${docsWithSubject}, Final count: ${enrolledStudents.length}`
    )

    return NextResponse.json({
      success: true,
      subjectId,
      ayCode,
      count: enrolledStudents.length,
      students: enrolledStudents,
    })
  } catch (error) {
    console.error('Error fetching students for subject:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch students'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
