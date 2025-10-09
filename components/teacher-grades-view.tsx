'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { GraduationCap, BookOpen, Users, MagnifyingGlass, Funnel, Pencil, Check, X, Calculator } from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { GradeData } from '@/lib/types/grade-section';

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

interface StudentProfile {
  userId: string;
  photoURL?: string;
  email?: string;
}

interface StudentWithGrades {
  enrollment: EnrollmentData;
  grades: StudentGrades;
  section: Section | null;
}

export default function TeacherGradesView({ teacherId }: TeacherGradesViewProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, EnrollmentData>>({});
  const [studentProfiles, setStudentProfiles] = useState<Record<string, StudentProfile>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [sectionsMap, setSectionsMap] = useState<Record<string, any>>({});
  const [grades, setGrades] = useState<Record<string, GradeData>>({});
  const [studentGrades, setStudentGrades] = useState<Record<string, StudentGrades>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string[]>([]);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string[]>([]);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editedGrades, setEditedGrades] = useState<StudentGrades>({});
  const [lastLoaded, setLastLoaded] = useState<number | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  useEffect(() => {
    loadTeacherGrades();
  }, [teacherId]);

  const loadTeacherGrades = async () => {
    try {
      // Check if data is cached and recent enough
      const now = Date.now();
      if (lastLoaded && (now - lastLoaded) < CACHE_DURATION && Object.keys(enrollments).length > 0) {
        setLoading(false);
        return;
      }

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

        // Load all sections once and filter client-side for better performance
        const sectionsResponse = await fetch('/api/sections');
        let sectionsMap: Record<string, any> = {};
        const allStudentIds: string[] = [];

        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json();
          if (sectionsData.sections && Array.isArray(sectionsData.sections)) {
            // Filter sections to only include those assigned to this teacher
            const relevantSections = sectionsData.sections.filter((section: any) =>
              sectionIds.includes(section.id)
            );

            // Build sectionsMap and collect student IDs
            relevantSections.forEach((section: any) => {
              sectionsMap[section.id] = section;
              if (section.students && Array.isArray(section.students)) {
                allStudentIds.push(...section.students);
              }
            });
          }
        }

        // Update sectionsMap state
        setSectionsMap(sectionsMap);

        // Remove duplicate student IDs
        const uniqueStudentIds = [...new Set(allStudentIds)];

        // Load enrollment data and profiles for all students in these sections
        const enrollmentsMap: Record<string, EnrollmentData> = {};
        const profilesMap: Record<string, StudentProfile> = {};

        if (uniqueStudentIds.length > 0) {
          // Make batch requests for enrollments and profiles for better performance
          const [enrollmentResponse, profileResponse] = await Promise.all([
            fetch(`/api/enrollment?userIds=${uniqueStudentIds.join(',')}`).catch(() => null),
            fetch(`/api/user/profile?uids=${uniqueStudentIds.join(',')}`).catch(() => null)
          ]);

          // Process batch enrollment data with fallback
          let enrollmentBatchSuccess = false;
          if (enrollmentResponse && enrollmentResponse.ok) {
            try {
              const enrollmentData = await enrollmentResponse.json();
              if (enrollmentData.success && enrollmentData.data) {
                enrollmentData.data.forEach((enrollment: EnrollmentData) => {
                  enrollmentsMap[enrollment.userId] = enrollment;
                });
                enrollmentBatchSuccess = true;
              }
            } catch (error) {
              console.error('Error processing batch enrollment data:', error);
            }
          }

          // Fallback to individual requests if batch failed
          if (!enrollmentBatchSuccess) {
            console.warn('Batch enrollment request failed, falling back to individual requests');
            const enrollmentPromises = uniqueStudentIds.map(userId =>
              fetch(`/api/enrollment?userId=${userId}`).then(async (res) => {
                if (res.ok) {
                  const data = await res.json();
                  if (data.success && data.data) {
                    enrollmentsMap[data.data.userId] = data.data;
                  }
                }
              }).catch((error) => {
                console.error(`Failed to fetch enrollment for user ${userId}:`, error);
              })
            );
            await Promise.allSettled(enrollmentPromises);
          }

          // Process batch profile data with fallback
          let profileBatchSuccess = false;
          if (profileResponse && profileResponse.ok) {
            try {
              const profileData = await profileResponse.json();
              if (profileData.success && profileData.users) {
                profileData.users.forEach((user: any) => {
                  if (user && user.uid) {
                    profilesMap[user.uid] = {
                      userId: user.uid,
                      photoURL: user.photoURL,
                      email: user.email
                    };
                  }
                });
                profileBatchSuccess = true;
              }
            } catch (error) {
              console.error('Error processing batch profile data:', error);
            }
          }

          // Fallback to individual requests if batch failed
          if (!profileBatchSuccess) {
            console.warn('Batch profile request failed, falling back to individual requests');
            const profilePromises = uniqueStudentIds.map(userId =>
              fetch(`/api/user/profile?uid=${userId}`).then(async (res) => {
                if (res.ok) {
                  const data = await res.json();
                  if (data.success && data.user) {
                    profilesMap[data.user.uid] = {
                      userId: data.user.uid,
                      photoURL: data.user.photoURL,
                      email: data.user.email
                    };
                  }
                }
              }).catch((error) => {
                console.error(`Failed to fetch profile for user ${userId}:`, error);
              })
            );
            await Promise.allSettled(profilePromises);
          }
        }

        setEnrollments(enrollmentsMap);
        setStudentProfiles(profilesMap);

          // Load grades for all enrolled students (parallel requests)
          const studentIds = Object.keys(enrollmentsMap);
          const gradesMap: Record<string, StudentGrades> = {};

          if (studentIds.length > 0) {
            // API will get current academic year from system config

            // Make parallel requests for all student grades
            const gradePromises = studentIds.map(userId =>
              fetch(`/api/students/${userId}/grades`).then(async (res) => {
                try {
                  if (res.ok) {
                    const data = await res.json();
                    gradesMap[userId] = data.grades || {};
                  } else {
                    gradesMap[userId] = {};
                  }
                } catch (error) {
                  console.error(`Error parsing grades for user ${userId}:`, error);
                  gradesMap[userId] = {};
                }
              }).catch((error) => {
                console.error(`Error fetching grades for user ${userId}:`, error);
                gradesMap[userId] = {};
              })
            );

            // Wait for all grade requests to complete
            await Promise.all(gradePromises);
          }

          setStudentGrades(gradesMap);
        }

      // Load grades (for grade level colors)
      const gradesResponse = await fetch('/api/grades');
      const gradesData = await gradesResponse.json();

      if (gradesResponse.ok && gradesData.grades) {
        const gradesMap: Record<string, GradeData> = {};
        gradesData.grades.forEach((grade: GradeData) => {
          gradesMap[grade.id] = grade;
        });
        setGrades(gradesMap);
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

      // Update cache timestamp
      setLastLoaded(Date.now());
    } catch (error) {
      console.error('Error loading teacher grades:', error);
      toast.error('Failed to load student grades');
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

  const getGradeColor = (section: Section | null): string => {
    // Get the grade data from the section's gradeId
    if (section && section.gradeId && grades[section.gradeId]) {
      const gradeData = grades[section.gradeId];
      return getSubjectColor(gradeData.color);
    }
    return '#1e40af'; // Default color
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
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

      // API will get current academic year from system config

      const response = await fetch(`/api/students/${studentId}/grades`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        try {
          const data = await response.json();
          toast.error(data.error || 'Failed to save grades');
        } catch (error) {
          console.error('Error parsing error response:', error);
          toast.error('Failed to save grades - server error');
        }
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
    // Subject filter - only show students who have ANY of the selected subjects with the teacher
    if (selectedSubjectFilter.length > 0) {
      const studentSection = enrollment.enrollmentInfo?.sectionId;
      if (!studentSection) return false;

      const hasAnySelectedSubject = selectedSubjectFilter.some(subjectId =>
        assignments.some(a => a.subjectId === subjectId && a.sectionId === studentSection)
      );
      if (!hasAnySelectedSubject) return false;
    }

    // Section filter - only show students in ANY of the selected sections
    if (selectedSectionFilter.length > 0 && !selectedSectionFilter.includes(enrollment.enrollmentInfo?.sectionId || '')) {
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
                          <div className="h-2 bg-gray-200 rounded w-28"></div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
          <Calculator size={20} className="text-white" weight="fill" />
        </div>
        <div>
          <h1
            className="text-2xl font-medium text-gray-900"

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

        <div className="flex flex-col gap-3">
          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setSelectedSubjectFilter(selectedSubjectFilter.length === availableSubjects.length ? [] : availableSubjects)}
                className={`px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                  selectedSubjectFilter.length === availableSubjects.length
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: selectedSubjectFilter.length === availableSubjects.length ? 400 : 300,
                }}
              >
                {selectedSubjectFilter.length === availableSubjects.length ? 'None' : 'All'}
              </button>
              {availableSubjects.map(subjectId => {
                const subject = subjects[subjectId];
                return subject ? (
                  <button
                    key={subjectId}
                    onClick={() => {
                      const isSelected = selectedSubjectFilter.includes(subjectId);
                      if (isSelected) {
                        setSelectedSubjectFilter(prev => prev.filter(id => id !== subjectId));
                      } else {
                        setSelectedSubjectFilter(prev => [...prev, subjectId]);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                      selectedSubjectFilter.includes(subjectId)
                        ? 'text-white'
                        : 'text-white hover:opacity-70'
                    }`}
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: selectedSubjectFilter.includes(subjectId) ? 400 : 300,

                      backgroundColor: getSubjectColor(subject.color),
                      opacity: selectedSubjectFilter.includes(subjectId) ? 1 : 0.5
                    }}
                  >
                    {subject.code}
                  </button>
                ) : null;
              })}
            </div>

            {/* Section Filter Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setSelectedSectionFilter(selectedSectionFilter.length === availableSections.length ? [] : availableSections)}
                className={`px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                  selectedSectionFilter.length === availableSections.length
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: selectedSectionFilter.length === availableSections.length ? 400 : 300,
                }}
              >
                {selectedSectionFilter.length === availableSections.length ? 'None' : 'All'}
              </button>
              {availableSections.map(sectionId => {
                const section = sections[sectionId] || sectionsMap[sectionId];
                return section ? (
                  <button
                    key={sectionId}
                    onClick={() => {
                      const isSelected = selectedSectionFilter.includes(sectionId);
                      if (isSelected) {
                        setSelectedSectionFilter(prev => prev.filter(id => id !== sectionId));
                      } else {
                        setSelectedSectionFilter(prev => [...prev, sectionId]);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                      selectedSectionFilter.includes(sectionId)
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: selectedSectionFilter.includes(sectionId) ? 400 : 300,
                    }}
                  >
                    {section.sectionName}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        </div>

      {filteredStudents.length === 0 ? (
        <Card className="p-12 text-center border-none bg-gray-50 border-l-5 border-blue-900">
          <Calculator size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"

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
          {studentsWithGrades.length > 0 && (searchQuery || selectedSubjectFilter.length > 0 || selectedSectionFilter.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectFilter([]);
                setSelectedSectionFilter([]);
              }}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              style={{
                fontFamily: 'Poppins',
                fontWeight: 300,

              }}
            >
              Clear Filters
            </button>
          )}
        </Card>
      ) : (
    <div className="space-y-6">



      {/* Results Count */}
      {(searchQuery || selectedSubjectFilter.length > 0 || selectedSectionFilter.length > 0) && (
        <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
          Showing {filteredStudents.length} of {studentsWithGrades.length} student{studentsWithGrades.length !== 1 ? 's' : ''}
          {(searchQuery || selectedSubjectFilter.length > 0 || selectedSectionFilter.length > 0) && (
            <span className="ml-2">
              {searchQuery && `• Search: "${searchQuery}"`}
              {selectedSubjectFilter.length > 0 && (() => {
                const selectedSubjectsText = selectedSubjectFilter
                  .map(id => subjects[id]?.code)
                  .filter(Boolean)
                  .join(', ');
                return selectedSubjectsText ? `• Subjects: ${selectedSubjectsText}` : '';
              })()}
              {selectedSectionFilter.length > 0 && (() => {
                const selectedSectionsText = selectedSectionFilter
                  .map(id => {
                    const section = sections[id] || sectionsMap[id];
                    return section?.sectionName;
                  })
                  .filter(Boolean)
                  .join(', ');
                return selectedSectionsText ? `• Sections: ${selectedSectionsText}` : '';
              })()}
            </span>
          )}
        </div>
      )}

      {/* Grades Table or No Results */}
      {filteredStudents.length === 0 ? (
        <Card className="p-12 text-center border-none bg-gray-50 border-l-5 border-blue-900">
          <Calculator size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"

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
          {studentsWithGrades.length > 0 && (searchQuery || selectedSubjectFilter.length > 0 || selectedSectionFilter.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectFilter([]);
                setSelectedSectionFilter([]);
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
      ) : (
        <Card className="overflow-hidden pb-0 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                        <Users size={12} weight="bold" className="text-white" />
                      </div>
                      Student
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                        <BookOpen size={12} weight="bold" className="text-white" />
                      </div>
                      Section
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                        <Calculator size={12} weight="bold" className="text-white" />
                      </div>
                      Your Subjects
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
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
                  const profile = studentProfiles[enrollment.userId];

                  // Get subjects taught by this teacher in this student's section
                  const teacherSubjects = assignments
                    .filter(a => a.sectionId === studentSection)
                    .map(a => subjects[a.subjectId])
                    .filter(Boolean);

                  return (
                    <tr key={studentId} className="hover:bg-gray-50">
                      {/* Student Column */}
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative mr-3">
                            {profile?.photoURL ? (
                              <img
                                src={profile.photoURL}
                                alt={`${enrollment.personalInfo.firstName || 'Student'} profile`}
                                className="h-10 w-10 rounded-full object-cover border-2 border-black/80"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center border-2 border-black/80">
                                <span className="text-white text-xs font-medium" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                  {getInitials(enrollment.personalInfo.firstName, enrollment.personalInfo.lastName)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900"
                                  >
                              {formatFullName(enrollment)}
                            </div>
                            <div className="text-xs text-gray-500 font-mono"
              >
                              ID: {enrollment.enrollmentInfo?.studentId || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500"
                                 >
                              {enrollment.personalInfo.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Section Column */}
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div>
                          <div className="text-xs font-medium text-gray-900"
                                >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 flex-shrink-0"
                                style={{ backgroundColor: getGradeColor(section) }}
                              ></div>
                              {enrollment.enrollmentInfo?.gradeLevel || 'N/A'} {section ? `${section.sectionName}` : 'Unassigned'}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 font-mono"
                           >
                            Section {section?.rank}
                          </div>
                        </div>
                      </td>

                      {/* Subjects Column */}
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900 font-mono"
                               >
                            {teacherSubjects.length} {teacherSubjects.length === 1 ? 'Subject' : 'Subjects'}
                          </div>
                          <div className="text-xs text-gray-500"
                               style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            Assigned
                          </div>
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
      )}

      {/* Edit Grades Modal */}
      <Modal
        isOpen={editingStudent !== null}
        onClose={handleCancelEdit}
        title="Edit Student Grades"
        size="2xl"
      >
        {editingStudent && (
          <div className="p-6 space-y-6 max-h-full overflow-y-auto">
            {(() => {
              const enrollment = enrollments[editingStudent];
              const studentSection = enrollment?.enrollmentInfo?.sectionId;
              const profile = studentProfiles[editingStudent];

              // Get subjects taught by this teacher in this student's section
              const teacherSubjects = assignments
                .filter(a => a.sectionId === studentSection)
                .map(a => subjects[a.subjectId])
                .filter(Boolean);

              return (
                <>
                  {/* Student Info */}
                  <div className="bg-gray-50 p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-12 w-12 relative">
                        {profile?.photoURL ? (
                          <img
                            src={profile.photoURL}
                            alt={`${enrollment.personalInfo.firstName || 'Student'} profile`}
                            className="h-12 w-12 rounded-full object-cover border-2 border-black/80"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-blue-900 flex items-center justify-center border-2 border-black/80">
                            <span className="text-white text-sm font-medium">
                              {getInitials(enrollment.personalInfo.firstName, enrollment.personalInfo.lastName)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {formatFullName(enrollment)}
                        </h3>
                        <p className="text-sm text-gray-700 font-mono">
                          ID: {enrollment.enrollmentInfo?.studentId || 'N/A'} • {enrollment.enrollmentInfo?.gradeLevel} {sections[studentSection || '']?.sectionName || sectionsMap[studentSection || '']?.sectionName || 'N/A'}
                        </p>
                      </div>
                    </div>
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
                            <h4 className="text-md font-medium text-gray-900">
                              {subject.code} - {subject.name}
                            </h4>
                          </div>

                          <div className="grid grid-cols-5 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                placeholder="0-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                placeholder="0-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                placeholder="0-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                placeholder="0-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Average
                              </label>
                              <div className="px-3 py-2 bg-gray-100 text-center text-xs font-medium text-gray-900">
                                {calculateAverage(subjectGrades).toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Modal Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 px-6">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSaveGrades(editingStudent)}
                      disabled={saving[editingStudent]}
                      className="flex-1 bg-blue-900 hover:bg-blue-800"
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
      )}
    </div>
  );
}
