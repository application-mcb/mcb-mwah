'use client'

import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  BookOpen,
  Users,
  MagnifyingGlass,
  Funnel,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'

interface TeacherClassesViewProps {
  teacherId: string
}

interface Subject {
  id: string
  code: string
  name: string
  description: string
  color: string
  lectureUnits: number
  labUnits: number
  totalUnits: number
  gradeLevel: number
  teacherAssignments?: Record<string, string[]>
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

export default function TeacherClassesView({
  teacherId,
}: TeacherClassesViewProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [subjects, setSubjects] = useState<Record<string, Subject>>({})
  const [sections, setSections] = useState<Record<string, Section>>({})
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string[]>([])

  useEffect(() => {
    loadTeacherAssignments()
  }, [teacherId])

  const loadTeacherAssignments = async () => {
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
      }

      // Load all subjects
      const subjectsResponse = await fetch('/api/subjects')
      const subjectsData = await subjectsResponse.json()

      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, Subject> = {}
        subjectsData.subjects.forEach((subject: Subject) => {
          subjectsMap[subject.id] = subject
        })
        setSubjects(subjectsMap)
      }

      // Load all sections
      const sectionsResponse = await fetch('/api/sections')
      const sectionsData = await sectionsResponse.json()

      if (sectionsResponse.ok && sectionsData.sections) {
        const sectionsMap: Record<string, Section> = {}
        sectionsData.sections.forEach((section: Section) => {
          sectionsMap[section.id] = section
        })
        setSections(sectionsMap)
      }

