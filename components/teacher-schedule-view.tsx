'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  Calendar,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'

interface TeacherScheduleViewProps {
  teacherId: string
}

interface Subject {
  id: string
  code: string
  name: string
  color: string
  gradeLevel: number
}

interface Section {
  id: string
  sectionName: string
  gradeId: string
  rank: string
  grade: string
  department: string
}

interface Grade {
  id: string
  gradeLevel: number
  color: string
  description: string
  strand?: string
  department: string
}

interface TeacherAssignment {
  subjectId: string
  sectionId: string
  teacherId: string
}

interface ScheduleItem {
  subject: Subject
  section: Section
  grade: Grade
  timeSlot: string // e.g., "8:00 AM - 9:00 AM"
  day: string // e.g., "Monday"
}

export default function TeacherScheduleView({
  teacherId,
}: TeacherScheduleViewProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [subjects, setSubjects] = useState<Record<string, Subject>>({})
  const [sections, setSections] = useState<Record<string, Section>>({})
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  useEffect(() => {
    loadTeacherSchedule()
  }, [teacherId])

  const loadTeacherSchedule = async () => {
    try {
      setLoading(true)

      // Load teacher assignments
      const assignmentsResponse = await fetch(
        `/api/teacher-assignments?teacherId=${teacherId}`
      )
      const assignmentsData = await assignmentsResponse.json()

      if (assignmentsResponse.ok && assignmentsData.assignments) {
        // Transform the API response from {subjectId: [sectionIds]} to [{subjectId, sectionId}]
        const transformedAssignments: TeacherAssignment[] = []
        Object.entries(assignmentsData.assignments).forEach(
          ([subjectId, sectionIds]) => {
            if (Array.isArray(sectionIds)) {
              sectionIds.forEach((sectionId) => {
                transformedAssignments.push({
                  subjectId,
                  sectionId: sectionId as string,
                  teacherId,
                })
              })
            }
          }
        )
        setAssignments(transformedAssignments)

        // Generate a sample schedule based on assignments
        // In a real system, this would come from a schedule database
        generateSampleSchedule(transformedAssignments)
      }

      // Load subjects
      const subjectsResponse = await fetch('/api/subjects')
      const subjectsData = await subjectsResponse.json()

      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, Subject> = {}
        subjectsData.subjects.forEach((subject: Subject) => {
          subjectsMap[subject.id] = subject
        })
        setSubjects(subjectsMap)
      }

      // Load sections
      const sectionsResponse = await fetch('/api/sections')
      const sectionsData = await sectionsResponse.json()

      if (sectionsResponse.ok && sectionsData.sections) {
        const sectionsMap: Record<string, Section> = {}
        sectionsData.sections.forEach((section: Section) => {
          sectionsMap[section.id] = section
        })
        setSections(sectionsMap)
      }

      // Load grades
      const gradesResponse = await fetch('/api/grades')
      const gradesData = await gradesResponse.json()

      if (gradesResponse.ok && gradesData.grades) {
        const gradesMap: Record<string, Grade> = {}
        gradesData.grades.forEach((grade: Grade) => {
          gradesMap[grade.id] = grade
        })
        setGrades(gradesMap)
      }
    } catch (error) {
      console.error('Error loading teacher schedule:', error)
      toast.error('Failed to load your schedule')
    } finally {
      setLoading(false)
    }
  }

  const generateSampleSchedule = (assignments: TeacherAssignment[]) => {
    // This is a simplified schedule generation
    // In a real system, schedules would be stored in the database
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const timeSlots = [
      '8:00 AM - 9:00 AM',
      '9:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '1:00 PM - 2:00 PM',
      '2:00 PM - 3:00 PM',
      '3:00 PM - 4:00 PM',
    ]

    const generatedSchedule: ScheduleItem[] = []
    let scheduleIndex = 0

    assignments.forEach((assignment, index) => {
      const subject = subjects[assignment.subjectId]
      const section = sections[assignment.sectionId]

      if (subject && section) {
        const grade = grades[section.gradeId]
        if (grade) {
          // Assign each assignment to a different time slot/day combination
          const dayIndex = scheduleIndex % days.length
          const timeIndex =
            Math.floor(scheduleIndex / days.length) % timeSlots.length

          generatedSchedule.push({
            subject,
            section,
            grade,
            timeSlot: timeSlots[timeIndex],
            day: days[dayIndex],
          })

          scheduleIndex++
        }
      }
    })

    setSchedule(generatedSchedule)
  }

  const getSubjectColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-900': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#064e3b',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#581c87',
    }
    return colorMap[color] || '#1e40af'
  }

  const getGradeColor = (color: string): string => {
    return getSubjectColor(color)
  }

  // Group schedule by day
  const scheduleByDay = schedule.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = []
    }
    acc[item.day].push(item)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

  // Sort time slots within each day
  Object.keys(scheduleByDay).forEach((day) => {
    scheduleByDay[day].sort((a, b) => {
      const timeA = a.timeSlot.split(' - ')[0]
      const timeB = b.timeSlot.split(' - ')[0]
      return timeA.localeCompare(timeB)
    })
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Calendar size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Teaching Schedule
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your weekly teaching schedule
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(
            (day, index) => (
              <Card
                key={day}
                className="p-6 border-none bg-gray-50 border-1 shadow-sm border-blue-900"
              >
                <div className="animate-pulse">
                  <h3
                    className="text-lg font-medium text-gray-900 mb-4"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {day}
                  </h3>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white p-3 border border-gray-200"
                      >
                        <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-2 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      </div>
    )
  }

  if (schedule.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Calendar size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Teaching Schedule
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your weekly teaching schedule
            </p>
          </div>
        </div>

        <Card className="p-12 text-center border-none bg-gray-50 border-1 shadow-sm border-blue-900">
          <Calendar
            size={48}
            className="mx-auto text-gray-400 mb-4"
            weight="duotone"
          />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No Schedule Available
          </h3>
          <p
            className="text-gray-600 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Your teaching schedule will be available once your class assignments
            are configured and a schedule has been created.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Calendar size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Teaching Schedule ({schedule.length} sessions)
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your weekly teaching schedule
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <Card
            key={day}
            className="p-6 border-none bg-gray-50 border-1 shadow-sm border-blue-900"
          >
            <h3
              className="text-lg font-medium text-gray-900 mb-4"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {day}
            </h3>

            <div className="space-y-3">
              {scheduleByDay[day]?.map((item, index) => (
                <div
                  key={`${item.subject.id}-${item.section.id}-${index}`}
                  className="bg-white p-3 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Time */}
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-gray-500" />
                    <span
                      className="text-xs text-gray-600 font-mono"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {item.timeSlot}
                    </span>
                  </div>

                  {/* Subject */}
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 flex-shrink-0"
                      style={{
                        backgroundColor: getSubjectColor(item.subject.color),
                      }}
                    ></div>
                    <span
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {item.subject.code}
                    </span>
                  </div>

                  {/* Subject Name */}
                  <div
                    className="text-xs text-gray-700 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {item.subject.code} {item.subject.name}
                  </div>

                  {/* Section and Grade */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-gray-500" />
                      <span
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {item.section.sectionName} - {item.section.rank}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 flex-shrink-0"
                        style={{
                          backgroundColor: getGradeColor(item.grade.color),
                        }}
                      ></div>
                      <span
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Grade {item.grade.gradeLevel}
                      </span>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-400">
                  <Calendar
                    size={32}
                    className="mx-auto mb-2"
                    weight="duotone"
                  />
                  <p
                    className="text-xs"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    No classes scheduled
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Schedule Summary */}
      <Card className="p-6 bg-blue-50 border border-blue-200">
        <h3
          className="text-lg font-medium text-blue-900 mb-4"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Schedule Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div
              className="text-2xl font-bold text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {schedule.length}
            </div>
            <div
              className="text-xs text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Total Sessions
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {new Set(schedule.map((s) => s.subject.id)).size}
            </div>
            <div
              className="text-xs text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Subjects
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {new Set(schedule.map((s) => s.section.id)).size}
            </div>
            <div
              className="text-xs text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Sections
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {Object.keys(scheduleByDay).length}
            </div>
            <div
              className="text-xs text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Days Active
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
