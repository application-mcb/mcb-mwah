import { NextRequest, NextResponse } from 'next/server'
import { RegistrarDatabase } from '@/lib/registrar-database'
import { SubjectDatabase } from '@/lib/subject-database'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase-server'

// PUT /api/teacher-assignments/reset-schedule - Clear schedule for an existing assignment
export async function PUT(request: NextRequest) {
  try {
    const { subjectId, sectionId, teacherId, registrarUid } = await request.json()

    if (!subjectId || !sectionId || !teacherId || !registrarUid) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: subjectId, sectionId, teacherId, registrarUid',
        },
        { status: 400 }
      )
    }

    // Check if registrar exists and has proper role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid)
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can reset schedules' },
        { status: 403 }
      )
    }

    // Validate subject exists
    const subjectRef = doc(db, 'subjects', subjectId)
    const subjectSnap = await getDoc(subjectRef)
    if (!subjectSnap.exists()) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const subjectData = subjectSnap.data()
    const teacherAssignments = subjectData.teacherAssignments || {}

    if (!teacherAssignments[sectionId]) {
      return NextResponse.json(
        { error: 'No assignment found for this section' },
        { status: 404 }
      )
    }

    const assignment = teacherAssignments[sectionId]

    // Handle old array format (string[] of teacherIds)
    if (Array.isArray(assignment)) {
      // Nothing to reset; old format has no schedule
      return NextResponse.json({
        message: 'No schedule to reset for this assignment',
      })
    }

    if (typeof assignment === 'object' && assignment !== null) {
      // Ensure we're resetting the schedule for the correct teacher
      if ('teacherId' in assignment && assignment.teacherId !== teacherId) {
        return NextResponse.json(
          { error: 'Assignment belongs to a different teacher' },
          { status: 400 }
        )
      }

      // Clear the schedule while keeping the teacher assignment
      delete assignment.schedule
      teacherAssignments[sectionId] = assignment
    }

    await updateDoc(subjectRef, {
      teacherAssignments,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({
      message: 'Schedule reset successfully',
    })
  } catch (error) {
    console.error('Error resetting schedule:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to reset schedule'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


