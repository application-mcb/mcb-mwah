'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { GraduationCap, BookOpen, Users, MagnifyingGlass, Funnel, Pencil, Check, X, Calculator } from '@phosphor-icons/react';
import { toast } from 'react-toastify';

interface TeacherGradesViewProps {
  teacherId: string;
}

interface SubjectGrade {
  subjectName: string;
  period1: number | null;
  period2: number | null;
  period3: number | null;
  period4: number | null;
}

interface StudentGrades {
  [subjectId: string]: SubjectGrade;
}

interface EnrollmentData {
  userId: string;
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    nameExtension?: string;
    email: string;
  };
  enrollmentInfo: {
    gradeLevel: string;
    schoolYear: string;
    enrollmentDate: string;
    status: string;
    orNumber?: string;
    scholarship?: string;
    studentId?: string;
    sectionId?: string;
  };
  selectedSubjects?: string[];
}

interface Subject {
  id: string;
  code: string;
  name: string;
  color: string;
  gradeLevel: number;
}

interface Section {
  id: string;
  sectionName: string;
  gradeId: string;
  rank: string;
  grade: string;
  department: string;
}

interface TeacherAssignment {
  subjectId: string;
  sectionId: string;
  teacherId: string;
}

interface StudentWithGrades {
  enrollment: EnrollmentData;
  grades: StudentGrades;
  section: Section | null;
}

