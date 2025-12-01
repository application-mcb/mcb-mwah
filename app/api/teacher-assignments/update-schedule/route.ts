import { NextRequest, NextResponse } from 'next/server'
import { SubjectDatabase } from '@/lib/subject-database'
import { SectionDatabase } from '@/lib/grade-section-database'
import { TeacherDatabase } from '@/lib/teacher-database'
import { RegistrarDatabase } from '@/lib/registrar-database'
import { checkTeacherConflict, checkRoomConflict } from '@/lib/schedule-utils'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase-server'

// PUT /api/teacher-assignments/update-schedule - Update schedule for existing assignment
export async function PUT(request: NextRequest) {
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
      deliveryMode,
    } = await request.json()

    // dayOfWeek can be a string or array
    const daysOfWeek = Array.isArray(dayOfWeek) ? dayOfWeek : [dayOfWeek]

    // Default delivery mode when not provided (backwards compatibility)
    const effectiveDeliveryMode: 'Face to Face' | 'Modular' | 'Hybrid' | 'Online' =
      deliveryMode === 'Modular' ||
      deliveryMode === 'Hybrid' ||
      deliveryMode === 'Online' ||
      deliveryMode === 'Face to Face'
        ? deliveryMode
        : 'Face to Face'

    if (
      !subjectId ||
      !sectionId ||
      !teacherId ||
      !registrarUid ||
      !dayOfWeek ||
      daysOfWeek.length === 0 ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: subjectId, sectionId, teacherId, registrarUid, dayOfWeek, startTime, endTime',
        },
        { status: 400 }
      )
    }

    // Room is only required for non-online delivery modes
    if (effectiveDeliveryMode !== 'Online' && !room) {
      return NextResponse.json(
        {
          error: 'Room is required for non-online delivery modes',
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
        { error: 'Only registrars can update schedules' },
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

    // Check for conflicts - check each day
    const subjects = await SubjectDatabase.getAllSubjects()
    const sections = await SectionDatabase.getAllSections()
    const allAssignments: Record<string, any> = {}
    for (const subj of subjects) {
      if (subj.teacherAssignments) {
        allAssignments[subj.id] = subj.teacherAssignments
      }
    }

    const conflicts: string[] = []

    // Check conflicts for each day
    for (const day of daysOfWeek) {
      // Check teacher conflict
      const teacherConflict = checkTeacherConflict(
        teacherId,
        day,
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
        day,
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
    }

    if (conflicts.length > 0) {
      return NextResponse.json({ conflicts }, { status: 409 })
    }

    // Update schedule
    const subjectRef = doc(db, 'subjects', subjectId)
    const subjectSnap = await getDoc(subjectRef)
    if (!subjectSnap.exists()) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const subjectData = subjectSnap.data()
    const teacherAssignments = subjectData.teacherAssignments || {}

    // Update assignment with schedule
    if (teacherAssignments[sectionId]) {
      if (Array.isArray(teacherAssignments[sectionId])) {
        // Convert old format to new format
        if (teacherAssignments[sectionId].includes(teacherId)) {
          teacherAssignments[sectionId] = {
            teacherId,
            schedule: {
              dayOfWeek: daysOfWeek,
              startTime,
              endTime,
              room: effectiveDeliveryMode === 'Online' ? '' : room,
              deliveryMode: effectiveDeliveryMode,
            },
          }
        }
      } else if (teacherAssignments[sectionId].teacherId === teacherId) {
        // Update existing schedule - store daysOfWeek as array
        teacherAssignments[sectionId] = {
          ...teacherAssignments[sectionId],
          schedule: {
            dayOfWeek: daysOfWeek,
            startTime,
            endTime,
            room: effectiveDeliveryMode === 'Online' ? '' : room,
            deliveryMode: effectiveDeliveryMode,
          },
        }
      }
    }

    await updateDoc(subjectRef, {
      teacherAssignments,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({
      message: 'Schedule updated successfully',
      schedule: {
        dayOfWeek: daysOfWeek,
        startTime,
        endTime,
        room: effectiveDeliveryMode === 'Online' ? '' : room,
        deliveryMode: effectiveDeliveryMode,
      },
    })
  } catch (error) {
    console.error('Error updating schedule:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update schedule'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
