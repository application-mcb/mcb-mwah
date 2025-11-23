import { NextResponse } from 'next/server'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import { getOrDeriveGradeId } from '@/lib/enrollment-database'

// Helper function to reconstruct gradeId (same logic as GradeDatabase.generateGradeId)
function reconstructGradeId(
  gradeLevel: string | number,
  department: string,
  strand?: string
): string | null {
  if (!gradeLevel || !department) {
    return null
  }

  const gradeLevelNum = typeof gradeLevel === 'string' ? parseInt(gradeLevel) : gradeLevel
  if (isNaN(gradeLevelNum)) {
    return null
  }

  // Pattern: grade-{gradeLevel}-{department}-{strand} for SHS, grade-{gradeLevel}-{department} for JHS
  if (department === 'SHS' && strand) {
    return `grade-${gradeLevelNum}-${department.toLowerCase()}-${strand.toLowerCase()}`
  }
  return `grade-${gradeLevelNum}-${department.toLowerCase()}`
}

export async function POST() {
  try {
    const enrollmentsRef = collection(db, 'enrollments')
    const enrollmentsSnapshot = await getDocs(enrollmentsRef)

    let total = 0
    let collegeEnrollments = 0
    let updated = 0
    let alreadyHasGradeId = 0
    let errors = 0
    const errorDetails: string[] = []

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      total++
      const enrollmentData = enrollmentDoc.data()
      const enrollmentInfo = enrollmentData?.enrollmentInfo || {}

      // Skip college enrollments (they don't have gradeId)
      if (enrollmentInfo?.level === 'college') {
        collegeEnrollments++
        continue
      }

      // Skip if gradeId already exists
      if (enrollmentInfo?.gradeId) {
        alreadyHasGradeId++
        continue
      }

      // Only process high school enrollments missing gradeId
      if (enrollmentInfo?.level === 'high-school') {
        const gradeLevel = enrollmentInfo?.gradeLevel
        const department = enrollmentInfo?.department
        const strand = enrollmentInfo?.strand

        // Reconstruct gradeId
        const reconstructedGradeId = reconstructGradeId(gradeLevel, department, strand)

        if (!reconstructedGradeId) {
          errors++
          errorDetails.push(
            `Enrollment ${enrollmentDoc.id}: Missing required fields (gradeLevel: ${gradeLevel}, department: ${department})`
          )
          continue
        }

        try {
          // Update the enrollment document
          const enrollmentRef = doc(db, 'enrollments', enrollmentDoc.id)
          await updateDoc(enrollmentRef, {
            'enrollmentInfo.gradeId': reconstructedGradeId,
          })
          updated++
        } catch (error: any) {
          errors++
          errorDetails.push(
            `Enrollment ${enrollmentDoc.id}: Failed to update - ${error.message}`
          )
          console.error(`Failed to update enrollment ${enrollmentDoc.id}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      total,
      collegeEnrollments,
      highSchoolEnrollments: total - collegeEnrollments,
      updated,
      alreadyHasGradeId,
      errors,
      errorDetails: errors > 0 ? errorDetails : undefined,
    })
  } catch (error: any) {
    console.error('GradeId fix error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fix gradeId for enrollments',
      },
      { status: 500 }
    )
  }
}

