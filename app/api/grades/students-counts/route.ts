import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import {
  EnrollmentDatabase,
  getOrDeriveGradeId,
} from '@/lib/enrollment-database'

// Cache for counts (in-memory, resets on server restart)
let countsCache: {
  data: Record<string, number>
  ayCode: string
  timestamp: number
} | null = null

const CACHE_TTL = 60000 // 60 seconds cache

// GET /api/grades/students-counts - Get enrollment counts for all grades (current AY)
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
        `[Grade Counts API] Returning cached data (age: ${Math.round(
          (now - countsCache.timestamp) / 1000
        )}s)`
      )
      return NextResponse.json({
        success: true,
        ayCode,
        counts: countsCache.data,
        cached: true,
      })
    }

    // Grade counts: { gradeId: count }
    const gradeCounts: Record<string, number> = {}

    // Query enrollments collection for current AY
    const enrollmentsRef = collection(db, 'enrollments')
    const enrollmentsQuery = query(
      enrollmentsRef,
      where('ayCode', '==', ayCode)
    )
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

    console.log(
      `[Grade Counts API] Querying for AY: ${ayCode}, Total enrollments: ${enrollmentsSnapshot.docs.length}`
    )

    let enrollmentsChecked = 0
    let enrollmentsWithGrade = 0

    // Process all enrollments and count students per grade
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      enrollmentsChecked++
      const enrollmentData = enrollmentDoc.data()
      const enrollmentInfo = enrollmentData?.enrollmentData?.enrollmentInfo

      // Get gradeId using utility function (handles both stored and derived)
      const gradeId = getOrDeriveGradeId(enrollmentInfo)

      // Skip if no gradeId (college students or invalid data)
      if (!gradeId) {
        continue
      }

      // Filter by enrollment status - only count enrolled students
      const enrollmentStatus = enrollmentInfo?.status
      if (enrollmentStatus !== 'enrolled') {
        continue
      }

      enrollmentsWithGrade++

      // Initialize count for this grade if not exists
      if (!gradeCounts[gradeId]) {
        gradeCounts[gradeId] = 0
      }

      // Increment count
      gradeCounts[gradeId]++
    }

    console.log(
      `[Grade Counts API] Stats - Checked: ${enrollmentsChecked}, With grade: ${enrollmentsWithGrade}, Grades found: ${
        Object.keys(gradeCounts).length
      }`
    )

    // Update cache
    countsCache = {
      data: gradeCounts,
      ayCode,
      timestamp: Date.now(),
    }

    // Set cache headers for client-side caching (5 minutes)
    const response = NextResponse.json({
      success: true,
      ayCode,
      counts: gradeCounts,
      cached: false,
    })

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )

    return response
  } catch (error) {
    console.error('Error fetching grade enrollment counts:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch grade enrollment counts'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