export default function TeacherGradesView({ teacherId }: TeacherGradesViewProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, EnrollmentData>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [sectionsMap, setSectionsMap] = useState<Record<string, any>>({});
  const [studentGrades, setStudentGrades] = useState<Record<string, StudentGrades>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editedGrades, setEditedGrades] = useState<StudentGrades>({});

  useEffect(() => {
    loadTeacherGrades();
  }, [teacherId]);

  const loadTeacherGrades = async () => {
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

        // Get unique section IDs
        const sectionIds = [...new Set(transformedAssignments.map((a: TeacherAssignment) => a.sectionId))];

        // Load students from section documents (new approach)
        const sectionPromises = sectionIds.map(sectionId =>
          fetch(`/api/sections/${sectionId}`)
        );

        const sectionResponses = await Promise.all(sectionPromises);
        const sectionDataArrays = await Promise.all(
          sectionResponses.map(r => r.ok ? r.json() : { section: null })
        );

        // Collect all student IDs from all sections
        const allStudentIds: string[] = [];
        const sectionsMap: Record<string, any> = {};

        sectionDataArrays.forEach((data, index) => {
          const sectionId = sectionIds[index];
          if (data.section) {
            sectionsMap[sectionId] = data.section;
            if (data.section.students && Array.isArray(data.section.students)) {
              allStudentIds.push(...data.section.students);
            }
          }
        });

        // Update sectionsMap state
        setSectionsMap(sectionsMap);

        // Remove duplicate student IDs
        const uniqueStudentIds = [...new Set(allStudentIds)];

        // Load enrollment data for all students in these sections
        if (uniqueStudentIds.length > 0) {
          const enrollmentPromises = uniqueStudentIds.map(userId =>
            fetch(`/api/enrollment?userId=${userId}`)
          );

          const enrollmentResponses = await Promise.all(enrollmentPromises);
          const enrollmentDataArrays = await Promise.all(
            enrollmentResponses.map(r => r.ok ? r.json() : { data: null })
          );

          const enrollmentsMap: Record<string, EnrollmentData> = {};
          enrollmentDataArrays.forEach(data => {
            if (data.success && data.data) {
              enrollmentsMap[data.data.userId] = data.data;
            }
          });
          setEnrollments(enrollmentsMap);

          // Load grades for all enrolled students
          const studentIds = Object.keys(enrollmentsMap);
          if (studentIds.length > 0) {
            // Get current academic year from system config or use a default
            const currentAY = '2024-2025'; // TODO: Get from system config

            const gradePromises = studentIds.map(userId =>
              fetch(`/api/students/${userId}/grades?ayCode=${currentAY}`)
            );

            const gradeResponses = await Promise.all(gradePromises);
            const gradeDataArrays = await Promise.all(
              gradeResponses.map(r => r.ok ? r.json() : { grades: {} })
            );

            const gradesMap: Record<string, StudentGrades> = {};
            gradeDataArrays.forEach((data, index) => {
              const userId = studentIds[index];
              gradesMap[userId] = data.grades || {};
            });
            setStudentGrades(gradesMap);
          }
        }
      }

      // Load subjects (outside the assignments check since subjects are needed regardless)
      const subjectsResponse = await fetch('/api/subjects');
      const subjectsData = await subjectsResponse.json();

      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, Subject> = {};
        subjectsData.subjects.forEach((subject: Subject) => {
          subjectsMap[subject.id] = subject;
        });
        setSubjects(subjectsMap);
      }

      // Load sections
      const sectionsResponse = await fetch('/api/sections');
      const sectionsData = await sectionsResponse.json();

      if (sectionsResponse.ok && sectionsData.sections) {
        const sectionsMap: Record<string, Section> = {};
        sectionsData.sections.forEach((section: Section) => {
          sectionsMap[section.id] = section;
        });
        setSections(sectionsMap);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading teacher grades:', error);
      toast.error('Failed to load student grades');
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

  const formatFullName = (enrollment: EnrollmentData) => {
    const { firstName, middleName, lastName, nameExtension } = enrollment.personalInfo;
    let fullName = firstName || '';

    if (middleName) {
      fullName += ` ${middleName.charAt(0).toUpperCase()}.`;
    }

    if (lastName) {
      fullName += ` ${lastName}`;
    }

    if (nameExtension) {
      fullName += ` ${nameExtension}`;
    }

    return fullName || 'Unknown Student';
  };

  const calculateAverage = (grades: SubjectGrade): number => {
    const validGrades = [grades.period1, grades.period2, grades.period3, grades.period4]
      .filter(grade => grade !== null && grade !== undefined) as number[];

    if (validGrades.length === 0) return 0;

    const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round((sum / validGrades.length) * 100) / 100;
  };

  const getGradeStatus = (average: number): { status: string; color: string } => {
    if (average === 0) return { status: 'No Grades', color: 'text-gray-500' };
    if (average >= 90) return { status: 'Excellent', color: 'text-green-600' };
    if (average >= 85) return { status: 'Very Good', color: 'text-blue-600' };
    if (average >= 80) return { status: 'Good', color: 'text-yellow-600' };
    if (average >= 75) return { status: 'Fair', color: 'text-orange-600' };
    return { status: 'Needs Improvement', color: 'text-red-600' };
  };

  const handleEditGrades = (studentId: string, currentGrades: StudentGrades) => {
    setEditingStudent(studentId);
    setEditedGrades(JSON.parse(JSON.stringify(currentGrades))); // Deep copy
  };

  const handleSaveGrades = async (studentId: string) => {
    try {
      setSaving(prev => ({ ...prev, [studentId]: true }));

      const currentAY = '2024-2025'; // TODO: Get from system config

      const response = await fetch(`/api/students/${studentId}/grades`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ayCode: currentAY,
          grades: editedGrades
        }),
      });

      if (response.ok) {
        // Update local state
        setStudentGrades(prev => ({
          ...prev,
          [studentId]: editedGrades
        }));

        setEditingStudent(null);
        setEditedGrades({});
        toast.success('Grades updated successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save grades');
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    } finally {
      setSaving(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditedGrades({});
  };

  const handleGradeChange = (subjectId: string, period: keyof SubjectGrade, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);

    setEditedGrades(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [period]: numValue
      }
    }));
  };

  // Get students with their grades, filtered by teacher's subjects
  const studentsWithGrades: StudentWithGrades[] = Object.values(enrollments)
    .map(enrollment => ({
      enrollment,
      grades: studentGrades[enrollment.userId] || {},
      section: sections[enrollment.enrollmentInfo?.sectionId || ''] || sectionsMap[enrollment.enrollmentInfo?.sectionId || ''] || null
    }))
    .filter(({ enrollment }) => {
      // Only show students who have subjects taught by this teacher
      const studentSection = enrollment.enrollmentInfo?.sectionId;
      if (!studentSection) return false;

      return assignments.some(a => a.sectionId === studentSection);
    });

  // Filter students based on search and filters
  const filteredStudents = studentsWithGrades.filter(({ enrollment }) => {
    // Subject filter - only show students who have this subject with the teacher
    if (selectedSubjectFilter !== 'all') {
      const studentSection = enrollment.enrollmentInfo?.sectionId;
      if (!studentSection) return false;

      const hasSubject = assignments.some(a =>
        a.subjectId === selectedSubjectFilter && a.sectionId === studentSection
      );
      if (!hasSubject) return false;
    }

    // Section filter
    if (selectedSectionFilter !== 'all' && enrollment.enrollmentInfo?.sectionId !== selectedSectionFilter) {
      return false;
    }

    // Search filter
    const query = searchQuery.toLowerCase();
    if (query) {
      const fullName = formatFullName(enrollment).toLowerCase();
      const studentId = enrollment.enrollmentInfo?.studentId?.toLowerCase() || '';

      return fullName.includes(query) || studentId.includes(query);
    }

    return true;
  });

  // Get unique subjects and sections for filtering
  const availableSubjects = [...new Set(assignments.map(a => a.subjectId))];
  const availableSections = [...new Set(assignments.map(a => a.sectionId))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Calculator size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Student Grades
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View and manage grades for your students
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                      Student
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      Subject Grades
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                          <div className="h-2 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-2 bg-gray-200 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
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

  if (filteredStudents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Calculator size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Student Grades
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View and manage grades for your students
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
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map(subjectId => {
                const subject = subjects[subjectId];
                return subject ? (
                  <option key={subjectId} value={subjectId}>
                    {subject.code} - {subject.name}
                  </option>
                ) : null;
              })}
            </select>

            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <option value="all">All Sections</option>
              {availableSections.map(sectionId => {
                const section = sections[sectionId] || sectionsMap[sectionId];
                return section ? (
                  <option key={sectionId} value={sectionId}>
                    {section.sectionName} - {section.rank}
                  </option>
                ) : null;
              })}
            </select>
          </div>
        </div>

        <Card className="p-12 text-center border-none bg-gray-50 border-l-5 border-blue-900">
          <Calculator size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {studentsWithGrades.length === 0 ? 'No Students Assigned' : 'No Students Match Your Search'}
          </h3>
          <p
            className="text-gray-600 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {studentsWithGrades.length === 0
              ? 'No students are currently enrolled in your classes.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {studentsWithGrades.length > 0 && (searchQuery || selectedSubjectFilter !== 'all' || selectedSectionFilter !== 'all') && (
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectFilter('all');
                setSelectedSectionFilter('all');
              }}
              className="bg-blue-900 hover:bg-blue-800"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Clear Filters
            </Button>
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
            <Calculator size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Student Grades ({filteredStudents.length})
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View and manage grades for your students
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
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map(subjectId => {
              const subject = subjects[subjectId];
              return subject ? (
                <option key={subjectId} value={subjectId}>
                  {subject.code} - {subject.name}
                </option>
              ) : null;
            })}
          </select>

          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <option value="all">All Sections</option>
            {availableSections.map(sectionId => {
              const section = sections[sectionId];
              return section ? (
                <option key={sectionId} value={sectionId}>
                  {section.sectionName} - {section.rank}
                </option>
              ) : null;
            })}
          </select>
        </div>
      </div>

      {/* Results Count */}
      {(searchQuery || selectedSubjectFilter !== 'all' || selectedSectionFilter !== 'all') && (
        <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
          Showing {filteredStudents.length} of {studentsWithGrades.length} student{studentsWithGrades.length !== 1 ? 's' : ''}
          {(searchQuery || selectedSubjectFilter !== 'all' || selectedSectionFilter !== 'all') && (
            <span className="ml-2">
              {searchQuery && `• Search: "${searchQuery}"`}
              {selectedSubjectFilter !== 'all' && (() => {
                const subject = subjects[selectedSubjectFilter];
                return subject ? `• ${subject.code} - ${subject.name}` : '';
              })()}
              {selectedSectionFilter !== 'all' && (() => {
                const section = sections[selectedSectionFilter] || sectionsMap[selectedSectionFilter];
                return section ? `• ${section.sectionName} - ${section.rank}` : '';
              })()}
            </span>
          )}
        </div>
      )}

      {/* Grades Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Users size={12} weight="bold" className="text-white" />
                    </div>
                    Student
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <BookOpen size={12} weight="bold" className="text-white" />
                    </div>
                    Section
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Calculator size={12} weight="bold" className="text-white" />
                    </div>
                    Your Subjects
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Pencil size={12} weight="bold" className="text-white" />
                    </div>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map(({ enrollment, grades: studentGradesData, section }) => {
                const studentId = enrollment.userId;
                const studentSection = enrollment.enrollmentInfo?.sectionId;

                // Get subjects taught by this teacher in this student's section
                const teacherSubjects = assignments
                  .filter(a => a.sectionId === studentSection)
                  .map(a => subjects[a.subjectId])
                  .filter(Boolean);

                return (
                  <tr key={studentId} className="hover:bg-gray-50">
                    {/* Student Column */}
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div>
                        <div className="text-xs font-medium text-gray-900"
                             style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {formatFullName(enrollment)}
                        </div>
                        <div className="text-xs text-gray-500 font-mono"
                             style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          ID: {enrollment.enrollmentInfo?.studentId || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500"
                             style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          {enrollment.personalInfo.email}
                        </div>
                      </div>
                    </td>

                    {/* Section Column */}
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div>
                        <div className="text-xs font-medium text-gray-900"
                             style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {section ? `${section.sectionName} - ${section.rank}` : 'Unassigned'}
                        </div>
                        <div className="text-xs text-gray-500"
                             style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          Grade {enrollment.enrollmentInfo?.gradeLevel || 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* Subjects Column */}
                    <td className="px-6 py-4 border-r border-gray-200">
                      <div className="space-y-2">
                        {teacherSubjects.map((subject) => {
                          const subjectGrades = studentGradesData[subject.id];
                          const average = subjectGrades ? calculateAverage(subjectGrades) : 0;
                          const { status, color } = getGradeStatus(average);

                          return (
                            <div key={subject.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 flex-shrink-0"
                                  style={{ backgroundColor: getSubjectColor(subject.color) }}
                                ></div>
                                <span className="text-xs font-medium text-gray-900"
                                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                  {subject.code}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-medium text-gray-900"
                                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                  {average > 0 ? average.toFixed(1) : 'N/A'}
                                </div>
                                <div className={`text-xs ${color}`}
                                     style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                  {status}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        onClick={() => handleEditGrades(studentId, studentGradesData)}
                        size="sm"
                        className="bg-blue-900 hover:bg-blue-800"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        <Pencil size={14} className="mr-1" />
                        Edit Grades
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Grades Modal */}
      <Modal
        isOpen={editingStudent !== null}
        onClose={handleCancelEdit}
        title="Edit Student Grades"
        size="2xl"
      >
        {editingStudent && (
          <div className="space-y-6">
            {(() => {
              const enrollment = enrollments[editingStudent];
              const studentSection = enrollment?.enrollmentInfo?.sectionId;

              // Get subjects taught by this teacher in this student's section
              const teacherSubjects = assignments
                .filter(a => a.sectionId === studentSection)
                .map(a => subjects[a.subjectId])
                .filter(Boolean);

              return (
                <>
                  {/* Student Info */}
                  <div className="bg-blue-50 p-4 border border-blue-200">
                    <h3 className="text-lg font-medium text-blue-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {formatFullName(enrollment)}
                    </h3>
                    <p className="text-sm text-blue-700"
                       style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      Student ID: {enrollment.enrollmentInfo?.studentId || 'N/A'} •
                      Section: {sections[studentSection || '']?.sectionName || sectionsMap[studentSection || '']?.sectionName || 'N/A'}
                    </p>
                  </div>

                  {/* Grades Form */}
                  <div className="space-y-4">
                    {teacherSubjects.map((subject) => {
                      const subjectGrades = editedGrades[subject.id] || {
                        subjectName: subject.name,
                        period1: null,
                        period2: null,
                        period3: null,
                        period4: null
                      };

                      return (
                        <Card key={subject.id} className="p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="w-4 h-4 flex-shrink-0"
                              style={{ backgroundColor: getSubjectColor(subject.color) }}
                            ></div>
                            <h4 className="text-md font-medium text-gray-900"
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                              {subject.code} - {subject.name}
                            </h4>
                          </div>

                          <div className="grid grid-cols-5 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1"
                                     style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                Period 1
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={subjectGrades.period1 || ''}
                                onChange={(e) => handleGradeChange(subject.id, 'period1', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                placeholder="0-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1"
                                     style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                Period 2
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={subjectGrades.period2 || ''}
                                onChange={(e) => handleGradeChange(subject.id, 'period2', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                placeholder="0-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1"
                                     style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                Period 3
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={subjectGrades.period3 || ''}
                                onChange={(e) => handleGradeChange(subject.id, 'period3', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                placeholder="0-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1"
                                     style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                Period 4
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={subjectGrades.period4 || ''}
                                onChange={(e) => handleGradeChange(subject.id, 'period4', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                placeholder="0-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1"
                                     style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                Average
                              </label>
                              <div className="px-3 py-2 bg-gray-100 text-center text-xs font-medium text-gray-900"
                                   style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                {calculateAverage(subjectGrades).toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Modal Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSaveGrades(editingStudent)}
                      disabled={saving[editingStudent]}
                      className="flex-1 bg-blue-900 hover:bg-blue-800"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {saving[editingStudent] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={16} className="mr-2" />
                          Save Grades
                        </>
                      )}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
