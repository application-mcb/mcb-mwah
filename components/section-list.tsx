'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionData, SectionRank, SECTION_RANKS, DEPARTMENTS, GradeData } from '@/lib/types/grade-section';
import { CourseData } from '@/lib/types/course';
import { Pencil, Trash, Users, Plus, GraduationCap, Eye, MagnifyingGlass, Trophy, Building } from '@phosphor-icons/react';

interface SectionListProps {
  sections: SectionData[];
  grades: GradeData[]; // Add grades prop for color inheritance
  courses?: CourseData[]; // Add courses prop for college sections
  onEditSection: (section: SectionData) => void;
  onDeleteSection: (section: SectionData) => void;
  onViewSection: (section: SectionData) => void;
  onCreateNew: () => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  totalSectionsCount?: number;
  selectedRanks?: string[];
  onRankToggle?: (rank: string) => void;
  gradeFilter?: string; // Specific grade ID to filter by
  selectedGrades?: string[];
  onGradeToggle?: (gradeId: string) => void;
  selectedDepartments?: string[];
  onDepartmentToggle?: (department: string) => void;
  selectedCourses?: string[];
  onCourseToggle?: (courseId: string) => void;
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
  onCourseToggle
}: SectionListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Color mapping for grade colors
  const getGradeColor = (gradeId: string): string => {
    const grade = grades.find(g => g.id === gradeId);
    return grade?.color || 'blue-800'; // Default to blue if grade not found
  };

  // Color mapping for course colors
  const getCourseColor = (courseId: string): string => {
    const course = courses.find(c => c.code === courseId);
    return course?.color || 'blue-800'; // Default to blue if course not found
  };

  // Get color for either grade or course
  const getColor = (section: SectionData): string => {
    if (section.gradeId) {
      return getGradeColor(section.gradeId);
    } else if (section.courseId) {
      return getCourseColor(section.courseId);
    }
    return 'blue-800';
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

  // Color mapping for icon colors
  const getIconColor = (bgColor: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-800': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#064e3b',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#581c87'
    };
    return colorMap[bgColor] || '#1e40af'; // default to blue-800
  };

  // Group sections by grade or course
  const groupSectionsByGrade = () => {
    const grouped: { [identifier: string]: SectionData[] } = {};

    sections.forEach(section => {
      const identifier = section.gradeId || section.courseId;
      if (identifier) {
        if (!grouped[identifier]) {
          grouped[identifier] = [];
        }
        grouped[identifier].push(section);
      }
    });

    return grouped;
  };

  // Get grade info for a grade ID
  const getGradeInfo = (gradeId: string) => {
    return grades.find(grade => grade.id === gradeId);
  };

  // Get course info for a course ID
  const getCourseInfo = (courseId: string) => {
    return courses.find(course => course.code === courseId);
  };

  // Get info for either grade or course
  const getInfo = (identifier: string) => {
    const grade = getGradeInfo(identifier);
    if (grade) return { type: 'grade', data: grade };
    const course = getCourseInfo(identifier);
    if (course) return { type: 'course', data: course };
    return null;
  };

  // Get grades that have sections
  const getGradesWithSections = () => {
    const gradeIdsWithSections = new Set(sections.map(s => s.gradeId).filter(Boolean));
    return grades.filter(grade => gradeIdsWithSections.has(grade.id));
  };

  // Get courses that have sections
  const getCoursesWithSections = () => {
    const courseIdsWithSections = new Set(sections.map(s => s.courseId).filter(Boolean));
    return courses.filter(course => courseIdsWithSections.has(course.code));
  };

  // Get sorted grades (lowest to highest) - only those with sections
  const getSortedGrades = () => {
    return getGradesWithSections().sort((a, b) => a.gradeLevel - b.gradeLevel);
  };

  // Get sorted courses (alphabetically) - only those with sections
  const getSortedCourses = () => {
    return getCoursesWithSections().sort((a, b) => a.code.localeCompare(b.code));
  };

  // Extract grade level from grade ID for sorting
  const getGradeLevelFromId = (gradeId: string): number => {
    const gradeInfo = getGradeInfo(gradeId);
    return gradeInfo?.gradeLevel || 0;
  };

  // Get sorted grade/course IDs (lowest to highest for grades, alphabetically for courses)
  const getSortedIdentifiers = (): string[] => {
    const grouped = groupSectionsByGrade();
    return Object.keys(grouped).sort((a, b) => {
      const infoA = getInfo(a);
      const infoB = getInfo(b);
      
      // If both are grades, sort by grade level
      if (infoA?.type === 'grade' && infoB?.type === 'grade') {
        return (infoA.data as GradeData).gradeLevel - (infoB.data as GradeData).gradeLevel;
      }
      
      // If both are courses, sort alphabetically
      if (infoA?.type === 'course' && infoB?.type === 'course') {
        return (infoA.data as CourseData).code.localeCompare((infoB.data as CourseData).code);
      }
      
      // Grades come before courses
      if (infoA?.type === 'grade') return -1;
      if (infoB?.type === 'grade') return 1;
      
      return 0;
    });
  };

  const getRankColor = (rank: SectionRank) => {
    const rankIndex = SECTION_RANKS.indexOf(rank);
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',    // A
      'bg-blue-200 text-blue-900 border-blue-300',    // B
      'bg-blue-300 text-blue-900 border-blue-400',    // C
      'bg-blue-400 text-blue-900 border-blue-500',    // D
      'bg-blue-500 text-white border-blue-600',       // E
      'bg-blue-600 text-white border-blue-700',       // F
      'bg-blue-700 text-white border-blue-800',       // G
      'bg-blue-800 text-white border-blue-900'        // H
    ];
    return colors[rankIndex] || 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'JHS': return 'bg-blue-100 text-blue-800';
      case 'SHS': return 'bg-blue-200 text-blue-900';
      case 'COLLEGE': return 'bg-blue-300 text-blue-900';
      default: return 'bg-blue-100 text-blue-800';
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {gradeFilter ? `Sections for selected grade` : `All sections`} ({totalSectionsCount || sections.length} total)
          </p>
        </div>
        <Button
          onClick={onCreateNew}
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          className="flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Section</span>
        </Button>
      </div>

      {/* Search and Grade Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative max-w-md">
        
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
          </div>

          {/* Grade Filters */}
          {onGradeToggle && (
            <div className="flex flex-wrap gap-2">
              {getSortedGrades().map((grade) => (
                <button
                  key={grade.id}
                  onClick={() => onGradeToggle(grade.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-none border transition-all duration-200 transform hover:scale-105 opacity-50 ${
                    selectedGrades.includes(grade.id)
                      ? `bg-${grade.color} text-white border-${grade.color} shadow-lg opacity-100`
                      : `bg-${grade.color} text-white border-${grade.color} hover:shadow-md`
                  }`}
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: 300,
                    ...(selectedGrades.includes(grade.id) && {
                      borderBottomColor: getBgColor(grade.color)
                    })
                  }}
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
                  className={`px-3 py-1 text-xs font-medium rounded-none border transition-all duration-200 transform hover:scale-105 opacity-50 ${
                    selectedCourses.includes(course.code)
                      ? `bg-${course.color} text-white border-${course.color} shadow-lg opacity-100`
                      : `bg-${course.color} text-white border-${course.color} hover:shadow-md`
                  }`}
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: 300,
                    ...(selectedCourses.includes(course.code) && {
                      borderBottomColor: getBgColor(course.color)
                    })
                  }}
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
                className={`px-3 py-1 text-xs font-medium rounded-none border transition-colors ${
                  selectedDepartments.includes(dept)
                    ? 'bg-blue-900 text-white border-blue-900 shadow-lg'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
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

        {/* Rank Filters */}
        {onRankToggle && (
          <div className="flex flex-wrap gap-2">
            {SECTION_RANKS.map((rank) => (
              <button
                key={rank}
                onClick={() => onRankToggle(rank)}
                className={`px-3 py-1 text-xs font-medium rounded-none border transition-colors ${
                  selectedRanks.includes(rank)
                    ? getRankColor(rank)
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {rank}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sections Grid */}
      {sections.length === 0 ? (
        <Card className="p-4 text-center flex flex-col items-center justify-center">
          <Users size={48} className="mx-auto text-gray-400" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No Sections Found
          </h3>
          <p
            className="text-gray-900 mb-4 w-xl text-sm text-justify border-4 border-blue-900 p-4 bg-blue-100"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {searchQuery || selectedRanks.length > 0
              ? 'Try adjusting your search or filters.'
              : gradeFilter
                ? 'No sections exist for this grade level yet.'
                : 'Get started by creating your first section! It’s quick and simple set it up, add students, and organize classes to build a smooth and engaging learning experience for everyone.'}
          </p>
          <Button
            onClick={onCreateNew}
            className="w-xl"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <Plus size={16} className="mr-2" />
            Create First Section
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {getSortedIdentifiers().map((identifier, groupIndex) => {
            const groupSections = groupSectionsByGrade()[identifier];
            const info = getInfo(identifier);
            const color = info?.data.color || 'blue-800';
            
            let displayName = identifier;
            if (info?.type === 'grade') {
              displayName = formatGradeLevel(info.data as GradeData);
            } else if (info?.type === 'course') {
              displayName = (info.data as CourseData).code;
            }
            
            const description = info?.data.description || '';

            return (
              <div key={identifier} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${groupIndex * 150}ms` }}>
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
                    <hr className="w-full border-1 shadow-sm" style={{ borderColor: getBgColor(color) }} />
                 
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
                <div className="flex flex-wrap gap-4 ml-7">
                  {groupSections
                    .sort((a, b) => a.rank.localeCompare(b.rank)) // Sort by rank A-Z
                    .map((section, sectionIndex) => (
                    <Card
                      key={section.id}
                      className="p-6 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 flex-1 min-w-[300px] max-w-[400px]"
                      style={{
                        backgroundColor: getBgColor(getColor(section)),
                        animationDelay: `${(groupIndex * 150) + (sectionIndex * 75) + 200}ms`,
                        animationFillMode: 'both'
                      }}
                    >
              {/* Card Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-white flex items-center justify-center flex-shrink-0">
                  <Users
                    size={20}
                    style={{ color: getIconColor(getColor(section)) }}
                    weight="fill"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-lg font-medium text-white mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {section.sectionName}
                  </h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <span
                      className="text-sm text-white/90"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {section.grade}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p
                className="text-sm text-white/90 mb-4 line-clamp-3 text-justify"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {section.description}
              </p>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-white/70 mb-4 border-t border-white/30 pt-3">
                <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  Created {formatDate(section.createdAt)}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="bg-white/20 px-2 py-1 font-light text-xs">
                    {section.rank}
                  </span>
                  <span className="bg-white/20 px-2 py-1 font-light text-xs">
                    {section.department}
                  </span>
                </div>
              </div>

              {/* Action Buttons - moved to bottom */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewSection(section)}
                  className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Eye size={14} className="transition-transform duration-200" />
                  Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditSection(section)}
                  className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Pencil size={14} className="transition-transform duration-200" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteSection(section)}
                  className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Trash size={14} className="transition-transform duration-200" />
                  Delete
                </Button>
              </div>

                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
