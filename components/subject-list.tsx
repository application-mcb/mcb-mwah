'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SubjectData } from '@/lib/subject-database';
import { GradeData } from '@/lib/grade-section-database';
import { Plus, MagnifyingGlass, BookOpen, Eye, Pencil, Trash, Calculator, Gear,   } from '@phosphor-icons/react';

interface SubjectListProps {
  subjects: SubjectData[];
  grades: GradeData[]; // Add grades prop for color inheritance
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

export default function SubjectList({
  subjects,
  grades,
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

    // Apply grade level filter
    if (selectedGradeLevel) {
      filtered = filtered.filter((subject) => subject.gradeLevel === selectedGradeLevel);
    }

    return filtered;
  }, [subjects, searchQuery, selectedGradeLevel]);

  // Group subjects by grade
  const groupSubjectsByGrade = () => {
    const grouped: { [gradeLevel: number]: SubjectData[] } = {};

    filteredSubjects.forEach((subject: SubjectData) => {
      if (!grouped[subject.gradeLevel]) {
        grouped[subject.gradeLevel] = [];
      }
      grouped[subject.gradeLevel].push(subject);
    });

    return grouped;
  };

  // Get grade info for a grade level
  const getGradeInfo = (gradeLevel: number) => {
    return grades.find((grade: GradeData) => grade.gradeLevel === gradeLevel);
  };

  // Get sorted grade levels (lowest to highest)
  const getSortedGradeLevels = (): number[] => {
    const grouped = groupSubjectsByGrade();
    return Object.keys(grouped).map(Number).sort((a, b) => a - b);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <BookOpen size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Management
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Manage subjects and organize them by grade level and curriculum
            </p>
          </div>
        </div>
        <Button
          onClick={onCreateNew}
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          <Plus size={16} className="mr-2" />
          Create Subject
        </Button>
      </div>

      {/* Search and Grade Filter */}
      <div className="bg-white p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 border-1 border-blue-900 rounded-none"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
              <MagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
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
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
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
          {getSortedGradeLevels().map((gradeLevel, gradeIndex) => {
            const gradeSubjects = groupSubjectsByGrade()[gradeLevel];
            const gradeInfo = getGradeInfo(gradeLevel);
            const gradeColor = gradeInfo?.color || 'blue-800';

            return (
              <div key={gradeLevel} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${gradeIndex * 150}ms` }}>
                {/* Grade Header */}
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
                      {gradeInfo ? formatGradeLevel(gradeInfo) : `Grade ${gradeLevel}`}
                    </h2>
                  </div>
                  {gradeInfo && (
                    <p
                      className="text-sm text-gray-600 ml-7 leading-relaxed text-justify"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {gradeInfo.description}
                    </p>
                  )}
                </div>

                {/* Subjects Grid for this Grade */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-7">
                  {gradeSubjects.map((subject, subjectIndex) => (
                    <Card
                      key={subject.id}
                      className={`group p-6 border-none hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out border-l-5 bg-${subject.color} text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4`}
                      style={{
                        animationDelay: `${(gradeIndex * 150) + (subjectIndex * 75) + 200}ms`,
                        animationFillMode: 'both'
                      }}
                    >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-white flex items-center justify-center flex-shrink-0">
                  <BookOpen
                    size={24}
                    style={{ color: getIconColor(subject.color) }}
                    weight="fill"
                  />
                  
                </div>
                <div>
                <div className="flex items-center gap-3">
                  <h3
                    className="text-lg font-medium text-white"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {subject.code}
                  </h3>
                
                </div>

                <div className="flex gap-1">
              <div className="w-3 h-3 bg-white">
              </div>
              <div className="w-3 h-3 bg-white/80">
              </div>
              <div className="w-3 h-3 bg-white/60">
              </div>
              </div>

                </div>
                </div>
                <div className="space-y-2 mb-4 flex items-center justify-center gap-4">
                
                 <div className="flex items-center p-1 text-xs font-medium rounded-none border border-white/30 bg-white/20 text-white">
                   <BookOpen size={12} className="mr-1" weight="duotone" />
                   Grade {subject.gradeLevel}
                 </div>

                 <div className="flex items-center p-1 text-xs font-medium rounded-none border border-white/30 bg-white/20 text-white">
                   <Calculator size={12} className="mr-1" weight="duotone" />
                   {subject.lectureUnits + subject.labUnits} units
                 </div>
                
               
                <div className="flex gap-1 items-center justify-center cursor-pointer">
                 
                </div>
                

                
              </div>

              </div>  

              <div className="flex flex-col text-xs truncate-2-lines font-light text-justify">
              <span className="text-white text-sm font-medium">{subject.name}</span>
                {subject.description}
              </div>

              <div className="flex space-y-2 gap-2 opacity-0 opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewSubject(subject)}
                    className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <Eye size={14} className="transition-transform duration-200" />
                     Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSubject(subject)}
                    className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <Pencil size={14} className="transition-transform duration-200" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSubject(subject)}
                    className="text-white/80 hover:text-white hover:bg-white/20 justify-start text-xs bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
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
