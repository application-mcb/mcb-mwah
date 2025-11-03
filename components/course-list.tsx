'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CourseData } from '@/lib/types/course';
import { Pencil, Trash, BookOpen, Plus, GraduationCap, Eye, MagnifyingGlass } from '@phosphor-icons/react';

interface CourseListProps {
  courses: CourseData[];
  onEditCourse: (course: CourseData) => void;
  onDeleteCourse: (course: CourseData) => void;
  onViewCourse: (course: CourseData) => void;
  onCreateNew: () => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  totalCoursesCount?: number;
  selectedColors?: string[];
  onColorToggle?: (color: string) => void;
}

// Helper function to get actual color value from course color
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-800': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8'
  };
  return colorMap[color] || '#1e40af'; // Default to blue if color not found
};

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
  onColorToggle
}: CourseListProps) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Course Management
            </h2>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Loading courses...
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="">
          <div className="flex items-center mb-2">
            <div className="flex items-center justify-center bg-blue-900 aspect-square w-12 h-12">
              <BookOpen size={20} className=" text-white" weight="fill" />
            </div>

            <h2 className="ml-2 text-3xl font-regular text-gray-900 mb-2">
              College Course Management
          </h2>
       </div>

        </div>

          <Button
            onClick={onCreateNew}
            className="bg-blue-900 hover:bg-blue-800"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <Plus size={20} className="mr-2" />
            Create Course
          </Button>
      </div>

      {/* Search Bar */}
      {onSearchChange && (
        <div className="mt-4">
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Search courses by code, name, or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-4 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg focus:scale-105"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>

          {/* Color Filter */}
          {onColorToggle && (
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <span
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Filter
                </span>
                {selectedColors.length > 0 && (
                  <button
                    onClick={() => {
                      // Clear all selected colors
                      selectedColors.forEach(color => onColorToggle!(color));
                    }}
                    className="ml-3 px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    ✕ Clear all ({selectedColors.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'blue-800', label: 'Blue', bg: 'bg-blue-800' },
                  { value: 'red-800', label: 'Red', bg: 'bg-red-800' },
                  { value: 'emerald-800', label: 'Emerald', bg: 'bg-emerald-800' },
                  { value: 'yellow-800', label: 'Yellow', bg: 'bg-yellow-800' },
                  { value: 'orange-800', label: 'Orange', bg: 'bg-orange-800' },
                  { value: 'violet-800', label: 'Violet', bg: 'bg-violet-800' },
                  { value: 'purple-800', label: 'Purple', bg: 'bg-purple-800' }
                ].map((color) => {
                  const isSelected = selectedColors.includes(color.value);
                  return (
                    <button
                      key={color.value}
                      onClick={() => onColorToggle(color.value)}
                      className={`flex items-center space-x-2 px-3 py-2 border-1 shadow-sm transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'border-blue-900 bg-gray-50 shadow-lg animate-in zoom-in-95'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      <div className={`w-4 h-4 ${color.bg} border border-white`}></div>
                      <span
                        className={`text-sm ${
                          isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {color.label}
                      </span>
                      {isSelected && (
                        <div className="w-2 h-2 bg-blue-900"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results Info */}
          {(searchQuery || selectedColors.length > 0) && (
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Showing {courses.length} of {totalCoursesCount || courses.length} courses
                {searchQuery && <span> • Search: "{searchQuery}"</span>}
                {selectedColors.length > 0 && (
                  <span> • Colors: {selectedColors.map(color => color.replace('-800', '').replace(/^\w/, c => c.toUpperCase())).join(', ')}</span>
                )}
              </span>
              {(searchQuery || selectedColors.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange && onSearchChange('')}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors duration-200"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      ✕ Clear search
                    </button>
                  )}
                  {selectedColors.length > 0 && onColorToggle && (
                    <button
                      onClick={() => {
                        selectedColors.forEach(color => onColorToggle(color));
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors duration-200"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      ✕ Clear colors
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BookOpen size={48} className="mx-auto text-blue-900 animate-bounce" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
           Umm, it seems like you haven't created any courses yet.
          </h3>
          <p
            className="text-gray-800 max-w-xl font-light text-justify text-sm border-1 shadow-sm border-blue-900 p-3 bg-blue-100"
          >
            Start by picking a subject college students will enjoy, set clear goals, and create fun, engaging lessons. Add multimedia, assignments, and assessments. Encourage interaction, offer helpful resources, keep everything accessible, welcome feedback, and always look for ways to improve.
          </p>
          <Button
            onClick={onCreateNew}
            className="bg-blue-900 w-xl hover:bg-blue-800 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg animate-pulse"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <Plus size={20} className="mr-2 transition-transform duration-300 hover:rotate-90" />
            Create Your First Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, index) => (
            <Card
              key={course.code}
              className={`p-6 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm bg-${course.color} text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4`}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-white flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={24} style={{ color: getColorValue(course.color) }} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3
                      className="text-lg font-semibold text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {course.code}
                    </h3>
                    <div className="w-3 h-3 bg-white/30"></div>
                    <div className="w-3 h-3 bg-white/20"></div>
                    <div className="w-3 h-3 bg-white/10"></div>
                  </div>
                  <p
                    className="text-sm text-white/90 line-clamp-2 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {course.name}
                  </p>
                  {course.description && (
                    <p
                      className="text-xs text-white/70 line-clamp-2 mb-3"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {course.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="pt-2 border-t border-white/20">
                  <p
                    className="text-xs text-white/60 mb-3"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Created {formatDate(course.createdAt)}
                  </p>
                </div>
                
                {/* Action Buttons - moved below created date */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewCourse(course)}
                    className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <Eye size={14} className="transition-transform duration-200" />
                    Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditCourse(course)}
                    className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <Pencil size={14} className="transition-transform duration-200" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteCourse(course)}
                    className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <Trash size={14} className="transition-transform duration-200" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
