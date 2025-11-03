'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { toast } from 'react-toastify';

interface TeacherClassesViewProps {
  teacherId: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  lectureUnits: number;
  labUnits: number;
  totalUnits: number;
  gradeLevel: number;
  teacherAssignments?: Record<string, string[]>;
}

interface Section {
  id: string;
  sectionName: string;
  gradeId: string;
  rank: string;
  grade: string;
  department: string;
}

interface Grade {
  id: string;
  gradeLevel: number;
  color: string;
  description: string;
  strand?: string;
  department: string;
}

interface TeacherAssignment {
  subjectId: string;
  sectionId: string;
  teacherId: string;
}

export default function TeacherClassesView({ teacherId }: TeacherClassesViewProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string[]>([]);

  useEffect(() => {
    loadTeacherAssignments();
  }, [teacherId]);

  const loadTeacherAssignments = async () => {
    try {
      setLoading(true);

      // Load teacher assignments
      const assignmentsResponse = await fetch(`/api/teacher-assignments?teacherId=${teacherId}`);
      const assignmentsData = await assignmentsResponse.json();

      if (assignmentsResponse.ok && assignmentsData.assignments) {
        // Transform the API response from {subjectId: [sectionIds]} to [{subjectId, sectionId}]
        const transformedAssignments: TeacherAssignment[] = [];
        Object.entries(assignmentsData.assignments).forEach(([subjectId, sectionIds]) => {
          if (Array.isArray(sectionIds)) {
            sectionIds.forEach(sectionId => {
              transformedAssignments.push({
                subjectId,
                sectionId: sectionId as string,
                teacherId
              });
            });
          }
        });
        setAssignments(transformedAssignments);
      }

      // Load all subjects
      const subjectsResponse = await fetch('/api/subjects');
      const subjectsData = await subjectsResponse.json();

      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, Subject> = {};
        subjectsData.subjects.forEach((subject: Subject) => {
          subjectsMap[subject.id] = subject;
        });
        setSubjects(subjectsMap);
      }

      // Load all sections
      const sectionsResponse = await fetch('/api/sections');
      const sectionsData = await sectionsResponse.json();

      if (sectionsResponse.ok && sectionsData.sections) {
        const sectionsMap: Record<string, Section> = {};
        sectionsData.sections.forEach((section: Section) => {
          sectionsMap[section.id] = section;
        });
        setSections(sectionsMap);
      }

      // Load all grades
      const gradesResponse = await fetch('/api/grades');
      const gradesData = await gradesResponse.json();

      if (gradesResponse.ok && gradesData.grades) {
        const gradesMap: Record<string, Grade> = {};
        gradesData.grades.forEach((grade: Grade) => {
          gradesMap[grade.id] = grade;
        });
        setGrades(gradesMap);
      }

    } catch (error) {
      console.error('Error loading teacher assignments:', error);
      toast.error('Failed to load your class assignments');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-800': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#064e3b',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#581c87'
    };
    return colorMap[color] || '#1e40af';
  };

  const getGradeColor = (color: string): string => {
    return getSubjectColor(color);
  };

  // Group assignments by subject
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const subject = subjects[assignment.subjectId];
    if (!subject) return acc;

    if (!acc[assignment.subjectId]) {
      acc[assignment.subjectId] = {
        subject,
        sections: []
      };
    }

    const section = sections[assignment.sectionId];
    if (section) {
      acc[assignment.subjectId].sections.push(section);
    }

    return acc;
  }, {} as Record<string, { subject: Subject; sections: Section[] }>);

  // Get unique grade levels for filtering
  const availableGrades = Array.from(new Set(
    Object.values(groupedAssignments)
      .map(({ subject }) => subject.gradeLevel)
      .filter(gradeLevel => gradeLevel != null)
  )).sort((a, b) => a - b);

  // Filter assignments based on search and grade filter
  const filteredAssignments = Object.entries(groupedAssignments).filter(([subjectId, { subject, sections }]) => {
    // Grade filter - only show subjects with ANY of the selected grade levels
    if (selectedGradeFilter.length > 0 && subject.gradeLevel != null && !selectedGradeFilter.includes(subject.gradeLevel.toString())) {
      return false;
    }

    // Search filter
    const query = searchQuery.toLowerCase();
    if (query) {
      const subjectMatches = subject.name.toLowerCase().includes(query) ||
                            subject.code.toLowerCase().includes(query);
      const sectionMatches = sections.some(section =>
        section.sectionName.toLowerCase().includes(query) ||
        section.rank.toLowerCase().includes(query) ||
        section.department.toLowerCase().includes(query)
      );
      return subjectMatches || sectionMatches;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <BookOpen size={20} className="text-white" weight="fill" />
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

        <Card className="overflow-hidden pb-0 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      Subject
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      Sections
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                          <div className="h-2 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-2 bg-gray-200 rounded w-16"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (filteredAssignments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <BookOpen size={20} className="text-white" weight="fill" />
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

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects or sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Grade Filter Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-gray-600 mr-2 min-w-fit"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Grade:
              </span>
              <button
                onClick={() => setSelectedGradeFilter(selectedGradeFilter.length === availableGrades.length ? [] : availableGrades.map(g => g.toString()))}
                className={`px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                  selectedGradeFilter.length === availableGrades.length
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: selectedGradeFilter.length === availableGrades.length ? 400 : 300,
                  borderRadius: '9999px'
                }}
              >
                {selectedGradeFilter.length === availableGrades.length ? 'None' : 'All'}
              </button>
              {availableGrades.map(gradeLevel => (
                <button
                  key={gradeLevel}
                  onClick={() => {
                    const gradeStr = gradeLevel.toString();
                    const isSelected = selectedGradeFilter.includes(gradeStr);
                    if (isSelected) {
                      setSelectedGradeFilter(prev => prev.filter(id => id !== gradeStr));
                    } else {
                      setSelectedGradeFilter(prev => [...prev, gradeStr]);
                    }
                  }}
                  className={`px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                    selectedGradeFilter.includes(gradeLevel.toString())
                      ? 'bg-blue-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: selectedGradeFilter.includes(gradeLevel.toString()) ? 400 : 300,
                    borderRadius: '9999px'
                  }}
                >
                  Grade {gradeLevel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="p-12 text-center border-none bg-gray-50 border-1 shadow-sm border-blue-900">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {assignments.length === 0 ? 'No Class Assignments' : 'No Classes Match Your Search'}
          </h3>
          <p
            className="text-gray-600 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {assignments.length === 0
              ? 'You haven\'t been assigned to any classes yet. Please contact your registrar.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {assignments.length > 0 && (searchQuery || selectedGradeFilter.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGradeFilter([]);
              }}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 300,
                borderRadius: '9999px'
              }}
            >
              Clear Filters
            </button>
          )}
        </Card>
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
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects or sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Grade Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-gray-600 mr-2 min-w-fit"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              Grade:
            </span>
            <button
              onClick={() => setSelectedGradeFilter(selectedGradeFilter.length === availableGrades.length ? [] : availableGrades.map(g => g.toString()))}
              className={`px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                selectedGradeFilter.length === availableGrades.length
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                fontFamily: 'Poppins',
                fontWeight: selectedGradeFilter.length === availableGrades.length ? 400 : 300,
                borderRadius: '9999px'
              }}
            >
              {selectedGradeFilter.length === availableGrades.length ? 'None' : 'All'}
            </button>
            {availableGrades.map(gradeLevel => (
              <button
                key={gradeLevel}
                onClick={() => {
                  const gradeStr = gradeLevel.toString();
                  const isSelected = selectedGradeFilter.includes(gradeStr);
                  if (isSelected) {
                    setSelectedGradeFilter(prev => prev.filter(id => id !== gradeStr));
                  } else {
                    setSelectedGradeFilter(prev => [...prev, gradeStr]);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                  selectedGradeFilter.includes(gradeLevel.toString())
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: selectedGradeFilter.includes(gradeLevel.toString()) ? 400 : 300,
                  borderRadius: '9999px'
                }}
              >
                Grade {gradeLevel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      {(searchQuery || selectedGradeFilter.length > 0) && (
        <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
          Showing {filteredAssignments.length} of {Object.keys(groupedAssignments).length} subject{Object.keys(groupedAssignments).length !== 1 ? 's' : ''}
          {(searchQuery || selectedGradeFilter.length > 0) && (
            <span className="ml-2">
              {searchQuery && `• Search: "${searchQuery}"`}
              {selectedGradeFilter.length > 0 && (() => {
                const selectedGradesText = selectedGradeFilter
                  .map(grade => `Grade ${grade}`)
                  .join(', ');
                return selectedGradesText ? `• Grades: ${selectedGradesText}` : '';
              })()}
            </span>
          )}
        </div>
      )}

      {/* Classes Table */}
      <Card className="overflow-hidden pb-0 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <BookOpen size={12} weight="bold" className="text-white" />
                    </div>
                    Subject
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Users size={12} weight="bold" className="text-white" />
                    </div>
                    Sections ({assignments.length} total)
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssignments.map(([subjectId, { subject, sections }]) => (
                <tr key={subjectId} className="hover:bg-gray-50">
                  {/* Subject Column */}
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 flex items-center justify-center shadow-lg mr-4"
                        style={{ backgroundColor: getSubjectColor(subject.color) }}
                      >
                        <BookOpen size={16} className="text-white" weight="fill" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-900"
                             style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {subject.code} {subject.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono"
                             style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          {subject.code} • {subject.lectureUnits + subject.labUnits} units
                        </div>
                        <div className="text-xs text-gray-500"
                             style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          Grade {subject.gradeLevel}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Sections Column */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {sections.map((section) => (
                        <div
                          key={section.id}
                          className="inline-flex items-center px-2 py-1 border border-gray-200 text-xs font-medium bg-gray-50"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          <div
                            className="w-2 h-2 mr-2 flex-shrink-0"
                            style={{ backgroundColor: getGradeColor(grades[section.gradeId]?.color || 'blue-800') }}
                          ></div>
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
      </Card>
    </div>
  );
}
