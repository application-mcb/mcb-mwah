'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GradeData, DEPARTMENTS } from '@/lib/types/grade-section';
import { Pencil, Trash, BookOpen, Plus, GraduationCap, Eye, MagnifyingGlass, Building, Users } from '@phosphor-icons/react';

interface GradeListProps {
  grades: GradeData[];
  sectionsCount?: { [gradeId: string]: number };
  onEditGrade: (grade: GradeData) => void;
  onDeleteGrade: (grade: GradeData) => void;
  onViewGrade: (grade: GradeData) => void;
  onCreateNew: () => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  totalGradesCount?: number;
  selectedDepartments?: string[];
  onDepartmentToggle?: (department: string) => void;
}

// Color mapping for icon colors
const getIconColor = (bgColor: string): string => {
  const colorMap: { [key: string]: string } = {
    'blue-800': '#1e40af',     // blue-800
    'red-800': '#991b1b',      // red-800
    'emerald-800': '#064e3b',  // emerald-800
    'yellow-800': '#92400e',   // yellow-800
    'orange-800': '#9a3412',   // orange-800
    'violet-800': '#5b21b6',   // violet-800
    'purple-800': '#581c87'    // purple-800
  };
  return colorMap[bgColor] || '#1e40af'; // default to blue-800
};

// Color mapping for background colors
const getBgColor = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'blue-800': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#064e3b',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#581c87'
  };
  return colorMap[color] || '#1e40af'; // default to blue-800
};

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
  onDepartmentToggle
}: GradeListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'JHS': return 'bg-blue-900 text-white border-blue-900';
      case 'SHS': return 'bg-blue-900 text-white border-blue-900';
      default: return 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200';
    }
  };

  // Helper function to format grade level display
  const formatGradeLevel = (grade: GradeData): string => {
    if (grade.strand && (grade.gradeLevel === 11 || grade.gradeLevel === 12)) {
      return `G${grade.gradeLevel}${grade.strand}`;
    }
    if (grade.gradeLevel >= 7 && grade.gradeLevel <= 12) {
      return `G${grade.gradeLevel}`;
    }
    return `Grade ${grade.gradeLevel}`;
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
              Grade Level Management
            </h2>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Loading grade levels...
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse flex-1 min-w-[300px] max-w-[400px]">
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
        <div>
          <h2
            className="text-2xl font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Grade Level Management
          </h2>
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Manage grade levels and their sections 
          </p>
        </div>
        <Button
          onClick={onCreateNew}
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          className="flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Grade Level</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              weight="duotone"
            />
            <input
              type="text"
              placeholder="Search grade levels..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
        </div>

        {/* Department Filters */}
        {onDepartmentToggle && (
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                onClick={() => onDepartmentToggle(dept)}
                className={`px-3 py-1 text-xs font-medium rounded-none border transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  selectedDepartments.includes(dept)
                    ? `${getDepartmentColor(dept)} shadow-lg animate-in zoom-in-95`
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 hover:shadow-md'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {dept === 'JHS' ? 'Junior HS' :
                 dept === 'SHS' ? 'Senior HS' :
                 'College'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grades Grid */}
      {grades.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GraduationCap size={48} className="mx-auto text-blue-900 animate-bounce" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No Grade Levels Found
          </h3>
          <p
            className="text-blue-900 text-sm text-justify w-1/2 border-1 shadow-sm border-blue-900 p-3 bg-blue-100"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {searchQuery || selectedDepartments.length > 0
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first grade level Get started by creating your first grade level today! It’s quick and easy. just set it up, organize your students, and start building a fun, engaging, and smooth learning experience for everyone.'}
          </p>
          <Button
            onClick={onCreateNew}
            className='w-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg animate-pulse'
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <Plus size={16} className="mr-2 transition-transform duration-300 hover:rotate-90" />
            Create First Grade Level
          </Button>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-4">
          {grades.map((grade, index) => (
            <Card
              key={grade.id}
              className="p-6 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 flex-1 min-w-[300px] max-w-[400px]"
              style={{
                backgroundColor: getBgColor(grade.color),
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Card Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-white flex items-center justify-center flex-shrink-0">
                  <GraduationCap
                    size={24}
                    style={{ color: getIconColor(grade.color) }}
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
                  <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-none border border-white/30 bg-white/20 text-white mb-3">
                    <Building size={12} className="mr-1" weight="duotone" />
                    {grade.department === 'JHS' ? 'Junior HS' :
                     grade.department === 'SHS' ? 'Senior HS' :
                     'College'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p
                className="text-sm text-white/90 mb-4 line-clamp-3"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {grade.description}
              </p>

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

              {/* Action Buttons - moved to bottom */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewGrade(grade)}
                  className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Eye size={14} className="transition-transform duration-200 group-hover:scale-110" />
                  Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditGrade(grade)}
                  className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Pencil size={14} className="transition-transform duration-200 group-hover:scale-110" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteGrade(grade)}
                  className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Trash size={14} className="transition-transform duration-200 group-hover:scale-110" />
                  Delete
                </Button>
              </div>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
