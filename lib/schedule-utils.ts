// Utility functions for schedule conflict detection

export interface ScheduleData {
  dayOfWeek:
    | (
        | 'Monday'
        | 'Tuesday'
        | 'Wednesday'
        | 'Thursday'
        | 'Friday'
        | 'Saturday'
        | 'Sunday'
      )[]
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday' // Support both array and single value for backward compatibility
  startTime: string // Format: "HH:MM AM/PM" (e.g., "8:00 AM")
  endTime: string // Format: "HH:MM AM/PM" (e.g., "9:30 AM")
  room: string
}

export interface ConflictInfo {
  type: 'teacher' | 'room'
  message: string
  conflictingSubject: string
  conflictingSection: string
  conflictingTeacher?: string
}

// Convert time string to minutes for comparison
export function convertToMinutes(timeStr: string): number {
  const [time, period] = timeStr.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  let totalMinutes = hours * 60 + minutes
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60
  }
  return totalMinutes
}

// Check if two time ranges overlap
export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = convertToMinutes(start1)
  const end1Minutes = convertToMinutes(end1)
  const start2Minutes = convertToMinutes(start2)
  const end2Minutes = convertToMinutes(end2)

  // Check for overlap: start1 < end2 && start2 < end1
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes
}

// Check for teacher schedule conflict
export function checkTeacherConflict(
  teacherId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  excludeSubjectId?: string,
  excludeSectionId?: string,
  allAssignments: Record<string, any> = {}
): ConflictInfo | null {
  for (const [subjectId, assignments] of Object.entries(allAssignments)) {
    if (excludeSubjectId && subjectId === excludeSubjectId) continue

    if (typeof assignments === 'object' && assignments !== null) {
      for (const [sectionId, assignmentData] of Object.entries(assignments)) {
        if (excludeSectionId && sectionId === excludeSectionId) continue

        // Handle both old format (string[]) and new format (object with schedule)
        let teacherIds: string[] = []
        let schedule: ScheduleData | undefined

        if (Array.isArray(assignmentData)) {
          // Old format: just teacher IDs (array of strings)
          teacherIds = assignmentData.filter(
            (id): id is string => typeof id === 'string'
          )
        } else if (assignmentData && typeof assignmentData === 'object') {
          // New format: object with teacherId and schedule
          if (
            'teacherId' in assignmentData &&
            assignmentData.teacherId === teacherId
          ) {
            teacherIds = [teacherId]
            if ('schedule' in assignmentData && assignmentData.schedule) {
              schedule = assignmentData.schedule as ScheduleData
            }
          }
        }

        if (teacherIds.includes(teacherId) && schedule) {
          // Handle both single day and array of days
          const scheduleDays = Array.isArray(schedule.dayOfWeek)
            ? schedule.dayOfWeek
            : [schedule.dayOfWeek]

          if (
            scheduleDays.includes(dayOfWeek as any) &&
            checkTimeOverlap(
              startTime,
              endTime,
              schedule.startTime,
              schedule.endTime
            )
          ) {
            const dayDisplay =
              scheduleDays.length === 1
                ? scheduleDays[0]
                : scheduleDays.join(', ')
            return {
              type: 'teacher',
              message: `This teacher already has a class scheduled from ${schedule.startTime} to ${schedule.endTime} on ${dayDisplay}`,
              conflictingSubject: subjectId,
              conflictingSection: sectionId,
            }
          }
        }
      }
    }
  }

  return null
}

// Check for room schedule conflict
export function checkRoomConflict(
  room: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  excludeSubjectId?: string,
  excludeSectionId?: string,
  allAssignments: Record<string, any> = {},
  allSubjects: any[] = [],
  allSections: any[] = []
): ConflictInfo | null {
  for (const [subjectId, assignments] of Object.entries(allAssignments)) {
    if (excludeSubjectId && subjectId === excludeSubjectId) continue

    const subject = allSubjects.find((s: any) => s.id === subjectId)
    if (!subject) continue

    if (typeof assignments === 'object' && assignments !== null) {
      for (const [sectionId, assignmentData] of Object.entries(assignments)) {
        if (excludeSectionId && sectionId === excludeSectionId) continue

        const section = allSections.find((s: any) => s.id === sectionId)
        if (!section) continue

        // Handle both old format (string[]) and new format (object with schedule)
        let schedules: ScheduleData[] = []

        if (Array.isArray(assignmentData)) {
          // Old format: just teacher IDs, no schedule
          continue
        } else if (assignmentData && typeof assignmentData === 'object') {
          // New format: object with teacherId and schedule
          if (
            'schedule' in assignmentData &&
            assignmentData.schedule &&
            typeof assignmentData.schedule === 'object' &&
            'room' in assignmentData.schedule &&
            assignmentData.schedule.room === room
          ) {
            schedules.push(assignmentData.schedule as ScheduleData)
          }
        }

        for (const schedule of schedules) {
          // Handle both single day and array of days
          const scheduleDays = Array.isArray(schedule.dayOfWeek)
            ? schedule.dayOfWeek
            : [schedule.dayOfWeek]

          if (
            scheduleDays.includes(dayOfWeek as any) &&
            checkTimeOverlap(
              startTime,
              endTime,
              schedule.startTime,
              schedule.endTime
            )
          ) {
            const dayDisplay =
              scheduleDays.length === 1
                ? scheduleDays[0]
                : scheduleDays.join(', ')
            return {
              type: 'room',
              message: `The room you are trying to assign is already occupied from ${
                schedule.startTime
              } to ${schedule.endTime} on ${dayDisplay} for ${
                subject.name || 'a subject'
              } in ${section.sectionName || 'a section'}`,
              conflictingSubject: subjectId,
              conflictingSection: sectionId,
            }
          }
        }
      }
    }
  }

  return null
}
