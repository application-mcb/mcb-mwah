'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GradeData, DEPARTMENTS } from '@/lib/types/grade-section'
import {
  Pencil,
  Trash,
  Plus,
  GraduationCap,
  Eye,
  Building,
  Users,
} from '@phosphor-icons/react'

interface GradeListProps {
  grades: GradeData[]
  sectionsCount?: { [gradeId: string]: number }
  onEditGrade: (grade: GradeData) => void
  onDeleteGrade: (grade: GradeData) => void
  onViewGrade: (grade: GradeData) => void
  onCreateNew: () => void
  loading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  totalGradesCount?: number
  selectedDepartments?: string[]
  onDepartmentToggle?: (department: string) => void
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

export default function GradeList({
  grades,
  sectionsCount = {},
  onEditGrade,
  onDeleteGrade,
  onViewGrade,
  onCreateNew,
  loading = false,
  searchQuery = '',
  onSearchChange,
  totalGradesCount,
  selectedDepartments = [],
  onDepartmentToggle,
}: GradeListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'JHS':
        return 'bg-gradient-to-br from-blue-900 to-blue-800 text-white border-blue-900'
      case 'SHS':
        return 'bg-gradient-to-br from-blue-900 to-blue-800 text-white border-blue-900'
      default:
        return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
          <h2
            className="text-2xl font-medium text-white"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Grade Level Management
          </h2>
          <p
            className="text-sm text-white/80"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Loading grade levels...
          </p>
        </div>
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg">
          <div className="h-10 bg-gray-200 rounded-lg mb-4"></div>
        </div>
        <div className="flex flex-wrap gap-6">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="p-6 animate-pulse bg-white border border-gray-200 rounded-xl flex-[1_1_min(100%,_350px)]"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                  <div className="h-3 bg-gray-200 w-1/2 rounded"></div>
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
            <h2
              className="text-2xl font-medium text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Grade Level Management
            </h2>
            <p
              className="text-sm text-white/80"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Manage grade levels and their sections
            </p>
          </div>
          <Button
            onClick={onCreateNew}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            className="flex items-center space-x-2 bg-white text-blue-900 hover:bg-gray-100 rounded-lg"
          >
            <Plus size={16} />
            <span>Add Grade Level</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg w-full min-w-0">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search grade levels..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>

          {/* Department Filters */}
          {onDepartmentToggle && (
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => onDepartmentToggle(dept)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all duration-300 ease-in-out ${
                    selectedDepartments.includes(dept)
                      ? `${getDepartmentColor(dept)} shadow-lg`
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
        </div>
      </div>

      {/* Grades Grid */}
      {grades.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-gray-200 rounded-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap size={32} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No Grade Levels Found
          </h3>
          <p
            className="text-gray-600 text-sm text-justify w-full max-w-md border border-gray-200 shadow-sm p-3 bg-white rounded-xl mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {searchQuery || selectedDepartments.length > 0
              ? 'Try adjusting your search or filters.'
              : "Get started by creating your first grade level today! It's quick and easy. Just set it up, organize your students, and start building a fun, engaging, and smooth learning experience for everyone."}
          </p>
          <Button
            onClick={onCreateNew}
            className="bg-gradient-to-br from-blue-900 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 transition-all duration-300 hover:scale-105 rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <Plus size={16} className="mr-2" />
            Create First Grade Level
          </Button>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-6">
          {grades.map((grade, index) => {
            const shadowColor = getShadowColor(grade.color)
            const iconColor = getIconColor(grade.color)
            return (
              <Card
                key={grade.id}
                className={`group p-6 border-none hover:-translate-y-2 transition-all duration-300 ease-in-out text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col rounded-xl flex-[1_1_min(100%,_350px)] ${getGradientClasses(
                  grade.color
                )}`}
                style={{
                  animationDelay: `${index * 100}ms`,
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
                    <GraduationCap
                      size={24}
                      style={{ color: iconColor }}
                      weight="fill"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-medium text-white mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {formatGradeLevel(grade)}
                    </h3>
                    <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-lg border border-white/30 bg-white/20 text-white mb-3">
                      <Building size={12} className="mr-1" weight="duotone" />
                      {grade.department === 'JHS'
                        ? 'Junior HS'
                        : grade.department === 'SHS'
                        ? 'Senior HS'
                        : 'College'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm text-white/90 mb-4 line-clamp-3"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {grade.description}
                  </p>
                </div>

                {/* Sections Count and Created Date */}
                <div className="flex items-center justify-between text-xs text-white/70 mb-4 border-t border-white/30 pt-3">
                  <div className="flex items-center space-x-1">
                    <Users size={14} weight="duotone" />
                    <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      {sectionsCount[grade.id] || 0} sections
                    </span>
                  </div>
                  <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    Created {formatDate(grade.createdAt)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewGrade(grade)}
                    className="bg-white hover:bg-gray-100 justify-start text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: 300,
                      color: iconColor,
                    }}
                  >
                    <Eye size={14} style={{ color: iconColor }} />
                    <span className="ml-1" style={{ color: iconColor }}>
                      Details
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditGrade(grade)}
                    className="bg-white hover:bg-gray-100 justify-start text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: 300,
                      color: iconColor,
                    }}
                  >
                    <Pencil size={14} style={{ color: iconColor }} />
                    <span className="ml-1" style={{ color: iconColor }}>
                      Edit
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteGrade(grade)}
                    className="bg-white hover:bg-gray-100 justify-start text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: 300,
                      color: iconColor,
                    }}
                  >
                    <Trash size={14} style={{ color: iconColor }} />
                    <span className="ml-1" style={{ color: iconColor }}>
                      Delete
                    </span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
