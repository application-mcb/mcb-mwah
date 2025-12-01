'use client'

import React, { useEffect, useMemo } from 'react'
import Print from './print'
import { BookOpen, Calendar, MapPin, Users } from '@phosphor-icons/react'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'

type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'

interface SubjectData {
  id: string
  name: string
  code?: string
  color: string
  teacherAssignments?: Record<string, any>
}

interface Teacher {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  extension?: string
  email?: string
}

interface EnrollmentData {
  personalInfo: {
    firstName: string
    middleName?: string
    lastName: string
    nameExtension?: string
  }
  enrollmentInfo: {
    gradeLevel?: string
    schoolYear: string
    sectionId?: string
    courseCode?: string
    yearLevel?: string
  }
}

interface StudentSchedulePrintProps {
  isOpen: boolean
  onClose: () => void
  enrollment: EnrollmentData | null
  subjects: SubjectData[]
  teachers: Record<string, Teacher>
}

interface TimeSlot {
  label: string
  startMinutes: number
  endMinutes: number
}

interface ScheduleBlock {
  id: string
  day: DayOfWeek
  startMinutes: number
  endMinutes: number
  subjectCode: string
  subjectName: string
  teacherName: string
  room?: string
  deliveryMode?: string
}

type DayCellType = 'block' | 'empty' | 'skip'

interface DayCell {
  type: DayCellType
  block?: ScheduleBlock
  rowSpan?: number
}

const days: { key: DayOfWeek; label: string }[] = [
  { key: 'Monday', label: 'Mon' },
  { key: 'Tuesday', label: 'Tues' },
  { key: 'Wednesday', label: 'Wed' },
  { key: 'Thursday', label: 'Thur' },
  { key: 'Friday', label: 'Fri' },
  { key: 'Saturday', label: 'Sat' },
]

const convertToMinutes = (timeStr: string): number => {
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

const formatMinutesLabel = (minutes: number): string => {
  const hours24 = Math.floor(minutes / 60)
  const mins = minutes % 60
  const ampm = hours24 >= 12 ? 'PM' : 'AM'
  let hours12 = hours24 > 12 ? hours24 - 12 : hours24
  if (hours12 === 0) hours12 = 12
  const minuteStr = mins.toString().padStart(2, '0')
  return `${hours12}:${minuteStr} ${ampm}`
}

const generatePrintTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const startMinutes = 7 * 60 // 7:00 AM
  const endMinutes = 18 * 60 // 6:00 PM

  for (let current = startMinutes; current < endMinutes; current += 30) {
    const next = current + 30
    slots.push({
      label: `${formatMinutesLabel(current)} - ${formatMinutesLabel(next)}`,
      startMinutes: current,
      endMinutes: next,
    })
  }

  return slots
}

const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'red-700': '#b91c1c',
    'red-800': '#991b1b',
    'emerald-700': '#047857',
    'emerald-800': '#065f46',
    'yellow-700': '#a16207',
    'yellow-800': '#92400e',
    'orange-700': '#c2410c',
    'orange-800': '#9a3412',
    'violet-700': '#7c3aed',
    'violet-800': '#5b21b6',
    'purple-700': '#8b5cf6',
    'purple-800': '#6b21a8',
    'indigo-700': '#4338ca',
    'indigo-800': '#312e81',
  }
  return colorMap[color] || '#1e40af'
}

