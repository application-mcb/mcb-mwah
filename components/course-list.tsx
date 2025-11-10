'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CourseData } from '@/lib/types/course'
import {
  Pencil,
  Trash,
  BookOpen,
  Plus,
  GraduationCap,
  Eye,
  MagnifyingGlass,
} from '@phosphor-icons/react'

interface CourseListProps {
  courses: CourseData[]
  onEditCourse: (course: CourseData) => void
  onDeleteCourse: (course: CourseData) => void
  onViewCourse: (course: CourseData) => void
  onCreateNew: () => void
  loading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  totalCoursesCount?: number
  selectedColors?: string[]
  onColorToggle?: (color: string) => void
}

// Helper function to get actual color value from course color
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8',
  }
  return colorMap[color] || '#1e40af' // Default to blue if color not found
}

// Get gradient classes for card backgrounds
const getGradientClasses = (color: string): string => {
  const gradientMap: { [key: string]: string } = {
    'blue-900': 'bg-gradient-to-br from-blue-800 to-blue-900',
    'red-800': 'bg-gradient-to-br from-red-700 to-red-800',
    'emerald-800': 'bg-gradient-to-br from-emerald-700 to-emerald-800',
    'yellow-800': 'bg-gradient-to-br from-yellow-700 to-yellow-800',
    'orange-800': 'bg-gradient-to-br from-orange-700 to-orange-800',
    'violet-800': 'bg-gradient-to-br from-violet-700 to-violet-800',
    'purple-800': 'bg-gradient-to-br from-purple-700 to-purple-800',
  }
  return gradientMap[color] || 'bg-gradient-to-br from-blue-800 to-blue-900' // default to blue gradient
}

// Get shadow color for cards (returns hex color)
const getShadowColor = (color: string): string => {
  const shadowMap: { [key: string]: string } = {
    'blue-900': '#3b82f6', // blue-500
    'red-800': '#ef4444', // red-500
    'emerald-800': '#10b981', // emerald-500
    'yellow-800': '#eab308', // yellow-500
    'orange-800': '#f97316', // orange-500
    'violet-800': '#8b5cf6', // violet-500
    'purple-800': '#a855f7', // purple-500
  }
  return shadowMap[color] || '#3b82f6' // default to blue-500
}

