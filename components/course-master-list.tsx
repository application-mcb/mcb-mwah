'use client'

import { useEffect, useMemo, useState } from 'react'
import { CourseData } from '@/lib/types/course'
import Print from '@/components/print'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'
import { MagnifyingGlass } from '@phosphor-icons/react'

interface CourseStudentEntry {
  id: string
  name: string
  yearLevel: string
}

interface CourseMasterListProps {
  course: CourseData | null
  students: CourseStudentEntry[]
  isOpen: boolean
  isLoading: boolean
  academicYear?: string
  onClose: () => void
}

const CourseMasterList = ({
  course,
  students,
  isOpen,
  isLoading,
  academicYear,
  onClose,
}: CourseMasterListProps) => {
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setSearchQuery('')
  }, [course?.code, isOpen])

  const filteredStudents = useMemo(() => {
    if (!course || students.length === 0) {
      return []
    }
    if (!searchQuery.trim()) {
      return students
    }
    const term = searchQuery.toLowerCase()
    return students.filter(
      (student) =>
        student.id.toLowerCase().includes(term) ||
        student.name.toLowerCase().includes(term) ||
        student.yearLevel.toLowerCase().includes(term)
    )
  }, [students, searchQuery, course])

  if (!isOpen || !course) {
    return null
  }

  const printTitle = `Course Master List - ${course.code}`
  const totalStudents = filteredStudents.length

  return (
    <Print onClose={onClose} title={printTitle}>
      <div className="print-document p-4 space-y-4">
        {/* Header */}
        <div className="print-header border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Marian College Logo"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1
                  className="text-xl text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {SCHOOL_NAME_FORMAL}
                </h1>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  908 Gil Carlos St. San Jose, Baliwag, Bulacan
                </p>
                {academicYear && (
                  <p
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Academic Year: {academicYear}
                  </p>
                )}
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Generated:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-sm text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {course.code}
              </p>
              <p
                className="text-xs text-gray-600 max-w-xs"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {course.name}
              </p>
            </div>
          </div>
        </div>

        {/* Controls (hidden in print) */}
        <div className="no-print">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, name, or year level..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Showing {totalStudents} student{totalStudents === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="print-section">
          <table className="print-table w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th
                  className="text-left text-xs text-gray-600 uppercase tracking-wide border border-gray-200 px-4 py-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  ID
                </th>
                <th
                  className="text-left text-xs text-gray-600 uppercase tracking-wide border border-gray-200 px-4 py-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Name
                </th>
                <th
                  className="text-left text-xs text-gray-600 uppercase tracking-wide border border-gray-200 px-4 py-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Year Level
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, index) => (
                  <tr key={`loading-${index}`} className="animate-pulse">
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="border border-gray-200 px-4 py-6 text-center text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    No students found for this course.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={`${student.id}-${student.name}`}>
                    <td
                      className="border border-gray-200 px-4 py-3 text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {student.id}
                    </td>
                    <td
                      className="border border-gray-200 px-4 py-3 text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {student.name}
                    </td>
                    <td
                      className="border border-gray-200 px-4 py-3 text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {student.yearLevel}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Print>
  )
}

export default CourseMasterList
