import { NextRequest, NextResponse } from 'next/server'
import { collectionGroup, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import { EnrollmentDatabase } from '@/lib/enrollment-database'

// Cache for counts (in-memory, resets on server restart)
// In production, consider using Redis or similar for distributed caching
let countsCache: {
  data: {
    counts: Record<string, number>
    students: Record<string, any[]>
  }
  ayCode: string
  timestamp: number
} | null = null

const CACHE_TTL = 60000 // 60 seconds cache

// GET /api/subjects/students-counts - Get enrollment counts for all subjects (current AY)
// This is much more efficient than fetching per-subject, as it queries the database once
// Includes server-side caching to avoid repeated database queries
export async function GET(request: NextRequest) {
  try {
    // Get current academic year
    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const ayCode = systemConfig.ayCode

    // Check cache first
    const now = Date.now()
    if (
      countsCache &&
      countsCache.ayCode === ayCode &&
      now - countsCache.timestamp < CACHE_TTL
    ) {
      console.log(
        `[Subject Counts API] Returning cached data (age: ${Math.round((now - countsCache.timestamp) / 1000)}s)`
      )
      return NextResponse.json({
        success: true,
        ayCode,
        counts: countsCache.data.counts,
        students: countsCache.data.students,
        cached: true,
      })
    }

    // Subject counts: { subjectId: count }
    const subjectCounts: Record<string, number> = {}
    // Subject students: { subjectId: Array<student data> }
    const subjectStudents: Record<
      string,
      Array<{
        userId: string
        studentName: string
        studentSection: string
        studentLevel: string
        studentSemester: string
      }>
    > = {}

    // Use collectionGroup to query all studentGrades subcollections at once
    // This is much more efficient than fetching all students first
    const studentGradesRef = collectionGroup(db, 'studentGrades')
    const allGradesSnapshot = await getDocs(studentGradesRef)

    console.log(
      `[Subject Counts API] Querying for AY: ${ayCode}, Total docs: ${allGradesSnapshot.docs.length}`
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

    // Process all documents once and count students per subject
    for (const gradesDoc of allGradesSnapshot.docs) {
      docsChecked++

      // Document ID should start with the AY code (handles both simple and complex formats)
      // Format examples: "AY2526" or "AY2526_first_semester_BSIT_1"
      if (!gradesDoc.id.startsWith(ayCode)) {
        continue
      }

      docsWithAY++
      const gradesData = gradesDoc.data()

      // Extract userId from the document path: students/{userId}/studentGrades/{docId}
      const pathParts = gradesDoc.ref.path.split('/')
      const userId = pathParts[1] // students/{userId}/studentGrades/{docId}

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
          // Initialize count for this subject if not exists
          if (!subjectCounts[key]) {
            subjectCounts[key] = 0
            subjectStudents[key] = []
          }

          // Increment count
          subjectCounts[key]++

          // Add student info
          subjectStudents[key].push({
            userId,
            studentName,
            studentSection,
            studentLevel,
            studentSemester,
          })
        }
      }
    }

    console.log(
      `[Subject Counts API] Stats - Checked: ${docsChecked}, With AY ${ayCode}: ${docsWithAY}, Subjects found: ${Object.keys(subjectCounts).length}`
    )

    // Update cache
    countsCache = {
      data: { counts: subjectCounts, students: subjectStudents },
      ayCode,
      timestamp: Date.now(),
    }

    // Set cache headers for client-side caching (5 minutes)
    const response = NextResponse.json({
      success: true,
      ayCode,
      counts: subjectCounts,
      students: subjectStudents,
      cached: false,
    })

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )

    return response
  } catch (error) {
    console.error('Error fetching subject enrollment counts:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch subject enrollment counts'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

