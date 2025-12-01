'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

interface TeacherSchedulePrintProps {
  isOpen: boolean
  onClose: () => void
  teacher: {
    id: string
    firstName: string
    middleName?: string
    lastName: string
    extension?: string
  } | null
  registrarUid: string
}

interface AssignmentSectionSchedule {
  sectionId: string
  sectionName: string
  rank: string
  department: string
  startTime?: string
  endTime?: string
  room?: string
  deliveryMode?: 'Face to Face' | 'Modular' | 'Hybrid' | 'Online'
  dayOfWeek?: DayOfWeek[] | DayOfWeek
}

interface AssignmentData {
  subjectId: string
  subjectCode: string
  subjectName: string
  subjectColor: string
  gradeLevel?: number
  courseCode?: string
  courseName?: string
  sections: AssignmentSectionSchedule[]
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
  sectionName: string
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

const TeacherSchedulePrintModal: React.FC<TeacherSchedulePrintProps> = ({
  isOpen,
  onClose,
  teacher,
  registrarUid,
}) => {
  const [assignments, setAssignments] = useState<AssignmentData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadAssignments = async () => {
      if (!teacher || !isOpen) return

      try {
        setLoading(true)

        const assignmentsResponse = await fetch(
          `/api/teacher-assignments?teacherId=${encodeURIComponent(teacher.id)}`
        )
        if (!assignmentsResponse.ok) {
          throw new Error('Failed to load assignments')
        }
        const assignmentsData = await assignmentsResponse.json()
        const teacherAssignments: Record<string, any> =
          assignmentsData.assignments || {}

        const subjectsResponse = await fetch('/api/subjects')
        if (!subjectsResponse.ok) {
          throw new Error('Failed to load subjects')
        }
        const subjectsData = await subjectsResponse.json()
        const subjects = subjectsData.subjects || []

        const sectionsResponse = await fetch('/api/sections')
        if (!sectionsResponse.ok) {
          throw new Error('Failed to load sections')
        }
        const sectionsData = await sectionsResponse.json()
        const sections = sectionsData.sections || []

        const coursesResponse = await fetch('/api/courses')
        const coursesData = coursesResponse.ok
          ? await coursesResponse.json()
          : { courses: [] }
        const courses = coursesData.courses || []

        const organizedAssignments: AssignmentData[] = []

        for (const [subjectId, sectionIds] of Object.entries(
          teacherAssignments
        )) {
          const subject = subjects.find((s: any) => s.id === subjectId)
          if (!subject) continue

          const sectionDetails = (Array.isArray(sectionIds) ? sectionIds : [])
            .map((sectionId: string) => {
              const section = sections.find((s: any) => s.id === sectionId)
              if (!section) return null

              let scheduleData: AssignmentSectionSchedule = {
                sectionId: section.id,
                sectionName: section.sectionName,
                rank: section.rank || '',
                department: section.department || '',
              }

              const assignmentData = (subject.teacherAssignments as any)?.[
                sectionId
              ]
              if (
                assignmentData &&
                typeof assignmentData === 'object' &&
                'schedule' in assignmentData
              ) {
                const dayOfWeek = assignmentData.schedule?.dayOfWeek
                scheduleData = {
                  ...scheduleData,
                  startTime: assignmentData.schedule?.startTime,
                  endTime: assignmentData.schedule?.endTime,
                  room: assignmentData.schedule?.room,
                  deliveryMode: assignmentData.schedule?.deliveryMode,
                  dayOfWeek: Array.isArray(dayOfWeek)
                    ? dayOfWeek
                    : dayOfWeek
                    ? [dayOfWeek]
                    : undefined,
                }
              }

              return scheduleData
            })
            .filter((s): s is AssignmentSectionSchedule => s !== null)

          if (sectionDetails.length > 0) {
            let courseName: string | undefined
            if (subject.courseCodes && subject.courseCodes.length > 0) {
              const course = courses.find(
                (c: any) => c.code === subject.courseCodes[0]
              )
              courseName = course?.name
            }

            organizedAssignments.push({
              subjectId: subject.id,
              subjectCode: subject.code || '',
              subjectName: subject.name || '',
              subjectColor: subject.color || 'blue-900',
              gradeLevel: subject.gradeLevel,
              courseCode: subject.courseCodes?.[0],
              courseName,
              sections: sectionDetails,
            })
          }
        }

        organizedAssignments.sort((a, b) =>
          a.subjectCode.localeCompare(b.subjectCode)
        )

        setAssignments(organizedAssignments)
      } catch (error) {
        console.error('Error loading teacher schedule:', error)
        setAssignments([])
      } finally {
        setLoading(false)
      }
    }

    loadAssignments()
  }, [teacher?.id, isOpen, registrarUid])

  const timeSlots = useMemo(() => generatePrintTimeSlots(), [])

  const scheduleBlocks = useMemo(() => {
    const blocks: ScheduleBlock[] = []

    assignments.forEach((assignment) => {
      assignment.sections.forEach((section) => {
        if (!section.startTime || !section.endTime || !section.dayOfWeek) {
          return
        }

        const startMinutes = convertToMinutes(section.startTime)
        const endMinutes = convertToMinutes(section.endTime)
        if (endMinutes <= startMinutes) {
          return
        }

        const daysArray: DayOfWeek[] = Array.isArray(section.dayOfWeek)
          ? (section.dayOfWeek as DayOfWeek[])
          : [section.dayOfWeek as DayOfWeek]

        daysArray.forEach((day) => {
          blocks.push({
            id: `${assignment.subjectId}-${section.sectionId}-${day}`,
            day,
            startMinutes,
            endMinutes,
            subjectCode: assignment.subjectCode,
            subjectName: assignment.subjectName,
            sectionName: section.sectionName,
            room: section.deliveryMode === 'Online' ? 'Online' : section.room,
            deliveryMode: section.deliveryMode,
          })
        })
      })
    })

    return blocks
  }, [assignments])

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
    assignments.forEach((assignment) => {
      if (!subjectMap.has(assignment.subjectCode)) {
        subjectMap.set(assignment.subjectCode, {
          name: assignment.subjectName,
          color: getColorValue(assignment.subjectColor),
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
  }, [assignments])

  if (!isOpen || !teacher) return null

  const teacherFullName = `${teacher.firstName} ${
    teacher.middleName ? teacher.middleName + ' ' : ''
  }${teacher.lastName}${teacher.extension ? ' ' + teacher.extension : ''}`

  const hasSchedule = scheduleBlocks.length > 0

  return (
    <Print onClose={onClose} title="Teacher Weekly Schedule">
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
                  Weekly Teaching Schedule
                </p>
                <p
                  className="text-xs text-gray-600 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  Printed on:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-900" weight="fill" />
                <div>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Teacher
                  </p>
                  <p
                    className="text-sm text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {teacherFullName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="print-section">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-600">
              Loading schedule...
            </div>
          ) : !hasSchedule ? (
            <div className="py-12 text-center text-xs text-gray-600">
              No scheduled subjects found for this teacher.
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
                        const subjectMatch = assignments.find(
                          (a) =>
                            a.subjectCode === block.subjectCode &&
                            a.subjectName === block.subjectName
                        )
                        const bgColor = getColorValue(
                          subjectMatch?.subjectColor || 'blue-900'
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
                              <div className="text-[9px] opacity-90">
                                {block.sectionName}
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

export default TeacherSchedulePrintModal


