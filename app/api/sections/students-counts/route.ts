import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, where } from 'firebase/firestore'
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

// GET /api/sections/students-counts - Get enrollment counts for all sections (current AY)
// This is much more efficient than fetching per-section, as it queries the database once
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
        `[Section Counts API] Returning cached data (age: ${Math.round((now - countsCache.timestamp) / 1000)}s)`
      )
      return NextResponse.json({
        success: true,
        ayCode,
        counts: countsCache.data.counts,
        students: countsCache.data.students,
        cached: true,
      })
    }

    // Section counts: { sectionId: count }
    const sectionCounts: Record<string, number> = {}
    // Section students: { sectionId: Array<student data> }
    const sectionStudents: Record<
      string,
      Array<{
        userId: string
        studentName: string
        studentLevel: string
        studentSemester: string
      }>
    > = {}

    // Query enrollments collection for current AY
    const enrollmentsRef = collection(db, 'enrollments')
    const enrollmentsQuery = query(
      enrollmentsRef,
      where('ayCode', '==', ayCode)
    )
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

    console.log(
      `[Section Counts API] Querying for AY: ${ayCode}, Total enrollments: ${enrollmentsSnapshot.docs.length}`
    )

    let enrollmentsChecked = 0
    let enrollmentsWithSection = 0

    // Process all enrollments and count students per section
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      enrollmentsChecked++
      const enrollmentData = enrollmentDoc.data()

      // Get sectionId from enrollmentData.enrollmentInfo.sectionId
      const sectionId =
        enrollmentData?.enrollmentData?.enrollmentInfo?.sectionId

      // Skip if no sectionId
      if (!sectionId) {
        continue
      }

      enrollmentsWithSection++

      // Initialize count for this section if not exists
      if (!sectionCounts[sectionId]) {
        sectionCounts[sectionId] = 0
        sectionStudents[sectionId] = []
      }

      // Increment count
      sectionCounts[sectionId]++

      // Extract student info
      const userId = enrollmentData?.enrollmentData?.userId || ''
      const personalInfo = enrollmentData?.enrollmentData?.personalInfo || {}
      const studentName = `${personalInfo.firstName || ''} ${personalInfo.middleName || ''} ${personalInfo.lastName || ''}`.trim()
      const enrollmentInfo = enrollmentData?.enrollmentData?.enrollmentInfo || {}
      const studentLevel = enrollmentInfo.level || ''
      const studentSemester = enrollmentInfo.semester || ''

      // Add student info
      sectionStudents[sectionId].push({
        userId,
        studentName,
        studentLevel,
        studentSemester,
      })
    }

    console.log(
      `[Section Counts API] Stats - Checked: ${enrollmentsChecked}, With section: ${enrollmentsWithSection}, Sections found: ${Object.keys(sectionCounts).length}`
    )

    // Update cache
    countsCache = {
      data: { counts: sectionCounts, students: sectionStudents },
      ayCode,
      timestamp: Date.now(),
    }

    // Set cache headers for client-side caching (5 minutes)
    const response = NextResponse.json({
      success: true,
      ayCode,
      counts: sectionCounts,
      students: sectionStudents,
      cached: false,
    })

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )

    return response
  } catch (error) {
    console.error('Error fetching section enrollment counts:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch section enrollment counts'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

