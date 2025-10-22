'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SubjectData } from '@/lib/subject-database';
import { GradeData } from '@/lib/grade-section-database';
import { Plus, MagnifyingGlass, BookOpen, Eye, Pencil, Trash, Calculator, Gear, Atom, Globe, Monitor, Palette, MusicNote, Book, Books } from '@phosphor-icons/react';

interface SubjectListProps {
  subjects: SubjectData[];
  grades: GradeData[]; // Add grades prop for color inheritance
  courses: any[]; // Add courses prop for color inheritance
  onEditSubject: (subject: SubjectData) => void;
  onDeleteSubject: (subject: SubjectData) => void;
  onViewSubject: (subject: SubjectData) => void;
  onCreateNew: () => void;
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  totalSubjectsCount?: number;
  selectedGradeLevel?: number;
  onGradeLevelChange?: (gradeLevel: number | undefined) => void;
}

const colorMap = {
  'blue-700': { bg: 'bg-blue-700', name: 'Blue 700' },
  'blue-800': { bg: 'bg-blue-800', name: 'Blue 800' },
  'red-700': { bg: 'bg-red-700', name: 'Red 700' },
  'red-800': { bg: 'bg-red-800', name: 'Red 800' },
  'emerald-700': { bg: 'bg-emerald-700', name: 'Emerald 700' },
  'emerald-800': { bg: 'bg-emerald-800', name: 'Emerald 800' },
  'yellow-700': { bg: 'bg-yellow-700', name: 'Yellow 700' },
  'yellow-800': { bg: 'bg-yellow-800', name: 'Yellow 800' },
  'orange-700': { bg: 'bg-orange-700', name: 'Orange 700' },
  'orange-800': { bg: 'bg-orange-800', name: 'Orange 800' },
  'violet-700': { bg: 'bg-violet-700', name: 'Violet 700' },
  'violet-800': { bg: 'bg-violet-800', name: 'Violet 800' },
  'purple-700': { bg: 'bg-purple-700', name: 'Purple 700' },
  'purple-800': { bg: 'bg-purple-800', name: 'Purple 800' },
  'indigo-700': { bg: 'bg-indigo-700', name: 'Indigo 700' },
  'indigo-800': { bg: 'bg-indigo-800', name: 'Indigo 800' },
};

// Function to get appropriate icon color based on background
const getIconColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-700': '#1d4ed8',
    'blue-800': '#1e40af',
    'red-700': '#b91c1c',
    'red-800': '#991b1b',
    'emerald-700': '#047857',
    'emerald-800': '#065f46',
    'yellow-700': '#a16207',
    'yellow-800': '#92400e',
    'orange-700': '#c2410c',
    'orange-800': '#9a3412',
    'violet-700': '#7c3aed',
    'violet-800': '#5b21b6',
    'purple-700': '#7c3aed',
    'purple-800': '#6b21a8',
    'indigo-700': '#4338ca',
    'indigo-800': '#312e81'
  };
  return colorMap[color] || '#1e40af'; // Default to blue if color not found
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