export default function CourseList({
  courses,
  onEditCourse,
  onDeleteCourse,
  onViewCourse,
  onCreateNew,
  loading = false,
  searchQuery = '',
  onSearchChange,
  totalCoursesCount,
  selectedColors = [],
  onColorToggle,
}: CourseListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 bg-white/20 rounded w-64 animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded w-48 animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 bg-white/20 rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="flex flex-wrap gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 bg-white border border-gray-200 rounded-xl animate-pulse flex-[1_1_min(100%,_350px)]">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-blue-900" weight="fill" />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-white" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                College Course Management
              </h2>
              <p className="text-sm text-white/80" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Manage college courses and programs
              </p>
            </div>
          </div>

          <Button
            onClick={onCreateNew}
            className="bg-white text-blue-900 hover:bg-white/90 rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Plus size={20} className="mr-2" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {onSearchChange && (
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg w-full min-w-0">
          <div className="max-w-md mb-4">
            <div className="relative">
              <MagnifyingGlass
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
              <input
                type="text"
                placeholder="Search courses by code, name, or description..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 rounded-lg"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
          </div>

          {/* Color Filter */}
          {onColorToggle && (
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <span
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Filter by Color
                </span>
                {selectedColors.length > 0 && (
                  <button
                    onClick={() => {
                      // Clear all selected colors
                      selectedColors.forEach((color) => onColorToggle!(color))
                    }}
                    className="ml-3 px-3 py-1 text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 rounded-lg"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    ✕ Clear all ({selectedColors.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'blue-900', label: 'Blue', bg: 'bg-blue-900' },
                  { value: 'red-800', label: 'Red', bg: 'bg-red-800' },
                  {
                    value: 'emerald-800',
                    label: 'Emerald',
                    bg: 'bg-emerald-800',
                  },
                  { value: 'yellow-800', label: 'Yellow', bg: 'bg-yellow-800' },
                  { value: 'orange-800', label: 'Orange', bg: 'bg-orange-800' },
                  { value: 'violet-800', label: 'Violet', bg: 'bg-violet-800' },
                  { value: 'purple-800', label: 'Purple', bg: 'bg-purple-800' },
                ].map((color) => {
                  const isSelected = selectedColors.includes(color.value)
                  return (
                    <button
                      key={color.value}
                      onClick={() => onColorToggle(color.value)}
                      className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 transition-all duration-300 rounded-lg ${
                        isSelected
                          ? 'border-blue-900 bg-white shadow-md'
                          : 'hover:border-gray-400 hover:shadow-sm bg-white'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      <div
                        className={`w-4 h-4 ${color.bg} border border-white rounded`}
                      ></div>
                      <span
                        className={`text-sm ${
                          isSelected
                            ? 'text-blue-900 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {color.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Search Results Info */}
          {(searchQuery || selectedColors.length > 0) && (
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
              <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Showing {courses.length} of{' '}
                {totalCoursesCount || courses.length} courses
                {searchQuery && <span> • Search: "{searchQuery}"</span>}
                {selectedColors.length > 0 && (
                  <span>
                    {' '}
                    • Colors:{' '}
                    {selectedColors
                      .map((color) =>
                        color
                          .replace('-800', '')
                          .replace('-900', '')
                          .replace(/^\w/, (c) => c.toUpperCase())
                      )
                      .join(', ')}
                  </span>
                )}
              </span>
              {(searchQuery || selectedColors.length > 0) && (
                <button
                  onClick={() => {
                    if (searchQuery) onSearchChange && onSearchChange('')
                    if (selectedColors.length > 0 && onColorToggle) {
                      selectedColors.forEach((color) => onColorToggle(color))
                    }
                  }}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mb-4">
            <BookOpen
              size={32}
              className="text-white"
              weight="fill"
            />
          </div>
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No courses found
          </h3>
          <p className="text-gray-600 max-w-xl text-justify text-sm border border-gray-200 p-4 bg-white rounded-xl mb-4">
            Start by picking a subject college students will enjoy, set clear
            goals, and create fun, engaging lessons. Add multimedia,
            assignments, and assessments. Encourage interaction, offer helpful
            resources, keep everything accessible, welcome feedback, and always
            look for ways to improve.
          </p>
          <Button
            onClick={onCreateNew}
            className="bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Plus
              size={20}
              className="mr-2"
            />
            Create Your First Course
          </Button>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-6">
          {courses.map((course, index) => {
            const shadowColor = getShadowColor(course.color)
            return (
              <Card
                key={course.code}
                className={`p-6 hover:-translate-y-2 transition-all duration-300 ease-in-out border-none shadow-lg text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 rounded-xl h-full flex flex-col flex-[1_1_min(100%,_350px)] ${getGradientClasses(course.color)}`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both',
                  boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 25px 50px -12px ${shadowColor}80, 0 0 0 1px ${shadowColor}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap
                      size={28}
                      style={{ color: getColorValue(course.color) }}
                      weight="fill"
                    />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3
                      className="text-lg font-semibold text-white mb-2 truncate"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {course.code}
                    </h3>
                    <p
                      className="text-sm text-white/90 line-clamp-2 mb-2 break-words"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {course.name}
                    </p>
                    {course.description && (
                      <p
                        className="text-xs text-white/70 line-clamp-2 mb-3 break-words"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <div className="pt-2 border-t border-white/20">
                    <p
                      className="text-xs text-white/60 mb-3"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Created {formatDate(course.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewCourse(course)}
                      className="bg-white hover:bg-white/90 rounded-lg flex-1 justify-center text-xs"
                      style={{ fontFamily: 'Poppins', fontWeight: 400, color: getColorValue(course.color) }}
                    >
                      <Eye size={14} className="mr-1" />
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditCourse(course)}
                      className="bg-white hover:bg-white/90 rounded-lg flex-1 justify-center text-xs"
                      style={{ fontFamily: 'Poppins', fontWeight: 400, color: getColorValue(course.color) }}
                    >
                      <Pencil size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteCourse(course)}
                      className="bg-white hover:bg-white/90 rounded-lg flex-1 justify-center text-xs"
                      style={{ fontFamily: 'Poppins', fontWeight: 400, color: getColorValue(course.color) }}
                    >
                      <Trash size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
