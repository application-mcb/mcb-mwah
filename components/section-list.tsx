'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  SectionData,
  SectionRank,
  SECTION_RANKS,
  DEPARTMENTS,
  GradeData,
} from '@/lib/types/grade-section'
import { CourseData } from '@/lib/types/course'
import {
  Pencil,
  Trash,
  Users,
  Plus,
  GraduationCap,
  Eye,
  Building,
} from '@phosphor-icons/react'

interface SectionListProps {
  sections: SectionData[]
  grades: GradeData[] // Add grades prop for color inheritance
  courses?: CourseData[] // Add courses prop for college sections
  onEditSection: (section: SectionData) => void
  onDeleteSection: (section: SectionData) => void
  onViewSection: (section: SectionData) => void
  onCreateNew: () => void
  loading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  totalSectionsCount?: number
  selectedRanks?: string[]
  onRankToggle?: (rank: string) => void
  gradeFilter?: string // Specific grade ID to filter by
  selectedGrades?: string[]
  onGradeToggle?: (gradeId: string) => void
  selectedDepartments?: string[]
  onDepartmentToggle?: (department: string) => void
  selectedCourses?: string[]
  onCourseToggle?: (courseId: string) => void
}

export default function SectionList({
  sections,
  grades,
  courses = [],
  onEditSection,
  onDeleteSection,
  onViewSection,
  onCreateNew,
  loading = false,
  searchQuery = '',
  onSearchChange,
  totalSectionsCount,
  selectedRanks = [],
  onRankToggle,
  gradeFilter,
  selectedGrades = [],
  onGradeToggle,
  selectedDepartments = [],
  onDepartmentToggle,
  selectedCourses = [],
  onCourseToggle,
}: SectionListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Color mapping for grade colors
  const getGradeColor = (gradeId: string): string => {
    const grade = grades.find((g) => g.id === gradeId)
    return grade?.color || 'blue-900' // Default to blue if grade not found
  }

  // Color mapping for course colors
  const getCourseColor = (courseId: string): string => {
    const course = courses.find((c) => c.code === courseId)
    return course?.color || 'blue-900' // Default to blue if course not found
  }

  // Get color for either grade or course
  const getColor = (section: SectionData): string => {
    if (section.gradeId) {
      return getGradeColor(section.gradeId)
    } else if (section.courseId) {
      return getCourseColor(section.courseId)
    }
    return 'blue-900'
  }

  // Get gradient classes for card backgrounds
  const getGradientClasses = (color: string): string => {
    const gradientMap: { [key: string]: string } = {
      'blue-900': 'bg-gradient-to-br from-blue-800 to-blue-900',
      'blue-800': 'bg-gradient-to-br from-blue-700 to-blue-800',
      'red-800': 'bg-gradient-to-br from-red-700 to-red-800',
      'red-700': 'bg-gradient-to-br from-red-600 to-red-700',
      'emerald-800': 'bg-gradient-to-br from-emerald-700 to-emerald-800',
      'emerald-700': 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      'yellow-800': 'bg-gradient-to-br from-yellow-700 to-yellow-800',
      'yellow-700': 'bg-gradient-to-br from-yellow-600 to-yellow-700',
      'orange-800': 'bg-gradient-to-br from-orange-700 to-orange-800',
      'orange-700': 'bg-gradient-to-br from-orange-600 to-orange-700',
      'violet-800': 'bg-gradient-to-br from-violet-700 to-violet-800',
      'violet-700': 'bg-gradient-to-br from-violet-600 to-violet-700',
      'purple-800': 'bg-gradient-to-br from-purple-700 to-purple-800',
      'purple-700': 'bg-gradient-to-br from-purple-600 to-purple-700',
    }
    return gradientMap[color] || 'bg-gradient-to-br from-blue-800 to-blue-900'
  }

  // Get shadow color for cards (returns hex color)
  const getShadowColor = (color: string): string => {
    const shadowMap: { [key: string]: string } = {
      'blue-900': '#3b82f6',
      'blue-800': '#3b82f6',
      'red-800': '#ef4444',
      'red-700': '#ef4444',
      'emerald-800': '#10b981',
      'emerald-700': '#10b981',
      'yellow-800': '#eab308',
      'yellow-700': '#eab308',
      'orange-800': '#f97316',
      'orange-700': '#f97316',
      'violet-800': '#8b5cf6',
      'violet-700': '#8b5cf6',
      'purple-800': '#a855f7',
      'purple-700': '#a855f7',
    }
    return shadowMap[color] || '#3b82f6'
  }

  // Color mapping for background colors (for group headers)
  const getBgColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-900': '#1e40af',
      'blue-800': '#1e3a8a',
      'red-800': '#991b1b',
      'red-700': '#b91c1c',
      'emerald-800': '#065f46',
      'emerald-700': '#047857',
      'yellow-800': '#92400e',
      'yellow-700': '#a16207',
      'orange-800': '#9a3412',
      'orange-700': '#c2410c',
      'violet-800': '#5b21b6',
      'violet-700': '#7c3aed',
      'purple-800': '#6b21a8',
      'purple-700': '#8b5cf6',
    }
    return colorMap[color] || '#1e40af'
  }

  // Color mapping for icon colors
  const getIconColor = (bgColor: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-900': '#1e40af',
      'blue-800': '#1e3a8a',
      'red-800': '#991b1b',
      'red-700': '#b91c1c',
      'emerald-800': '#065f46',
      'emerald-700': '#047857',
      'yellow-800': '#92400e',
      'yellow-700': '#a16207',
      'orange-800': '#9a3412',
      'orange-700': '#c2410c',
      'violet-800': '#5b21b6',
      'violet-700': '#7c3aed',
      'purple-800': '#6b21a8',
      'purple-700': '#8b5cf6',
    }
    return colorMap[bgColor] || '#1e40af'
  }

  // Group sections by grade or course
  const groupSectionsByGrade = () => {
    const grouped: { [identifier: string]: SectionData[] } = {}

    sections.forEach((section) => {
      const identifier = section.gradeId || section.courseId
      if (identifier) {
        if (!grouped[identifier]) {
          grouped[identifier] = []
        }
        grouped[identifier].push(section)
      }
    })

    return grouped
  }

  // Get grade info for a grade ID
  const getGradeInfo = (gradeId: string) => {
    return grades.find((grade) => grade.id === gradeId)
  }

  // Get course info for a course ID
  const getCourseInfo = (courseId: string) => {
    return courses.find((course) => course.code === courseId)
  }

  // Get info for either grade or course
  const getInfo = (identifier: string) => {
    const grade = getGradeInfo(identifier)
    if (grade) return { type: 'grade', data: grade }
    const course = getCourseInfo(identifier)
    if (course) return { type: 'course', data: course }
    return null
  }

  // Get grades that have sections
  const getGradesWithSections = () => {
    const gradeIdsWithSections = new Set(
      sections.map((s) => s.gradeId).filter(Boolean)
    )
    return grades.filter((grade) => gradeIdsWithSections.has(grade.id))
  }

  // Get courses that have sections
  const getCoursesWithSections = () => {
    const courseIdsWithSections = new Set(
      sections.map((s) => s.courseId).filter(Boolean)
    )
    return courses.filter((course) => courseIdsWithSections.has(course.code))
  }

  // Get sorted grades (lowest to highest) - only those with sections
  const getSortedGrades = () => {
    return getGradesWithSections().sort((a, b) => a.gradeLevel - b.gradeLevel)
  }

  // Get sorted courses (alphabetically) - only those with sections
  const getSortedCourses = () => {
    return getCoursesWithSections().sort((a, b) => a.code.localeCompare(b.code))
  }

  // Extract grade level from grade ID for sorting
  const getGradeLevelFromId = (gradeId: string): number => {
    const gradeInfo = getGradeInfo(gradeId)
    return gradeInfo?.gradeLevel || 0
  }

  // Get sorted grade/course IDs (lowest to highest for grades, alphabetically for courses)
  const getSortedIdentifiers = (): string[] => {
    const grouped = groupSectionsByGrade()
    return Object.keys(grouped).sort((a, b) => {
      const infoA = getInfo(a)
      const infoB = getInfo(b)

      // If both are grades, sort by grade level
      if (infoA?.type === 'grade' && infoB?.type === 'grade') {
        return (
          (infoA.data as GradeData).gradeLevel -
          (infoB.data as GradeData).gradeLevel
        )
      }

      // If both are courses, sort alphabetically
      if (infoA?.type === 'course' && infoB?.type === 'course') {
        return (infoA.data as CourseData).code.localeCompare(
          (infoB.data as CourseData).code
        )
      }

      // Grades come before courses
      if (infoA?.type === 'grade') return -1
      if (infoB?.type === 'grade') return 1

      return 0
    })
  }

  const getRankColor = (rank: SectionRank) => {
    const rankIndex = SECTION_RANKS.indexOf(rank)
    const colors = [
      'bg-blue-100 text-blue-900 border-blue-200 rounded-lg', // A
      'bg-blue-200 text-blue-900 border-blue-300 rounded-lg', // B
      'bg-blue-300 text-blue-900 border-blue-400 rounded-lg', // C
      'bg-blue-400 text-blue-900 border-blue-500 rounded-lg', // D
      'bg-blue-500 text-white border-blue-600 rounded-lg', // E
      'bg-blue-600 text-white border-blue-900 rounded-lg', // F
      'bg-gradient-to-br from-blue-900 to-blue-800 text-white border-blue-900 rounded-lg', // G
      'bg-gradient-to-br from-blue-900 to-blue-800 text-white border-blue-900 rounded-lg', // H
    ]
    return (
      colors[rankIndex] ||
      'bg-blue-100 text-blue-900 border-blue-200 rounded-lg'
    )
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'JHS':
        return 'bg-blue-100 text-blue-900'
      case 'SHS':
        return 'bg-blue-200 text-blue-900'
      case 'COLLEGE':
        return 'bg-blue-300 text-blue-900'
      default:
        return 'bg-blue-100 text-blue-900'
    }
  }

  // Helper function to format grade level display
  const formatGradeLevel = (grade: GradeData): string => {
    if (grade.strand && (grade.gradeLevel === 11 || grade.gradeLevel === 12)) {
      return `G${grade.gradeLevel}${grade.strand}`
    }
    if (grade.gradeLevel >= 7 && grade.gradeLevel <= 12) {
      return `G${grade.gradeLevel}`
    }
    return `Grade ${grade.gradeLevel}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Section Management
            </h3>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Loading sections...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 w-3/4"></div>
                  <div className="h-3 bg-gray-200 w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-xl font-medium text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Section Management
            </h3>
            <p
              className="text-sm text-white/80"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {gradeFilter ? `Sections for selected grade` : `All sections`} (
              {totalSectionsCount || sections.length} total)
            </p>
          </div>
          <Button
            onClick={onCreateNew}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            className="flex items-center space-x-2 bg-white text-blue-900 hover:bg-gray-100 rounded-lg"
          >
            <Plus size={16} />
            <span>Add Section</span>
          </Button>
        </div>
      </div>

      {/* Search and Grade Filters */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg w-full min-w-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>

            {/* Grade Filters */}
            {onGradeToggle && (
              <div className="flex flex-wrap gap-2">
                {getSortedGrades().map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => onGradeToggle(grade.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      selectedGrades.includes(grade.id)
                        ? `${getGradientClasses(
                            grade.color
                          )} text-white border-transparent shadow-lg`
                        : `${getGradientClasses(
                            grade.color
                          )} text-white border-transparent opacity-50 hover:opacity-75`
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    G{grade.gradeLevel}
                  </button>
                ))}
              </div>
            )}

            {/* Course Filters */}
            {onCourseToggle && courses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getSortedCourses().map((course) => (
                  <button
                    key={course.code}
                    onClick={() => onCourseToggle(course.code)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      selectedCourses.includes(course.code)
                        ? `${getGradientClasses(
                            course.color
                          )} text-white border-transparent shadow-lg`
                        : `${getGradientClasses(
                            course.color
                          )} text-white border-transparent opacity-50 hover:opacity-75`
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {course.code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Department Filters */}
          {onDepartmentToggle && (
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => onDepartmentToggle(dept)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    selectedDepartments.includes(dept)
                      ? 'bg-gradient-to-br from-blue-900 to-blue-800 text-white border-transparent shadow-lg'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {dept === 'JHS'
                    ? 'Junior HS'
                    : dept === 'SHS'
                    ? 'Senior HS'
                    : 'College'}
                </button>
              ))}
            </div>
          )}

          {/* Rank Filters */}
          {onRankToggle && (
            <div className="flex flex-wrap gap-2">
              {SECTION_RANKS.map((rank) => (
                <button
                  key={rank}
                  onClick={() => onRankToggle(rank)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    selectedRanks.includes(rank)
                      ? getRankColor(rank) + ' shadow-lg'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {rank}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sections Grid */}
      {sections.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center mb-4">
            <Users size={32} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-lg font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No Sections Found
          </h3>
          <p
            className="text-gray-600 mb-4 w-full max-w-md text-sm text-justify border border-gray-200 p-4 bg-white rounded-xl"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {searchQuery || selectedRanks.length > 0
              ? 'Try adjusting your search or filters.'
              : gradeFilter
              ? 'No sections exist for this grade level yet.'
              : "Get started by creating your first section! It's quick and simple. Set it up, add students, and organize classes to build a smooth and engaging learning experience for everyone."}
          </p>
          <Button
            onClick={onCreateNew}
            className="bg-gradient-to-br from-blue-900 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <Plus size={16} className="mr-2" />
            Create First Section
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {getSortedIdentifiers().map((identifier, groupIndex) => {
            const groupSections = groupSectionsByGrade()[identifier]
            const info = getInfo(identifier)
            const color = info?.data.color || 'blue-900'

            let displayName = identifier
            if (info?.type === 'grade') {
              displayName = formatGradeLevel(info.data as GradeData)
            } else if (info?.type === 'course') {
              displayName = (info.data as CourseData).code
            }

            const description = info?.data.description || ''

            return (
              <div
                key={identifier}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${groupIndex * 150}ms` }}
              >
                {/* Grade/Course Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="w-4 h-4 opacity-60"
                      style={{ backgroundColor: getBgColor(color) }}
                    ></div>
                    <div
                      className="w-4 h-4 opacity-80"
                      style={{ backgroundColor: getBgColor(color) }}
                    ></div>
                    <div
                      className="w-4 h-4 "
                      style={{ backgroundColor: getBgColor(color) }}
                    ></div>
                    <hr className="flex-1 border border-gray-200" />

                    <h2
                      className="text-xl font-semibold text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {displayName}
                    </h2>
                  </div>
                  {description && (
                    <p
                      className="text-sm text-gray-600 ml-7 leading-relaxed text-justify"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {description}
                    </p>
                  )}
                </div>

                {/* Sections Grid */}
                <div className="flex flex-wrap gap-6 ml-7">
                  {groupSections
                    .sort((a, b) => a.rank.localeCompare(b.rank)) // Sort by rank A-Z
                    .map((section, sectionIndex) => {
                      const sectionColor = getColor(section)
                      const shadowColor = getShadowColor(sectionColor)
                      const iconColor = getIconColor(sectionColor)
                      return (
                        <Card
                          key={section.id}
                          className={`group p-6 border-none hover:-translate-y-2 transition-all duration-300 ease-in-out text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col rounded-xl flex-[1_1_min(100%,_350px)] ${getGradientClasses(
                            sectionColor
                          )}`}
                          style={{
                            animationDelay: `${
                              groupIndex * 150 + sectionIndex * 75 + 200
                            }ms`,
                            animationFillMode: 'both',
                            boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`,
                            minWidth: 0,
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = `0 20px 25px -5px ${shadowColor}40, 0 10px 10px -5px ${shadowColor}20, 0 0 0 1px ${shadowColor}40`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`
                          }}
                        >
                          {/* Card Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                              <Users
                                size={24}
                                style={{ color: iconColor }}
                                weight="fill"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3
                                className="text-lg font-medium text-white mb-2"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {section.sectionName}
                              </h3>
                              <div className="flex items-center space-x-2 mb-3">
                                <span
                                  className="text-sm text-white/90"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 300,
                                  }}
                                >
                                  {section.grade}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm text-white/90 mb-4 line-clamp-3 text-justify"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {section.description}
                            </p>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-white/70 mb-4 border-t border-white/30 pt-3">
                            <span
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              Created {formatDate(section.createdAt)}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="bg-white/20 px-2 py-1 font-light text-xs rounded-lg">
                                {section.rank}
                              </span>
                              <span className="bg-white/20 px-2 py-1 font-light text-xs rounded-lg">
                                {section.department}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewSection(section)}
                              className="bg-white hover:bg-gray-100 justify-start text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: 300,
                                color: iconColor,
                              }}
                            >
                              <Eye size={14} style={{ color: iconColor }} />
                              <span
                                className="ml-1"
                                style={{ color: iconColor }}
                              >
                                Details
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditSection(section)}
                              className="bg-white hover:bg-gray-100 justify-start text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: 300,
                                color: iconColor,
                              }}
                            >
                              <Pencil size={14} style={{ color: iconColor }} />
                              <span
                                className="ml-1"
                                style={{ color: iconColor }}
                              >
                                Edit
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteSection(section)}
                              className="bg-white hover:bg-gray-100 justify-start text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: 300,
                                color: iconColor,
                              }}
                            >
                              <Trash size={14} style={{ color: iconColor }} />
                              <span
                                className="ml-1"
                                style={{ color: iconColor }}
                              >
                                Delete
                              </span>
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