// Get sorted grades (lowest to highest)
const getSortedGrades = (grades: GradeData[]) => {
  return [...grades].sort((a, b) => a.gradeLevel - b.gradeLevel);
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

// Function to get appropriate icon based on subject content
const getSubjectIcon = (subject: SubjectData) => {
  const subjectName = subject.name.toLowerCase();
  const subjectCode = subject.code.toLowerCase();

  // Math-related subjects
  if (subjectName.includes('math') || subjectName.includes('calculus') || subjectName.includes('algebra') ||
      subjectName.includes('geometry') || subjectName.includes('trigonometry') || subjectName.includes('statistics') ||
      subjectCode.includes('math') || subjectCode.includes('calc')) {
    return Calculator;
  }

  // Science-related subjects
  if (subjectName.includes('science') || subjectName.includes('physics') || subjectName.includes('chemistry') ||
      subjectName.includes('biology') || subjectName.includes('geology') || subjectName.includes('astronomy') ||
      subjectCode.includes('sci') || subjectCode.includes('phy') || subjectCode.includes('chem') ||
      subjectCode.includes('bio')) {
    return Atom;
  }

  // Language/English subjects
  if (subjectName.includes('english') || subjectName.includes('language') || subjectName.includes('literature') ||
      subjectName.includes('grammar') || subjectName.includes('reading') || subjectName.includes('writing') ||
      subjectCode.includes('eng') || subjectCode.includes('lang')) {
    return Book;
  }

  // Social Studies/History subjects
  if (subjectName.includes('history') || subjectName.includes('social') || subjectName.includes('geography') ||
      subjectName.includes('civics') || subjectName.includes('economics') || subjectName.includes('government') ||
      subjectCode.includes('hist') || subjectCode.includes('soc') || subjectCode.includes('geo')) {
    return Globe;
  }

  // Computer/Technology subjects
  if (subjectName.includes('computer') || subjectName.includes('technology') || subjectName.includes('programming') ||
      subjectName.includes('coding') || subjectName.includes('ict') || subjectName.includes('digital') ||
      subjectCode.includes('comp') || subjectCode.includes('tech') || subjectCode.includes('prog')) {
    return Monitor;
  }

  // Art subjects
  if (subjectName.includes('art') || subjectName.includes('drawing') || subjectName.includes('painting') ||
      subjectName.includes('visual') || subjectName.includes('design') ||
      subjectCode.includes('art') || subjectCode.includes('draw')) {
    return Palette;
  }

  // Music subjects
  if (subjectName.includes('music') || subjectName.includes('choir') || subjectName.includes('band') ||
      subjectName.includes('orchestra') || subjectCode.includes('music')) {
    return MusicNote;
  }

  // Default icon for other subjects
  return BookOpen;
};

export default function SubjectList({
  subjects,
  grades,
  courses,
  onEditSubject,
  onDeleteSubject,
  onViewSubject,
  onCreateNew,
  loading = false,
  searchQuery = '',
  onSearchChange = () => {},
  totalSubjectsCount,
  selectedGradeLevel,
  onGradeLevelChange = () => {}
}: SubjectListProps) {
  

  // Filter subjects based on search query and grade level
  const filteredSubjects = useMemo(() => {
    let filtered = subjects;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter((subject) => (
        subject.name.toLowerCase().includes(searchTerm) ||
        subject.description.toLowerCase().includes(searchTerm)
      ));
    }

    // Apply grade level filter (supports both old and new data structure)
    if (selectedGradeLevel) {
      filtered = filtered.filter((subject) => {
        // Support both old structure (gradeLevel) and new structure (gradeLevels)
        if (subject.gradeLevels && Array.isArray(subject.gradeLevels)) {
          return subject.gradeLevels.includes(selectedGradeLevel);
        } else if (subject.gradeLevel) {
          return subject.gradeLevel === selectedGradeLevel;
        }
        return false;
      });
    }

    return filtered;
  }, [subjects, searchQuery, selectedGradeLevel]);

  // Group subjects by grade and course (supports both old and new data structure)
  const groupSubjectsByGrade = () => {
    const grouped: { [key: string]: SubjectData[] } = {};

    filteredSubjects.forEach((subject: SubjectData) => {
      // Support both old structure (gradeLevel) and new structure (gradeLevels)
      if (subject.gradeLevels && Array.isArray(subject.gradeLevels) && subject.gradeLevels.length > 0) {
        // New structure: subject has multiple grade levels
        subject.gradeLevels.forEach((gradeLevel: number) => {
          const key = `grade-${gradeLevel}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(subject);
        });
      } else if (subject.gradeLevel) {
        // Old structure: subject has single grade level
        const key = `grade-${subject.gradeLevel}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(subject);
      }
      
      // Handle course codes
      if (subject.courseCodes && Array.isArray(subject.courseCodes) && subject.courseCodes.length > 0) {
        subject.courseCodes.forEach((courseCode: string) => {
          const key = `course-${courseCode}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(subject);
        });
      }
    });

    return grouped;
  };

  // Get grade info for a grade level
  const getGradeInfo = (gradeLevel: number) => {
    return grades.find((grade: GradeData) => grade.gradeLevel === gradeLevel);
  };

  // Get course info for a course code
  const getCourseInfo = (courseCode: string) => {
    return courses.find((course: any) => course.code === courseCode);
  };

  // Get sorted grade levels and course codes
  const getSortedKeys = (): string[] => {
    const grouped = groupSubjectsByGrade();
    const keys = Object.keys(grouped);
    
    // Separate grade levels and course codes
    const gradeKeys = keys.filter(key => key.startsWith('grade-')).map(key => key.replace('grade-', '')).map(Number).sort((a, b) => a - b).map(num => `grade-${num}`);
    const courseKeys = keys.filter(key => key.startsWith('course-')).sort();
    
    return [...gradeKeys, ...courseKeys];
  };

  const clearFilters = () => {
    onSearchChange('');
    onGradeLevelChange(undefined);
  };

  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 animate-pulse rounded w-48"></div>
              <div className="h-4 bg-gray-100 animate-pulse rounded w-64"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 bg-gray-50 border-l-0 border-r-0 border-b-0">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-100 rounded w-20"></div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-gray-100 rounded"></div>
                    <div className="w-8 h-8 bg-gray-100 rounded"></div>
                    <div className="w-8 h-8 bg-gray-100 rounded"></div>
                  </div>
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

      {/* Search and Grade Filter */}
      <div className="bg-white p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-4 py-2 border-1 border-blue-900 rounded-none"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
          </div>

          {(searchQuery || selectedGradeLevel) && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Grade Level Filter - Always Visible */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-gray-700"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Filter by Grade Level
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onGradeLevelChange(undefined)}
              className={`px-3 py-1 text-xs font-medium rounded-none border transition-all duration-200 transform hover:scale-105 ${
                !selectedGradeLevel
                  ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              All Grades
            </button>
                {getSortedGrades(grades).map((grade) => {
                  const isSelected = selectedGradeLevel === grade.gradeLevel;
                  return (
                    <button
                      key={grade.id}
                      onClick={() => onGradeLevelChange(isSelected ? undefined : grade.gradeLevel)}
                      className={`x-3 py-1 aspect-square w-10 h-10 text-xs font-medium rounded-none border transition-all duration-200 transform hover:scale-105 ${
                        isSelected
                          ? `bg-${grade.color} text-white border-${grade.color} shadow-lg opacity-100`
                          : `bg-${grade.color} text-white border-${grade.color} hover:shadow-md opacity-40 hover:opacity-70`
                      }`}
                      style={{
                        fontFamily: 'Poppins',
                        fontWeight: 300,
                        ...(isSelected && {
                          borderBottomColor: getBgColor(grade.color)
                        })
                      }}
                    >
                      G{grade.gradeLevel}
                    </button>
                  );
                })}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
          Showing {filteredSubjects.length} of {totalSubjectsCount || subjects.length} subjects
        </span>
      </div>

      {/* Subject Grid */}
      {filteredSubjects.length === 0 ? (
        <Card className="w-full max-w-md mx-auto p-8 border-none text-center bg-gray-50 border-l-5 border-blue-900">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No subjects found
          </h3>
          <p
            className="text-blue-900 text-sm text-justify w-full border-l-5 border-blue-900 p-3 bg-blue-100 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {searchQuery || selectedGradeLevel
              ? 'Try adjusting your search or grade filter to find what you\'re looking for.'
              : 'Get started by creating your first subject! Set up engaging learning materials, define clear objectives, and start building a comprehensive curriculum that students will love.'}
          </p>
          <Button
            onClick={onCreateNew}
            className="bg-blue-900 w-full hover:bg-blue-800 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg animate-pulse"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <Plus size={20} className="mr-2 transition-transform duration-300 hover:rotate-90" />
            Create Your First Subject
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {getSortedKeys().map((key, keyIndex) => {
            const gradeSubjects = groupSubjectsByGrade()[key];
            
            // Determine if this is a grade level or course code
            const isGradeLevel = key.startsWith('grade-');
            const isCourseCode = key.startsWith('course-');
            
            let displayName = '';
            let gradeColor = 'blue-800';
            
            if (isGradeLevel) {
              const gradeLevel = parseInt(key.replace('grade-', ''));
              const gradeInfo = getGradeInfo(gradeLevel);
              displayName = gradeInfo ? formatGradeLevel(gradeInfo) : `Grade ${gradeLevel}`;
              gradeColor = gradeInfo?.color || 'blue-800';
            } else if (isCourseCode) {
              const courseCode = key.replace('course-', '');
              const courseInfo = getCourseInfo(courseCode);
              displayName = courseCode;
              gradeColor = courseInfo?.color || 'emerald-800'; // Use course color from database
            }

            return (
              <div key={key} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${keyIndex * 150}ms` }}>
                {/* Grade/Course Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="w-4 h-4 opacity-60"
                      style={{ backgroundColor: getBgColor(gradeColor) }}
                    ></div>
                    <div
                      className="w-4 h-4 opacity-80"
                      style={{ backgroundColor: getBgColor(gradeColor) }}
                    ></div>
                    <div
                      className="w-4 h-4"
                      style={{ backgroundColor: getBgColor(gradeColor) }}
                    ></div>
                    <hr className="w-full border-1" style={{ borderColor: getBgColor(gradeColor) }} />

                    <h2
                      className="text-xl font-semibold text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {displayName}
                    </h2>
                  </div>
                  {isGradeLevel && (() => {
                    const gradeLevel = parseInt(key.replace('grade-', ''));
                    const gradeInfo = getGradeInfo(gradeLevel);
                    return gradeInfo ? (
                      <p
                        className="text-sm text-gray-600 ml-7 leading-relaxed text-justify"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {gradeInfo.description}
                      </p>
                    ) : null;
                  })()}
                  {isCourseCode && (
                    <p
                      className="text-sm text-gray-600 ml-7 leading-relaxed text-justify"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Subjects applicable to {key.replace('course-', '')} students
                    </p>
                  )}
                </div>

                {/* Subjects Grid for this Grade */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-7">
                  {gradeSubjects && gradeSubjects.length > 0 ? gradeSubjects.map((subject, subjectIndex) => (
                    <Card
                      key={subject.id}
                      className={`group p-6 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-l-5 bg-${subject.color} text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col`}
                      style={{
                        animationDelay: `${(keyIndex * 150) + (subjectIndex * 75) + 200}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      {/* Card Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-white flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const IconComponent = getSubjectIcon(subject);
                            return (
                              <IconComponent
                                size={32}
                                style={{ color: getIconColor(subject.color) }}
                                weight="fill"
                              />
                            );
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3
                              className="text-lg font-medium text-white"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {subject.code}
                            </h3>
                            <div className="flex gap-1">
                              <div className="w-3 h-3 bg-white"></div>
                              <div className="w-3 h-3 bg-white/80"></div>
                              <div className="w-3 h-3 bg-white/60"></div>
                            </div>
                          </div>
                          
                          {/* Units badge */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center px-2 py-1 text-xs font-medium rounded-none border border-white/30 bg-white/20 text-white">
                              <Calculator size={12} className="mr-1" weight="duotone" />
                              {subject.lectureUnits + subject.labUnits} units
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Section - Flexible height */}
                      <div className="flex-1 flex flex-col">
                        {/* Subject Name and Description */}
                        <div className="mb-4">
                          <h4 className="text-white text-sm font-medium mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {subject.code} {subject.name}
                          </h4>
                          <div className="text-white/70 text-xs mb-2" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            Lab: {subject.labUnits}, Lecture: {subject.lectureUnits}
                          </div>
                          <div 
                            className="text-white/80 leading-relaxed text-sm" 
                            style={{
                              fontFamily: 'Poppins',
                              fontWeight: 300,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '3.6rem' // Ensure consistent height for 3 lines
                            }}
                          >
                            {subject.description}
                          </div>
                        </div>

                        {/* Action Buttons - Fixed at bottom */}
                        <div className="mt-auto">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewSubject(subject)}
                              className="text-white/80 hover:text-white hover:bg-white/20 justify-center text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              <Eye size={14} className="mr-1" weight="duotone" />
                              Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditSubject(subject)}
                              className="text-white/80 hover:text-white hover:bg-white/20 justify-center text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              <Pencil size={14} className="mr-1" weight="duotone" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteSubject(subject)}
                              className="text-white/80 hover:text-white hover:bg-white/20 justify-center text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              <Trash size={14} className="mr-1" weight="duotone" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-8 text-white/70">
                      <BookOpen size={32} className="mx-auto mb-2" weight="duotone" />
                      <p style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        No subjects found for this grade level
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
