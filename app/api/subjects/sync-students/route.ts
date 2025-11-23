import { NextRequest, NextResponse } from 'next/server'
import {
  collectionGroup,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import { EnrollmentDatabase } from '@/lib/enrollment-database'
import { SubjectDatabase } from '@/lib/subject-database'

// POST /api/subjects/sync-students - Sync enrolled students data into subject documents
// This is a one-time/periodic sync that denormalizes student enrollment data
export async function POST(request: NextRequest) {
  try {
    // Get current academic year
    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const ayCode = systemConfig.ayCode

    console.log(`[Sync Students] Starting sync for AY: ${ayCode}`)

    // First, get all subjects
    const subjectsSnapshot = await SubjectDatabase.getAllSubjects()
    const allSubjects = subjectsSnapshot.map((s) => s as any)

    console.log(`[Sync Students] Found ${allSubjects.length} subjects`)

    // Initialize counts for all subjects
    const subjectStudentsMap: Record<
      string,
      Array<{
        userId: string
        studentId?: string
        studentName: string
        studentSection: string
        studentLevel: string
        studentSemester: string
      }>
    > = {}

    // Initialize all subjects with empty arrays
    allSubjects.forEach((subject) => {
      subjectStudentsMap[subject.id] = []
    })

    // Use collectionGroup to query all studentGrades subcollections at once
    const studentGradesRef = collectionGroup(db, 'studentGrades')
    const allGradesSnapshot = await getDocs(studentGradesRef)

    console.log(
      `[Sync Students] Querying ${allGradesSnapshot.docs.length} studentGrades documents`
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
    let studentsAdded = 0

    // Process all studentGrades documents
    for (const gradesDoc of allGradesSnapshot.docs) {
      docsChecked++

      // Document ID should start with the AY code
      if (!gradesDoc.id.startsWith(ayCode)) {
        continue
      }

      docsWithAY++
      const gradesData = gradesDoc.data()

      // Extract userId from the document path: students/{userId}/studentGrades/{docId}
      const pathParts = gradesDoc.ref.path.split('/')
      const userId = pathParts[1] // students/{userId}/studentGrades/{docId}

      // Fetch student document to get studentId
      let studentId: string | undefined
      try {
        const studentDocRef = doc(db, 'students', userId)
        const studentDoc = await getDoc(studentDocRef)
        if (studentDoc.exists()) {
          studentId = studentDoc.data()?.studentId
        }
      } catch (err) {
        console.warn(
          `[Sync Students] Failed to fetch studentId for ${userId}:`,
          err
        )
      }

      // Extract metadata
      const studentName = gradesData.studentName || ''
      const studentSection = gradesData.studentSection || ''
      const studentLevel = gradesData.studentLevel || ''
      const studentSemester = gradesData.studentSemester || ''

      // Iterate through all keys in the document to find subject IDs
      for (const key in gradesData) {
        // Skip metadata fields
        if (metadataFields.has(key)) {
          continue
        }

        const subjectData = gradesData[key]

        // Verify it's actually a subject object (has subjectName property)
        if (
          subjectData &&
          typeof subjectData === 'object' &&
          'subjectName' in subjectData
        ) {
          // Add student info to this subject
          if (subjectStudentsMap[key]) {
            subjectStudentsMap[key].push({
              userId,
              studentId,
              studentName,
              studentSection,
              studentLevel,
              studentSemester,
            })
            studentsAdded++
          } else {
            // Subject not found in our list (might be deleted)
            console.warn(
              `[Sync Students] Found enrollment for unknown subject: ${key}`
            )
          }
        }
      }
    }

    console.log(
      `[Sync Students] Processed ${docsChecked} docs, ${docsWithAY} with AY ${ayCode}, added ${studentsAdded} student records`
    )

    // Update all subject documents with enrolled students data
    const updatePromises: Promise<void>[] = []
    let subjectsUpdated = 0
    let subjectsSkipped = 0

    for (const subject of allSubjects) {
      const students = subjectStudentsMap[subject.id] || []

      // Update subject document with enrolledStudents field
      const subjectRef = doc(db, 'subjects', subject.id)

      updatePromises.push(
        updateDoc(subjectRef, {
          enrolledStudents: students,
          enrolledStudentsCount: students.length,
          enrolledStudentsLastSynced: new Date().toISOString(),
        })
          .then(() => {
            subjectsUpdated++
            if (subjectsUpdated % 10 === 0) {
              console.log(
                `[Sync Students] Updated ${subjectsUpdated}/${allSubjects.length} subjects...`
              )
            }
          })
          .catch((error) => {
            console.error(
              `[Sync Students] Error updating subject ${subject.id}:`,
              error
            )
            subjectsSkipped++
          })
      )
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises)

    console.log(
      `[Sync Students] Complete! Updated: ${subjectsUpdated}, Skipped: ${subjectsSkipped}`
    )

    return NextResponse.json({
      success: true,
      ayCode,
      stats: {
        subjectsProcessed: allSubjects.length,
        subjectsUpdated,
        subjectsSkipped,
        totalStudentRecords: studentsAdded,
        docsChecked,
        docsWithAY,
      },
    })
  } catch (error) {
    console.error('Error syncing students to subjects:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to sync students to subjects'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