      // Load all grades
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
      console.error('Error loading teacher assignments:', error)
      toast.error('Failed to load your class assignments')
    } finally {
      setLoading(false)
    }
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

  // Group assignments by subject
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const subject = subjects[assignment.subjectId]
    if (!subject) return acc

    if (!acc[assignment.subjectId]) {
      acc[assignment.subjectId] = {
        subject,
        sections: [],
      }
    }

    const section = sections[assignment.sectionId]
    if (section) {
      acc[assignment.subjectId].sections.push(section)
    }

    return acc
  }, {} as Record<string, { subject: Subject; sections: Section[] }>)

  // Get unique grade levels for filtering
  const availableGrades = Array.from(
    new Set(
      Object.values(groupedAssignments)
        .map(({ subject }) => subject.gradeLevel)
        .filter((gradeLevel) => gradeLevel != null)
    )
  ).sort((a, b) => a - b)

  // Filter assignments based on search and grade filter
  const filteredAssignments = Object.entries(groupedAssignments).filter(
    ([subjectId, { subject, sections }]) => {
      // Grade filter - only show subjects with ANY of the selected grade levels
      if (
        selectedGradeFilter.length > 0 &&
        subject.gradeLevel != null &&
        !selectedGradeFilter.includes(subject.gradeLevel.toString())
      ) {
        return false
      }

      // Search filter
      const query = searchQuery.toLowerCase()
      if (query) {
        const subjectMatches =
          subject.name.toLowerCase().includes(query) ||
          subject.code.toLowerCase().includes(query)
        const sectionMatches = sections.some(
          (section) =>
            section.sectionName.toLowerCase().includes(query) ||
            section.rank.toLowerCase().includes(query) ||
            section.department.toLowerCase().includes(query)
        )
        return subjectMatches || sectionMatches
      }

      return true
    }
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-lg">
            <BookOpen size={22} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              My Classes
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your assigned subjects and sections
            </p>
          </div>
        </div>

        <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-blue-100 rounded w-32"></div>
                    <div className="h-2 bg-blue-100 rounded w-24"></div>
                  </div>
                </div>
                <div className="w-24 h-3 bg-blue-50 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (filteredAssignments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-lg">
            <BookOpen size={22} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              My Classes
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your assigned subjects and sections
            </p>
          </div>
        </div>

        <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4 space-y-4">
          <div className="relative flex-1 max-w-xl">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-900/60"
            />
            <input
              type="text"
              placeholder="Search subjects or sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-900/40 text-sm bg-white/70"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs text-blue-900/70"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Grade Levels:
            </span>
            <button
              onClick={() =>
                setSelectedGradeFilter(
                  selectedGradeFilter.length === availableGrades.length
                    ? []
                    : availableGrades.map((g) => g.toString())
                )
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                selectedGradeFilter.length === availableGrades.length
                  ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900'
                  : 'bg-white text-blue-900 border-blue-100 hover:border-blue-300'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {selectedGradeFilter.length === availableGrades.length
                ? 'Clear'
                : 'Select All'}
            </button>
            {availableGrades.map((gradeLevel) => {
              const gradeStr = gradeLevel.toString()
              const isSelected = selectedGradeFilter.includes(gradeStr)
              return (
                <button
                  key={gradeLevel}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedGradeFilter((prev) =>
                        prev.filter((id) => id !== gradeStr)
                      )
                    } else {
                      setSelectedGradeFilter((prev) => [...prev, gradeStr])
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900 shadow-md shadow-blue-900/30'
                      : 'bg-white text-blue-900 border-blue-100 hover:border-blue-300'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Grade {gradeLevel}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white/95 border border-dashed border-blue-200 rounded-2xl text-center px-8 py-10 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen size={32} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-xl font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {assignments.length === 0
              ? 'No Class Assignments Yet'
              : 'No Classes Match Your Search'}
          </h3>
          <p
            className="text-sm text-gray-600 mb-6"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {assignments.length === 0
              ? "You haven't been assigned to any subjects yet. Please coordinate with the registrar."
              : 'Try refining your search keywords or adjusting the grade filters.'}
          </p>
          {assignments.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedGradeFilter([])
              }}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-900/40"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-lg">
            <BookOpen size={22} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              My Classes ({filteredAssignments.length})
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your assigned subjects and sections
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-900/60"
            />
            <input
              type="text"
              placeholder="Search subjects or sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-blue-100 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-900/30 text-sm"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap bg-white/80 border border-blue-100 rounded-xl px-4 py-2.5 shadow-sm">
            <span
              className="text-xs uppercase tracking-wide text-blue-900/70"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Grades:
            </span>
            <button
              onClick={() =>
                setSelectedGradeFilter(
                  selectedGradeFilter.length === availableGrades.length
                    ? []
                    : availableGrades.map((g) => g.toString())
                )
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                selectedGradeFilter.length === availableGrades.length
                  ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900'
                  : 'bg-white text-blue-900 border-blue-100 hover:border-blue-300'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {selectedGradeFilter.length === availableGrades.length
                ? 'Clear'
                : 'All'}
            </button>
            {availableGrades.map((gradeLevel) => {
              const gradeStr = gradeLevel.toString()
              const isSelected = selectedGradeFilter.includes(gradeStr)
              return (
                <button
                  key={gradeLevel}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedGradeFilter((prev) =>
                        prev.filter((id) => id !== gradeStr)
                      )
                    } else {
                      setSelectedGradeFilter((prev) => [...prev, gradeStr])
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900 shadow shadow-blue-900/30'
                      : 'bg-white text-blue-900 border-blue-100 hover:border-blue-300'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Grade {gradeLevel}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {(searchQuery || selectedGradeFilter.length > 0) && (
        <div className="flex items-center flex-wrap gap-2 text-xs text-blue-900/80 bg-white/80 border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
          <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Showing {filteredAssignments.length} of{' '}
            {Object.keys(groupedAssignments).length} subjects
          </span>
          {searchQuery && (
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
              Search: "{searchQuery}"
            </span>
          )}
          {selectedGradeFilter.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
              Grades:{' '}
              {selectedGradeFilter.map((grade) => `Grade ${grade}`).join(', ')}
            </span>
          )}
        </div>
      )}

      <div className="bg-white/95 border border-blue-100 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={18} weight="fill" />
            </div>
            <div>
              <p
                className="text-sm uppercase tracking-wide text-white/80"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Subjects Overview
              </p>
              <p
                className="text-lg font-medium"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {filteredAssignments.length} Subject
                {filteredAssignments.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <span
            className="text-sm text-white/80"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {assignments.length} total section assignments
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50/80 text-blue-900 text-[11px] uppercase tracking-wide">
                <th
                  className="px-6 py-3 text-left font-medium"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                      <BookOpen size={14} weight="bold" />
                    </span>
                    Subject Details
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left font-medium"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                      <Users size={14} weight="bold" />
                    </span>
                    Sections ({assignments.length})
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 bg-white">
              {filteredAssignments.map(([subjectId, { subject, sections }]) => (
                <tr
                  key={subjectId}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg text-white"
                        style={{
                          backgroundColor: getSubjectColor(subject.color),
                        }}
                      >
                        <BookOpen size={18} weight="fill" />
                      </div>
                      <div className="space-y-1">
                        <p
                          className="text-sm font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {subject.code} — {subject.name}
                        </p>
                        <p
                          className="text-xs text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {subject.lectureUnits + subject.labUnits} units •
                          Grade {subject.gradeLevel}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      {sections.map((section) => (
                        <div
                          key={section.id}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/60 px-3 py-1 text-xs text-blue-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: getGradeColor(
                                grades[section.gradeId]?.color || 'blue-900'
                              ),
                            }}
                          ></span>
                          {section.sectionName} • {section.rank}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