const StudentSchedulePrintModal: React.FC<StudentSchedulePrintProps> = ({
  isOpen,
  onClose,
  enrollment,
  subjects,
  teachers,
}) => {
  const timeSlots = useMemo(() => generatePrintTimeSlots(), [])

  const scheduleBlocks = useMemo(() => {
    if (!enrollment?.enrollmentInfo?.sectionId) return []
    const sectionId = enrollment.enrollmentInfo.sectionId
    const blocks: ScheduleBlock[] = []

    subjects.forEach((subject) => {
      const assignments = subject.teacherAssignments as any
      if (!assignments) return

      const assignmentData = assignments[sectionId]
      if (!assignmentData) return

      let teacherId: string | null = null
      if (Array.isArray(assignmentData)) {
        teacherId = (assignmentData[0] as string) || null
      } else if (
        assignmentData &&
        typeof assignmentData === 'object' &&
        'teacherId' in assignmentData
      ) {
        teacherId = (assignmentData.teacherId as string) || null
      }

      const teacher = teacherId ? teachers[teacherId] : undefined
      const teacherName = teacher
        ? `${teacher.firstName || ''} ${
            teacher.middleName ? teacher.middleName.charAt(0) + '. ' : ''
          }${teacher.lastName || ''}${teacher.extension ? ' ' + teacher.extension : ''}`.trim()
        : 'TBA'

      const scheduleWrapper =
        !Array.isArray(assignmentData) &&
        assignmentData &&
        typeof assignmentData === 'object' &&
        'schedule' in assignmentData
          ? assignmentData.schedule
          : null

      if (!scheduleWrapper) return

      const { startTime, endTime, dayOfWeek, room, deliveryMode } =
        scheduleWrapper as {
          dayOfWeek?: string | string[]
          startTime?: string
          endTime?: string
          room?: string
          deliveryMode?: string
        }

      if (!startTime || !endTime || !dayOfWeek) return

      const startMinutes = convertToMinutes(startTime)
      const endMinutes = convertToMinutes(endTime)
      if (endMinutes <= startMinutes) return

      const daysArray: DayOfWeek[] = Array.isArray(dayOfWeek)
        ? (dayOfWeek as DayOfWeek[])
        : [dayOfWeek as DayOfWeek]

      daysArray.forEach((day) => {
        blocks.push({
          id: `${subject.id}-${sectionId}-${day}`,
          day,
          startMinutes,
          endMinutes,
          subjectCode: subject.code || '',
          subjectName: subject.name,
          teacherName,
          room: deliveryMode === 'Online' ? 'Online' : room,
          deliveryMode,
        })
      })
    })

    return blocks
  }, [enrollment?.enrollmentInfo?.sectionId, subjects, teachers])

  const cellMatrix: Record<DayOfWeek, DayCell[]> = useMemo(() => {
    const matrix: Record<DayOfWeek, DayCell[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    }

    days.forEach((day) => {
      matrix[day.key] = timeSlots.map(() => ({ type: 'empty' }))
    })

    scheduleBlocks.forEach((block) => {
      const dayCells = matrix[block.day]
      if (!dayCells) return

      const startIndex = timeSlots.findIndex(
        (slot) => slot.startMinutes === block.startMinutes
      )
      if (startIndex === -1) return

      let endIndexExclusive =
        timeSlots.findIndex((slot) => slot.startMinutes >= block.endMinutes) !==
        -1
          ? timeSlots.findIndex(
              (slot) => slot.startMinutes >= block.endMinutes
            )
          : timeSlots.length

      if (endIndexExclusive <= startIndex) {
        endIndexExclusive = startIndex + 1
      }

      const rowSpan = endIndexExclusive - startIndex
      dayCells[startIndex] = { type: 'block', block, rowSpan }
      for (let i = startIndex + 1; i < endIndexExclusive; i++) {
        dayCells[i] = { type: 'skip' }
      }
    })

    return matrix
  }, [scheduleBlocks, timeSlots])

  const subjectLegend = useMemo(() => {
    const subjectMap = new Map<string, { name: string; color: string }>()
    subjects.forEach((subject) => {
      const code = subject.code || ''
      if (!code) return
      if (!subjectMap.has(code)) {
        subjectMap.set(code, {
          name: subject.name,
          color: getColorValue(subject.color),
        })
      }
    })

    return Array.from(subjectMap.entries())
      .map(([code, info]) => ({
        code,
        name: info.name,
        color: info.color,
      }))
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [subjects])

  useEffect(() => {
    if (!isOpen) return
  }, [isOpen])

  if (!isOpen || !enrollment) return null

  const studentName = (() => {
    const first = enrollment.personalInfo.firstName || ''
    const middle = enrollment.personalInfo.middleName
      ? `${enrollment.personalInfo.middleName.charAt(0)}. `
      : ''
    const last = enrollment.personalInfo.lastName || ''
    const ext = enrollment.personalInfo.nameExtension
      ? ` ${enrollment.personalInfo.nameExtension}`
      : ''
    return `${first} ${middle}${last}${ext}`.trim()
  })()

  const hasSchedule = scheduleBlocks.length > 0

  const levelLabel = (() => {
    const info = enrollment.enrollmentInfo
    if (info.courseCode && info.yearLevel) {
      return `${info.courseCode} ${info.yearLevel}`
    }
    if (info.gradeLevel) {
      return `Grade ${info.gradeLevel}`
    }
    return ''
  })()

  return (
    <Print onClose={onClose} title="Student Class Schedule">
      <div className="print-document p-3">
        <div className="print-header mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Marian College Logo"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1
                  className="text-md font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {SCHOOL_NAME_FORMAL}
                </h1>
                <p
                  className="text-xs text-gray-600 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  Student Class Schedule
                </p>
                <p
                  className="text-xs text-gray-600 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  School Year: {enrollment.enrollmentInfo.schoolYear}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-900" weight="fill" />
                <div>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Student
                  </p>
                  <p
                    className="text-sm text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {studentName}
                  </p>
                </div>
              </div>
              {levelLabel && (
                <p
                  className="text-xs text-gray-600 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  {levelLabel}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="print-section">
          {!enrollment.enrollmentInfo.sectionId ? (
            <div className="py-12 text-center text-xs text-gray-600">
              No section assigned. Schedule is not available.
            </div>
          ) : !hasSchedule ? (
            <div className="py-12 text-center text-xs text-gray-600">
              No scheduled subjects found for this student.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-900 text-[10px]">
                <thead>
                  <tr>
                    <th className="border border-gray-900 px-2 py-1 text-center align-middle w-24">
                      Time
                    </th>
                    {days.map((day) => (
                      <th
                        key={day.key}
                        className="border border-gray-900 px-2 py-1 text-center align-middle"
                      >
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, rowIndex) => (
                    <tr key={slot.startMinutes}>
                      <td className="border border-gray-900 px-2 py-1 align-middle text-center whitespace-nowrap">
                        {slot.label.replace(' ', ' – ')}
                      </td>
                      {days.map((day) => {
                        const cell = cellMatrix[day.key][rowIndex]
                        if (!cell || cell.type === 'skip') {
                          return null
                        }

                        if (cell.type === 'empty') {
                          return (
                            <td
                              key={day.key}
                              className="border border-gray-900 px-1 py-1 align-top"
                            />
                          )
                        }

                        const block = cell.block!
                        const subjectMatch = subjects.find(
                          (s) => s.code === block.subjectCode
                        )
                        const bgColor = getColorValue(
                          subjectMatch?.color || 'blue-900'
                        )

                        return (
                          <td
                            key={day.key}
                            rowSpan={cell.rowSpan}
                            className="border border-gray-900 px-1 py-1 align-top"
                            style={{
                              backgroundColor: bgColor,
                              color: '#ffffff',
                            }}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <BookOpen
                                  size={10}
                                  className="text-white"
                                  weight="fill"
                                />
                                <span className="font-medium tracking-wide">
                                  {block.subjectCode}
                                </span>
                              </div>
                              <div className="text-[9px] opacity-95">
                                {block.teacherName}
                              </div>
                              <div className="flex items-center gap-1 text-[8px] opacity-90">
                                <Calendar size={9} className="text-white" />
                                <span>
                                  {formatMinutesLabel(block.startMinutes)}–
                                  {formatMinutesLabel(block.endMinutes)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[8px] opacity-90">
                                <MapPin size={9} className="text-white" />
                                <span>{block.room || 'No room'}</span>
                              </div>
                              {block.deliveryMode && (
                                <div className="text-[8px] opacity-90">
                                  {block.deliveryMode}
                                </div>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {hasSchedule && (
          <div className="mt-6 border border-gray-300 rounded-lg">
            <div
              className="px-4 py-2 border-b border-gray-300 bg-gray-100 text-xs text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              SUBJECT LEGEND
            </div>
            <div className="p-4 text-[11px] text-gray-800 leading-relaxed font-medium">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {subjectLegend.map((item) => (
                  <div key={item.code} className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm border border-gray-400"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="whitespace-nowrap">{item.code}</span>
                    <span className="flex-1 break-words">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Print>
  )
}

export default StudentSchedulePrintModal


