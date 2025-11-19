'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, FileArrowDown, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import {
  CSV_COLUMNS,
  generateCSV,
  downloadCSV,
  getAcademicYearFromFilters,
  CSVColumn,
} from '@/lib/utils/csv-export'
import { formatFullName } from '@/components/enrollment-management/utils/format'
import { getDateRange, getDateTimestamp } from '@/components/enrollment-management/utils/date'

interface ExportCSVModalProps {
  isOpen: boolean
  onClose: () => void
  enrollments: any[]
  studentProfiles: Record<string, any>
  subjects: Record<string, any>
  sections: Record<string, any[]>
  courses: any[]
  grades: Record<string, any>
  currentAY: string
}

const CATEGORIES = [
  { key: 'personal', label: 'Personal Information' },
  { key: 'enrollment', label: 'Enrollment Information' },
  { key: 'guardian', label: 'Guardian Information' },
  { key: 'system', label: 'System Information' },
  { key: 'subjects', label: 'Subjects' },
] as const

export default function ExportCSVModal({
  isOpen,
  onClose,
  enrollments,
  studentProfiles,
  subjects,
  sections,
  courses,
  grades,
  currentAY,
}: ExportCSVModalProps) {
  // Filter states
  const [ayFilter, setAyFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [studentTypeFilter, setStudentTypeFilter] = useState<('regular' | 'irregular')[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Column selection - all selected by default
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    CSV_COLUMNS.map((col) => col.key)
  )

  // Get filtered enrollments
  const filteredEnrollments = useMemo(() => {
    let filtered = [...enrollments]

    // Filter by AY
    if (ayFilter && ayFilter.trim()) {
      const filterValue = ayFilter.trim().toUpperCase()
      filtered = filtered.filter((enrollment) => {
        const enrollmentAY = (enrollment.enrollmentInfo?.schoolYear || '').trim().toUpperCase()
        return enrollmentAY === filterValue
      })
    }

    // Filter by semester (college only)
    if (semesterFilter) {
      filtered = filtered.filter((enrollment) => {
        const isCollege = enrollment.enrollmentInfo?.level === 'college'
        if (!isCollege) return true
        const filterSemesterValue =
          semesterFilter === '1' ? 'first-sem' : semesterFilter === '2' ? 'second-sem' : null
        const enrollmentSemester = enrollment.enrollmentInfo?.semester
        return enrollmentSemester === filterSemesterValue
      })
    }

    // Filter by student type (multiple selection allowed)
    if (studentTypeFilter.length > 0) {
      filtered = filtered.filter((enrollment) => {
        const studentType = enrollment.enrollmentInfo?.studentType || 'regular'
        return studentTypeFilter.includes(studentType as 'regular' | 'irregular')
      })
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter((enrollment) => {
        const status = enrollment.enrollmentInfo?.status || ''
        return status === statusFilter
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((enrollment) => {
        const fullName = formatFullName(
          enrollment.personalInfo?.firstName,
          enrollment.personalInfo?.middleName,
          enrollment.personalInfo?.lastName,
          enrollment.personalInfo?.nameExtension
        ).toLowerCase()
        const email = String(enrollment.personalInfo?.email || '').toLowerCase()
        const gradeLevel = String(enrollment.enrollmentInfo?.gradeLevel || '').toLowerCase()
        const status = String(enrollment.enrollmentInfo?.status || '').toLowerCase()

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          gradeLevel.includes(query) ||
          status.includes(query)
        )
      })
    }

    return filtered
  }, [enrollments, ayFilter, semesterFilter, studentTypeFilter, statusFilter, searchQuery])

  // Handle column toggle
  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnKey)) {
        return prev.filter((key) => key !== columnKey)
      } else {
        return [...prev, columnKey]
      }
    })
  }

  // Handle category select all/deselect all
  const handleCategoryToggle = (category: string) => {
    const categoryColumns = CSV_COLUMNS.filter((col) => col.category === category).map(
      (col) => col.key
    )
    const allSelected = categoryColumns.every((key) => selectedColumns.includes(key))

    setSelectedColumns((prev) => {
      if (allSelected) {
        return prev.filter((key) => !categoryColumns.includes(key))
      } else {
        const newColumns = [...prev]
        categoryColumns.forEach((key) => {
          if (!newColumns.includes(key)) {
            newColumns.push(key)
          }
        })
        return newColumns
      }
    })
  }

  // Handle export
  const handleExport = () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column to export', { autoClose: 3000 })
      return
    }

    if (filteredEnrollments.length === 0) {
      toast.error('No records match the selected filters', { autoClose: 3000 })
      return
    }

    try {
      const csvContent = generateCSV(
        filteredEnrollments,
        selectedColumns,
        studentProfiles,
        subjects,
        sections,
        courses,
        grades
      )

      const academicYear = getAcademicYearFromFilters(ayFilter, currentAY)
      const filename = `masters_list_${academicYear}.csv`

      downloadCSV(csvContent, filename)
      toast.success(`Exported ${filteredEnrollments.length} records to ${filename}`, {
        autoClose: 3000,
      })
      onClose()
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV. Please try again.', { autoClose: 5000 })
    }
  }

  // Reset filters when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAyFilter('')
      setSemesterFilter('')
      setStudentTypeFilter([])
      setStatusFilter('')
      setSearchQuery('')
      setSelectedColumns(CSV_COLUMNS.map((col) => col.key))
    }
  }, [isOpen])

  const getColumnsByCategory = (category: string): CSVColumn[] => {
    return CSV_COLUMNS.filter((col) => col.category === category)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export CSV" size="2xl">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Filters Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Export Filters</h3>
              <div className="space-y-4">
                {/* Academic Year */}
                <div>
                  <Label className="text-xs text-gray-700 mb-2 block">Academic Year</Label>
                  <Input
                    type="text"
                    placeholder="e.g., AY2526"
                    value={ayFilter}
                    onChange={(e) => setAyFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent uppercase"
                  />
                </div>

                {/* Semester */}
                <div>
                  <Label className="text-xs text-gray-700 mb-2 block">Semester</Label>
                  <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  >
                    <option value="">All Semesters</option>
                    <option value="1">First Semester (Q1)</option>
                    <option value="2">Second Semester (Q2)</option>
                  </select>
                </div>

                {/* Student Type */}
                <div>
                  <Label className="text-xs text-gray-700 mb-2 block">Student Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'regular', label: 'Regular' },
                      { key: 'irregular', label: 'Irregular' },
                    ].map((option) => {
                      const isSelected = studentTypeFilter.includes(option.key as 'regular' | 'irregular')
                      return (
                        <button
                          key={option.key}
                          onClick={() => {
                            if (isSelected) {
                              setStudentTypeFilter(
                                studentTypeFilter.filter((t) => t !== option.key)
                              )
                            } else {
                              setStudentTypeFilter([
                                ...studentTypeFilter,
                                option.key as 'regular' | 'irregular',
                              ])
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-900 text-white'
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {isSelected && <CheckCircle size={12} weight="bold" />}
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <Label className="text-xs text-gray-700 mb-2 block">Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Search Query */}
                <div>
                  <Label className="text-xs text-gray-700 mb-2 block">Search</Label>
                  <Input
                    type="text"
                    placeholder="Search by name, email, grade, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Preview Count */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-900" weight="bold" />
                <span className="text-xs font-medium text-blue-900">
                  {filteredEnrollments.length} record{filteredEnrollments.length !== 1 ? 's' : ''}{' '}
                  will be exported
                </span>
              </div>
            </div>
          </div>

          {/* Column Selection Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Select Columns</h3>
                <span className="text-xs text-gray-500">
                  {selectedColumns.length} of {CSV_COLUMNS.length} selected
                </span>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {CATEGORIES.map((category) => {
                  const categoryColumns = getColumnsByCategory(category.key)
                  const allSelected = categoryColumns.every((col) =>
                    selectedColumns.includes(col.key)
                  )
                  const someSelected = categoryColumns.some((col) => selectedColumns.includes(col.key))

                  return (
                    <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-medium text-gray-700">{category.label}</h4>
                        <button
                          onClick={() => handleCategoryToggle(category.key)}
                          className="text-xs text-blue-900 hover:text-blue-700 font-medium rounded-lg"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categoryColumns.map((column) => {
                          const isSelected = selectedColumns.includes(column.key)
                          return (
                            <button
                              key={column.key}
                              onClick={() => handleColumnToggle(column.key)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-blue-900 text-white'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              {isSelected && <CheckCircle size={12} weight="bold" />}
                              {column.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedColumns.length === 0 || filteredEnrollments.length === 0}
            className="px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-950 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileArrowDown size={16} weight="bold" />
            Export CSV
          </Button>
        </div>
      </div>
    </Modal>
  )
}

