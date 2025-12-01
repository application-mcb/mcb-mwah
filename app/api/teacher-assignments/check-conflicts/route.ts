import { NextRequest, NextResponse } from 'next/server'
import { SubjectDatabase } from '@/lib/subject-database'
import { SectionDatabase } from '@/lib/grade-section-database'
import { checkTeacherConflict, checkRoomConflict } from '@/lib/schedule-utils'

// POST /api/teacher-assignments/check-conflicts - Check for schedule conflicts
export async function POST(request: NextRequest) {
  try {
    const {
      subjectId,
      sectionId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      deliveryMode,
    } = await request.json()

    if (!teacherId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields for conflict check' },
        { status: 400 }
      )
    }

    // Room is only required for non-online delivery modes
    if (deliveryMode !== 'Online' && !room) {
      return NextResponse.json(
        { error: 'Room is required for non-online delivery modes' },
        { status: 400 }
      )
    }

    // Get all subjects and their assignments
    const subjects = await SubjectDatabase.getAllSubjects()
    const sections = await SectionDatabase.getAllSections()

    // Build all assignments map
    const allAssignments: Record<string, any> = {}
    for (const subject of subjects) {
      if (subject.teacherAssignments) {
        allAssignments[subject.id] = subject.teacherAssignments
      }
    }

    const conflicts: string[] = []

    // Check teacher conflict
    const teacherConflict = checkTeacherConflict(
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      subjectId,
      sectionId,
      allAssignments
    )
    if (teacherConflict) {
      conflicts.push(teacherConflict.message)
    }

    // Check room conflict only if not online
    if (deliveryMode !== 'Online' && room) {
      const roomConflict = checkRoomConflict(
        room,
        dayOfWeek,
        startTime,
        endTime,
        subjectId,
        sectionId,
        allAssignments,
        subjects,
        sections
      )
      if (roomConflict) {
        conflicts.push(roomConflict.message)
      }
    }

    return NextResponse.json({ conflicts })
  } catch (error) {
    console.error('Error checking conflicts:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to check conflicts'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
