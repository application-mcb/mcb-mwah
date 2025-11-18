'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { ExtendedEnrollmentData } from './enrollment-management/types'
import { EventData } from '@/lib/types/events'
import { Task } from '@/lib/types/task'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  GraduationCap,
  BookOpen,
  ChartBar,
  Users,
  ChatCircleDots,
  Bell,
  ListChecks,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  Student,
  ChalkboardTeacher,
  ClockClockwise,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { formatDateRangeAsWords } from '@/lib/utils/date-formatter'
import * as PhosphorIcons from '@phosphor-icons/react'
import { TaskDatabase } from '@/lib/task-database'

interface RegistrarOverviewProps {
  registrarUid: string
  registrarName?: string
}

export default function RegistrarOverview({
  registrarUid,
  registrarName,
}: RegistrarOverviewProps) {
  const [enrollments, setEnrollments] = useState<ExtendedEnrollmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventData[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentAY, setCurrentAY] = useState('')
  const [currentSemester, setCurrentSemester] = useState('1')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!registrarUid) return

    const unsubscribe = TaskDatabase.subscribeToTasks(
      registrarUid,
      (newTasks) => {
        setTasks(newTasks)
      }
    )

    return () => unsubscribe()
  }, [registrarUid])

  useEffect(() => {
    loadEvents()
    loadUnreadMessages()
  }, [registrarUid])

  const loadData = async () => {
    try {
      setLoading(true)

      const configResponse = await fetch('/api/enrollment?getConfig=true')
      const configData = await configResponse.json()

      if (configResponse.ok && configData.ayCode) {
        setCurrentAY(configData.ayCode)
      }
      if (configResponse.ok && configData.semester) {
        setCurrentSemester(configData.semester)
      }

      const response = await fetch('/api/enrollment?getEnrolledStudents=true')
      const data = await response.json()

      if (response.ok && data.success) {
        const enrollmentsData: ExtendedEnrollmentData[] = data.enrollments || []
        setEnrollments(enrollmentsData)
      }
    } catch (error) {
      console.error('Error loading overview data:', error)
      toast.error('Failed to load overview data', { autoClose: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()

      if (response.ok && data.success && data.events) {
        const allEvents = data.events
        const now = new Date()
        const activeEvents = allEvents.filter((event: EventData) => {
          const startDate = new Date(event.startDate)
          const endDate = event.endDate ? new Date(event.endDate) : null
          return (
            (now >= startDate && (!endDate || now <= endDate)) ||
            now < startDate
          )
        })
        setEvents(activeEvents.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const loadUnreadMessages = async () => {
    try {
      const response = await fetch(
        `/api/chat/contacts?userId=${registrarUid}&role=registrar`
      )
      const data = await response.json()

      if (response.ok && data.success && data.contacts) {
        const totalUnread = data.contacts.reduce(
          (sum: number, contact: any) => sum + (contact.unreadCount || 0),
          0
        )
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('Error loading unread messages:', error)
    }
  }

  // Filter enrollments by current AY and semester
  const filteredEnrollments = useMemo(() => {
    if (!currentAY) return []

    return enrollments.filter((enrollment) => {
      const enrollmentAY = enrollment.enrollmentInfo?.schoolYear
      const enrollmentSemester = enrollment.enrollmentInfo?.semester
      const enrollmentLevel = enrollment.enrollmentInfo?.level
      const enrollmentDepartment = enrollment.enrollmentInfo?.department

      if (enrollmentAY !== currentAY) return false

      const isCollege = enrollmentLevel === 'college'
      const isSHS =
        enrollmentLevel === 'high-school' && enrollmentDepartment === 'SHS'

      if (isCollege || isSHS) {
        const semesterValue =
          currentSemester === '1' ? 'first-sem' : 'second-sem'
        return enrollmentSemester === semesterValue
      }

      return true
    })
  }, [enrollments, currentAY, currentSemester])

  // Calculate students by level
  const studentsByLevel = useMemo(() => {
    let junior = 0
    let senior = 0
    let college = 0

    filteredEnrollments.forEach((enrollment) => {
      const level = enrollment.enrollmentInfo?.level
      const department = enrollment.enrollmentInfo?.department

      if (level === 'college') {
        college++
      } else if (level === 'high-school') {
        if (department === 'SHS') {
          senior++
        } else {
          junior++
        }
      }
    })

    return { junior, senior, college }
  }, [filteredEnrollments])

  // Calculate regular vs irregular
  const regularVsIrregular = useMemo(() => {
    let regular = 0
    let irregular = 0

    filteredEnrollments.forEach((enrollment) => {
      const studentType = enrollment.enrollmentInfo?.studentType || 'regular'
      if (studentType === 'regular') {
        regular++
      } else {
        irregular++
      }
    })

    return { regular, irregular }
  }, [filteredEnrollments])

  // Prepare chart data
  const levelChartData = [
    { name: 'Junior', students: studentsByLevel.junior },
    { name: 'Senior', students: studentsByLevel.senior },
    { name: 'College', students: studentsByLevel.college },
  ]

  const regularIrregularChartData = [
    { name: 'Regular', value: regularVsIrregular.regular },
    { name: 'Irregular', value: regularVsIrregular.irregular },
  ]

  // Get latest 5 enrollments
  const latestEnrollments = useMemo(() => {
    return filteredEnrollments
      .sort((a, b) => {
        const dateA = new Date(a.submittedAt || 0).getTime()
        const dateB = new Date(b.submittedAt || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [filteredEnrollments])

  // Get pending tasks
  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => task.status === 'pending').slice(0, 5)
  }, [tasks])

  const getIconComponent = (iconName: string) => {
    const IconComponent =
      (PhosphorIcons as any)[iconName] || PhosphorIcons.Calendar
    return IconComponent
  }

  const formatFullName = (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => {
    const parts = [firstName, middleName, lastName].filter(Boolean)
    const name = parts.join(' ')
    return nameExtension ? `${name} ${nameExtension}` : name
  }

  const formatDate = (dateInput: any) => {
    try {
      if (!dateInput) return 'N/A'

      let date: Date

      // Handle Firestore Timestamp objects (before JSON serialization)
      if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        date = dateInput.toDate()
      }
      // Handle serialized Firestore timestamps (after JSON serialization)
      else if (
        dateInput &&
        typeof dateInput === 'object' &&
        ('_seconds' in dateInput || 'seconds' in dateInput)
      ) {
        const seconds = dateInput._seconds || dateInput.seconds
        const nanoseconds = dateInput._nanoseconds || dateInput.nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      }
      // Handle string dates
      else if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      }
      // Handle number timestamps (milliseconds)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput)
      }
      // Handle Date objects
      else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        return 'N/A'
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A'
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  const getEnrollmentDisplayInfo = (enrollment: ExtendedEnrollmentData) => {
    const level = enrollment.enrollmentInfo?.level
    const department = enrollment.enrollmentInfo?.department
    const gradeLevel = enrollment.enrollmentInfo?.gradeLevel
    const courseCode = enrollment.enrollmentInfo?.courseCode
    const courseName = enrollment.enrollmentInfo?.courseName
    const yearLevel = enrollment.enrollmentInfo?.yearLevel
    const strand = enrollment.enrollmentInfo?.strand

    if (level === 'college') {
      return `${courseCode || courseName || 'N/A'} - Year ${yearLevel || 'N/A'}`
    } else if (level === 'high-school') {
      if (department === 'SHS') {
        return `Grade ${gradeLevel || 'N/A'} - ${strand || 'SHS'}`
      } else {
        return `Grade ${gradeLevel || 'N/A'} - JHS`
      }
    }
    return 'N/A'
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4" style={{ fontFamily: 'Poppins' }}>
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-xl"></div>
            <div className="h-7 bg-white/20 rounded-lg w-32"></div>
          </div>
          <div className="h-4 bg-white/10 rounded w-64 mt-2"></div>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-6 bg-white/20 rounded-lg w-24"></div>
            <div className="h-6 bg-white/20 rounded-lg w-32"></div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="p-3 rounded-xl border border-gray-200 bg-white animate-pulse"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-300 rounded w-12"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card
              key={i}
              className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-[250px] bg-gray-100 rounded-lg">
                <div className="p-4 space-y-3">
                  <div className="flex items-end gap-2 h-full">
                    <div
                      className="flex-1 bg-gray-200 rounded-t-lg"
                      style={{ height: '60%' }}
                    ></div>
                    <div
                      className="flex-1 bg-gray-300 rounded-t-lg"
                      style={{ height: '80%' }}
                    ></div>
                    <div
                      className="flex-1 bg-gray-200 rounded-t-lg"
                      style={{ height: '45%' }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="h-2 bg-gray-200 rounded w-16"></div>
                    <div className="h-2 bg-gray-200 rounded w-16"></div>
                    <div className="h-2 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Enrollment Table Skeleton */}
        <Card className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            {/* Table Header */}
            <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg p-2">
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3 bg-white/20 rounded w-full"></div>
                ))}
              </div>
            </div>
            {/* Table Rows */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-2 p-2 border-b border-gray-200"
              >
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </Card>

        {/* Events and Tasks Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Events Skeleton */}
          <Card className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-28"></div>
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-2 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded w-full"></div>
                      <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-100 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tasks Skeleton */}
          <Card className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-200"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-400 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-300 rounded w-full"></div>
                      <div className="h-2 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4" style={{ fontFamily: 'Poppins' }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <h1
          className="text-2xl font-light text-white flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
            <ChartBar size={20} weight="fill" className="text-blue-900" />
          </div>
          Overview
        </h1>
        <p
          className="text-xs text-blue-100 mt-1"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Quick summary of your registrar dashboard
        </p>
        {currentAY && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
              <Calendar size={12} className="text-blue-900" weight="bold" />
              <span
                className="text-xs font-mono text-blue-900"
                style={{ fontFamily: 'monospace' }}
              >
                AY: {currentAY}
              </span>
            </div>
            {currentSemester && (
              <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
                <Calendar size={12} className="text-blue-900" weight="bold" />
                <span
                  className="text-xs font-mono text-blue-900"
                  style={{ fontFamily: 'monospace' }}
                >
                  Semester: {currentSemester === '1' ? '1st' : '2nd'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <Users size={16} className="text-white" weight="fill" />
              </div>
              <div>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Students
                </p>
                <p
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'monospace', fontWeight: 500 }}
                >
                  {filteredEnrollments.length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <ChatCircleDots
                  size={16}
                  className="text-white"
                  weight="fill"
                />
              </div>
              <div>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Messages
                </p>
                <p
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'monospace', fontWeight: 500 }}
                >
                  {unreadCount}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <Bell size={16} className="text-white" weight="fill" />
              </div>
              <div>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Events
                </p>
                <p
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'monospace', fontWeight: 500 }}
                >
                  {events.length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <ListChecks size={16} className="text-white" weight="fill" />
              </div>
              <div>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Tasks
                </p>
                <p
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'monospace', fontWeight: 500 }}
                >
                  {pendingTasks.length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Students by Level Chart */}
        <Card className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-blue-900" weight="fill" />
            <h2
              className="text-xs font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Students by Level
            </h2>
          </div>
          <div style={{ width: '100%', height: '250px', minHeight: '250px' }}>
            {levelChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelChartData}>
                  <defs>
                    <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'monospace', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontWeight: 400,
                    }}
                    formatter={(value: any) => [value, '']}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorLevel)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No data available
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Regular vs Irregular Chart */}
        <Card className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-blue-900" weight="fill" />
            <h2
              className="text-xs font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Regular vs Irregular
            </h2>
          </div>
          <div style={{ width: '100%', height: '250px', minHeight: '250px' }}>
            {regularIrregularChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regularIrregularChartData}>
                  <defs>
                    <linearGradient
                      id="colorRegularIrregular"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'monospace', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontWeight: 400,
                    }}
                    formatter={(value: any) => [value, '']}
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#colorRegularIrregular)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No data available
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Enrollment Table */}
      <Card className="p-4 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Student size={16} className="text-blue-900" weight="fill" />
          <h2
            className="text-xs font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Latest Enrollments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg">
              <tr>
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-white uppercase tracking-wider rounded-tl-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-1">
                    <User size={12} weight="fill" />
                    Student
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-white uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-1">
                    <GraduationCap size={12} weight="fill" />
                    Level
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-white uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-1">
                    <CheckCircle size={12} weight="fill" />
                    Status
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-white uppercase tracking-wider rounded-tr-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-1">
                    <Clock size={12} weight="fill" />
                    Submitted
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {latestEnrollments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500 text-xs"
                    style={{ fontFamily: 'monospace', fontWeight: 300 }}
                  >
                    No enrollments found.
                  </td>
                </tr>
              ) : (
                latestEnrollments.map((enrollment) => {
                  const personalInfo = enrollment.personalInfo
                  const fullName = formatFullName(
                    personalInfo?.firstName,
                    personalInfo?.middleName,
                    personalInfo?.lastName,
                    personalInfo?.nameExtension
                  )
                  const status = enrollment.enrollmentInfo?.status || 'pending'
                  const statusColors: Record<string, string> = {
                    enrolled: 'bg-green-100 text-green-800',
                    pending: 'bg-yellow-100 text-yellow-800',
                    revoked: 'bg-red-100 text-red-800',
                  }
                  const statusColor =
                    statusColors[status] || 'bg-gray-100 text-gray-800'
                  const statusIcon =
                    status === 'enrolled' ? (
                      <CheckCircle size={10} weight="fill" />
                    ) : status === 'pending' ? (
                      <Hourglass size={10} weight="fill" />
                    ) : (
                      <XCircle size={10} weight="fill" />
                    )

                  return (
                    <tr key={enrollment.userId} className="hover:bg-gray-50">
                      <td
                        className="px-3 py-2 whitespace-nowrap text-xs"
                        style={{ fontFamily: 'monospace', fontWeight: 400 }}
                      >
                        {fullName || 'N/A'}
                      </td>
                      <td
                        className="px-3 py-2 whitespace-nowrap text-xs"
                        style={{ fontFamily: 'monospace', fontWeight: 300 }}
                      >
                        {getEnrollmentDisplayInfo(enrollment)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-lg flex items-center gap-1 w-fit ${statusColor}`}
                          style={{ fontFamily: 'monospace', fontWeight: 400 }}
                        >
                          {statusIcon}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td
                        className="px-3 py-2 whitespace-nowrap text-xs text-gray-600"
                        style={{ fontFamily: 'monospace', fontWeight: 300 }}
                      >
                        {formatDate(enrollment.submittedAt)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Events and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Events List */}
        <Card className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-blue-900" weight="fill" />
            <h2
              className="text-xs font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Upcoming Events
            </h2>
          </div>
          <div className="space-y-2">
            {events.length === 0 ? (
              <p
                className="text-xs text-gray-500 text-center py-4"
                style={{ fontFamily: 'monospace', fontWeight: 300 }}
              >
                No upcoming events
              </p>
            ) : (
              events.map((event) => {
                const IconComponent = getIconComponent(event.icon)
                const colorMap: Record<string, string> = {
                  'blue-900': 'bg-blue-900',
                  'blue-800': 'bg-blue-800',
                  'red-800': 'bg-red-800',
                  'emerald-800': 'bg-emerald-800',
                  'yellow-800': 'bg-yellow-800',
                  'orange-800': 'bg-orange-800',
                  'violet-800': 'bg-violet-800',
                  'purple-800': 'bg-purple-800',
                }
                const bgColor = colorMap[event.color] || 'bg-blue-900'

                return (
                  <div
                    key={event.id}
                    className="p-2 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <IconComponent
                          size={14}
                          className="text-white"
                          weight="fill"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-xs font-medium text-gray-900 mb-0.5"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {event.title}
                        </h3>
                        <p
                          className="text-[10px] text-gray-600 mb-1.5 line-clamp-2"
                          style={{ fontFamily: 'monospace', fontWeight: 300 }}
                        >
                          {event.description}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Calendar size={10} weight="duotone" />
                          <span
                            style={{ fontFamily: 'monospace', fontWeight: 300 }}
                          >
                            {formatDateRangeAsWords(
                              event.startDate,
                              event.endDate
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Tasks List */}
        <Card className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks size={16} className="text-blue-900" weight="fill" />
            <h2
              className="text-xs font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Pending Tasks
            </h2>
          </div>
          <div className="space-y-2">
            {pendingTasks.length === 0 ? (
              <p
                className="text-xs text-gray-500 text-center py-4"
                style={{ fontFamily: 'monospace', fontWeight: 300 }}
              >
                No pending tasks
              </p>
            ) : (
              pendingTasks.map((task) => {
                const gradientMap: Record<string, string> = {
                  'blue-900': 'from-blue-900 to-blue-800',
                  'green-600': 'from-green-600 to-green-700',
                  'yellow-600': 'from-yellow-600 to-yellow-700',
                  'orange-600': 'from-orange-600 to-orange-700',
                  'red-600': 'from-red-600 to-red-700',
                  'purple-600': 'from-purple-600 to-purple-700',
                  'pink-600': 'from-pink-600 to-pink-700',
                  'teal-600': 'from-teal-600 to-teal-700',
                }
                const gradientClass =
                  gradientMap[task.color] || 'from-blue-900 to-blue-800'

                return (
                  <div
                    key={task.id}
                    className={`p-2 rounded-xl bg-gradient-to-br ${gradientClass} border border-white/20 shadow-sm`}
                  >
                    <div className="flex items-start gap-2">
                      <ClockClockwise
                        size={12}
                        className="text-white"
                        weight="fill"
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-xs font-medium text-white mb-0.5"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p
                            className="text-[10px] text-white/90 mb-1.5 line-clamp-2"
                            style={{ fontFamily: 'monospace', fontWeight: 300 }}
                          >
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-white/80">
                            <Calendar size={10} weight="duotone" />
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 300,
                              }}
                            >
                              {new Date(task.dueDate).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
