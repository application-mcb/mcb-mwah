import { NextRequest, NextResponse } from 'next/server'
import { SubjectDatabase } from '@/lib/subject-database'
import { SectionDatabase } from '@/lib/grade-section-database'
import { TeacherDatabase } from '@/lib/teacher-database'
import { RegistrarDatabase } from '@/lib/registrar-database'
import {
  checkTeacherConflict,
  checkRoomConflict,
  ConflictInfo,
} from '@/lib/schedule-utils'
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase-server'

// GET /api/teacher-assignments - Get teacher assignments for subjects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const teacherId = searchParams.get('teacherId')
    const sectionId = searchParams.get('sectionId')
    const gradeLevel = searchParams.get('gradeLevel')

    let assignments

    if (subjectId) {
      // Get assignments for a specific subject
      assignments = await getAssignmentsForSubject(subjectId)
    } else if (teacherId) {
      // Get assignments for a specific teacher
      assignments = await getAssignmentsForTeacher(teacherId)
    } else if (sectionId) {
      // Get assignments for a specific section
      assignments = await getAssignmentsForSection(sectionId)
    } else if (gradeLevel) {
      // Get assignments for a specific grade level
      assignments = await getAssignmentsForGradeLevel(parseInt(gradeLevel))
    } else {
      // Get all assignments
      assignments = await getAllAssignments()
    }

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching teacher assignments:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch teacher assignments'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/teacher-assignments - Assign teacher to subject for specific section
export async function POST(request: NextRequest) {
  try {
    const {
      subjectId,
      sectionId,
      teacherId,
      registrarUid,
      dayOfWeek,
      startTime,
      endTime,
      room,
    } = await request.json()

    // Validate required fields
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
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can assign teachers to subjects' },
        { status: 403 }
      )
    }

    // Validate subject exists
    const subject = await SubjectDatabase.getSubject(subjectId)
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Validate section exists
    const section = await SectionDatabase.getSection(sectionId)
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Validate teacher exists
    const teacher = await TeacherDatabase.getTeacher(teacherId)
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Check if teacher is already assigned to this subject for this section
    const existingAssignments = await getAssignmentsForSubject(subjectId)
    const existingAssignment = existingAssignments[sectionId]

    // Handle both old format (string[]) and new format (object)
    let isAlreadyAssigned = false
    if (Array.isArray(existingAssignment)) {
      isAlreadyAssigned = existingAssignment.includes(teacherId)
    } else if (existingAssignment && typeof existingAssignment === 'object') {
      if (Array.isArray(existingAssignment)) {
        isAlreadyAssigned = existingAssignment.some(
          (a: any) => a.teacherId === teacherId
        )
      } else if ('teacherId' in existingAssignment) {
        isAlreadyAssigned = existingAssignment.teacherId === teacherId
      }
    }

    if (isAlreadyAssigned) {
      return NextResponse.json(
        {
          error: 'Teacher is already assigned to this subject for this section',
        },
        { status: 409 }
      )
    }

    // Check if another teacher is already assigned to this section
    // Enforce single teacher per section: remove existing teacher if any
    if (existingAssignment) {
      let existingTeacherIds: string[] = []
      if (Array.isArray(existingAssignment)) {
        existingTeacherIds = existingAssignment.filter(
          (id: any) => typeof id === 'string'
        )
      } else if (
        typeof existingAssignment === 'object' &&
        'teacherId' in existingAssignment
      ) {
        existingTeacherIds = [existingAssignment.teacherId]
      }

      // Remove all existing teachers from this section before assigning new one
      for (const existingTeacherId of existingTeacherIds) {
        if (existingTeacherId !== teacherId) {
          await removeTeacherAssignment(subjectId, sectionId, existingTeacherId)
        }
      }
    }

    // Assign teacher to subject for section
    const schedule =
      dayOfWeek && startTime && endTime && room
        ? { dayOfWeek, startTime, endTime, room }
        : undefined
    await assignTeacherToSubject(subjectId, sectionId, teacherId, schedule)

    return NextResponse.json({
      message: 'Teacher assigned to subject successfully',
      assignment: {
        subjectId,
        sectionId,
        teacherId,
        subjectName: subject.name,
        sectionName: section.sectionName,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
      },
    })
  } catch (error) {
    console.error('Error assigning teacher to subject:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to assign teacher to subject'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE /api/teacher-assignments - Remove teacher assignment from subject for section
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const sectionId = searchParams.get('sectionId')
    const registrarUid = searchParams.get('registrarUid')
    const teacherId = searchParams.get('teacherId')

    if (!subjectId || !sectionId || !registrarUid) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: subjectId, sectionId, registrarUid',
        },
        { status: 400 }
      )
    }

    // Check if registrar exists and has proper role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can remove teacher assignments' },
        { status: 403 }
      )
    }

    // Remove teacher assignment (pass teacherId if provided to remove only that teacher)
    await removeTeacherAssignment(subjectId, sectionId, teacherId || undefined)

    return NextResponse.json({
      message: 'Teacher assignment removed successfully',
    })
  } catch (error) {
    console.error('Error removing teacher assignment:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to remove teacher assignment'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Helper functions
async function getAllAssignments(): Promise<
  Record<string, Record<string, string[]>>
> {
  try {
    const subjects = await SubjectDatabase.getAllSubjects()
    const assignments: Record<string, Record<string, string[]>> = {}

    for (const subject of subjects) {
      if (subject.teacherAssignments) {
        assignments[subject.id] = subject.teacherAssignments as Record<
          string,
          string[]
        >
      }
    }

    return assignments
  } catch (error) {
    console.error('Error getting all assignments:', error)
    throw error
  }
}

async function getAssignmentsForSubject(
  subjectId: string
): Promise<Record<string, any>> {
  try {
    const subject = await SubjectDatabase.getSubject(subjectId)
    if (!subject) {
      throw new Error('Subject not found')
    }

    return (subject.teacherAssignments as Record<string, any>) || {}
  } catch (error) {
    console.error('Error getting assignments for subject:', error)
    throw error
  }
}

async function getAssignmentsForTeacher(teacherId: string) {
  try {
    const subjects = await SubjectDatabase.getAllSubjects()
    const assignments: Record<string, string[]> = {}

    for (const subject of subjects) {
      if (subject.teacherAssignments) {
        const sectionIds: string[] = []

        for (const [sectionId, assignmentData] of Object.entries(
          subject.teacherAssignments as Record<string, any>
        )) {
          // Handle both old format (string[]) and new format (object)
          let isAssigned = false
          if (Array.isArray(assignmentData)) {
            // Old format: array of teacher IDs
            isAssigned = assignmentData.includes(teacherId)
          } else if (assignmentData && typeof assignmentData === 'object') {
            if (Array.isArray(assignmentData)) {
              // Array of assignment objects
              isAssigned = assignmentData.some(
                (a: any) => a.teacherId === teacherId
              )
            } else if ('teacherId' in assignmentData) {
              // Single assignment object
              isAssigned = assignmentData.teacherId === teacherId
            }
          }

          if (isAssigned) {
            sectionIds.push(sectionId)
          }
        }

        if (sectionIds.length > 0) {
          assignments[subject.id] = sectionIds
        }
      }
    }

    return assignments
  } catch (error) {
    console.error('Error getting assignments for teacher:', error)
    throw error
  }
}

async function getAssignmentsForSection(
  sectionId: string
): Promise<Record<string, string[]>> {
  try {
    const subjects = await SubjectDatabase.getAllSubjects()
    const assignments: Record<string, string[]> = {}

    for (const subject of subjects) {
      if (
        subject.teacherAssignments &&
        (subject.teacherAssignments as Record<string, string[]>)[sectionId]
      ) {
        assignments[subject.id] = (
          subject.teacherAssignments as Record<string, string[]>
        )[sectionId]
      }
    }

    return assignments
  } catch (error) {
    console.error('Error getting assignments for section:', error)
    throw error
  }
}

async function getAssignmentsForGradeLevel(
  gradeLevel: number
): Promise<Record<string, Record<string, string[]>>> {
  try {
    const subjects = await SubjectDatabase.getSubjectsByGradeLevel(gradeLevel)
    const assignments: Record<string, Record<string, string[]>> = {}

    for (const subject of subjects) {
      if (subject.teacherAssignments) {
        assignments[subject.id] = subject.teacherAssignments as Record<
          string,
          string[]
        >
      }
    }

    return assignments
  } catch (error) {
    console.error('Error getting assignments for grade level:', error)
    throw error
  }
}

async function assignTeacherToSubject(
  subjectId: string,
  sectionId: string,
  teacherId: string,
  schedule?: {
    dayOfWeek: string
    startTime: string
    endTime: string
    room: string
  }
) {
  try {
    const subjectRef = doc(db, 'subjects', subjectId)

    // Get current subject data
    const subjectSnap = await getDoc(subjectRef)
    if (!subjectSnap.exists()) {
      throw new Error('Subject not found')
    }

    const subjectData = subjectSnap.data()
    const teacherAssignments = subjectData.teacherAssignments || {}

    // Create assignment object with schedule if provided
    if (schedule) {
      teacherAssignments[sectionId] = {
        teacherId,
        schedule: {
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room,
        },
      }
    } else {
      // Backward compatibility: if no schedule, use array format
      teacherAssignments[sectionId] = [teacherId]
    }

    // Update subject with new assignment
    await updateDoc(subjectRef, {
      teacherAssignments,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error assigning teacher to subject:', error)
    throw error
  }
}

async function removeTeacherAssignment(
  subjectId: string,
  sectionId: string,
  teacherId?: string
) {
  try {
    const subjectRef = doc(db, 'subjects', subjectId)

    // Get current subject data
    const subjectSnap = await getDoc(subjectRef)
    if (!subjectSnap.exists()) {
      throw new Error('Subject not found')
    }

    const subjectData = subjectSnap.data()
    const teacherAssignments = subjectData.teacherAssignments || {}

    if (teacherId) {
      // Remove specific teacher from section
      const assignment = teacherAssignments[sectionId]
      if (assignment) {
        if (Array.isArray(assignment)) {
          // Old format: array of teacher IDs
          teacherAssignments[sectionId] = assignment.filter(
            (id: string) => id !== teacherId
          )

          // Remove section key if no teachers left
          if (teacherAssignments[sectionId].length === 0) {
            delete teacherAssignments[sectionId]
          }
        } else if (
          typeof assignment === 'object' &&
          'teacherId' in assignment
        ) {
          // New format: object with teacherId
          if (assignment.teacherId === teacherId) {
            delete teacherAssignments[sectionId]
          }
        }
      }
    } else {
      // Remove entire section assignment
      delete teacherAssignments[sectionId]
    }

    // Update subject with removed assignment
    await updateDoc(subjectRef, {
      teacherAssignments,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error removing teacher assignment:', error)
    throw error
  }
}
