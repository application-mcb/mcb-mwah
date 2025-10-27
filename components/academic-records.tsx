'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Calculator, User, Clock } from '@phosphor-icons/react';
import { toast } from 'react-toastify';

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

interface SubjectData {
  id: string;
  name: string;
  code?: string;
  description: string;
  color: string;
  lectureUnits?: number;
  labUnits?: number;
  gradeLevel: number;
  createdAt: string;
  updatedAt: string;
  teacherAssignments?: Record<string, string[]>;
}

interface Teacher {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  extension?: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  uid?: string;
  status?: 'active' | 'inactive';
  photoURL?: string;
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

interface AcademicRecordsProps {
  userId: string;
  studentName?: string;
  onNavigateToEnrollment?: () => void;
}

export default function AcademicRecords({ userId, studentName, onNavigateToEnrollment }: AcademicRecordsProps) {
  const [grades, setGrades] = useState<StudentGrades>({});
  const [subjects, setSubjects] = useState<Record<string, SubjectData>>({});
  const [teachers, setTeachers] = useState<Record<string, Teacher>>({});
  const [teacherAssignments, setTeacherAssignments] = useState<Record<string, string[]>>({});
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingTeacherImages, setLoadingTeacherImages] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAcademicRecords();
  }, [userId]);

  const loadAcademicRecords = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Get student's enrollment data first
      const enrollmentResponse = await fetch(`/api/enrollment?userId=${userId}`);
      const enrollmentData = await enrollmentResponse.json();

      // Handle 404 (no enrollment found) as a valid case, not an error
      if (enrollmentResponse.status === 404) {
        console.log('No enrollment found for academic records - showing enrollment required message');
        setEnrollment(null);
        setLoading(false);
        return;
      }

      if (!enrollmentResponse.ok || !enrollmentData.success) {
        throw new Error(enrollmentData.error || 'Failed to load enrollment data');
      }

      const enrollmentInfo = enrollmentData.data;
      if (!enrollmentInfo) {
        console.log('No enrollment data found - showing enrollment required message');
        setEnrollment(null);
        setLoading(false);
        return;
      }

      setEnrollment(enrollmentInfo);

      // Check if student is enrolled
      if (enrollmentInfo.enrollmentInfo?.status !== 'enrolled') {
        setLoading(false);
        return;
      }

      // 2. Get system config to determine current AY code
      const configResponse = await fetch('/api/enrollment?getConfig=true');
      const configData = await configResponse.json();

      if (!configResponse.ok || !configData.ayCode) {
        throw new Error('Failed to get system configuration');
      }

      const ayCode = configData.ayCode;

      // 3. Load subjects data for reference (needed for grades processing)
      const subjectsResponse = await fetch('/api/subjects');
      const subjectsDataResponse = await subjectsResponse.json();
      let subjectsMap: Record<string, SubjectData> = {};

      if (subjectsResponse.ok && subjectsDataResponse.subjects) {
        subjectsDataResponse.subjects.forEach((subject: SubjectData) => {
          subjectsMap[subject.id] = subject;
        });
      }

      // 4. Load student grades for current AY
      const gradesResponse = await fetch(`/api/students/${userId}/grades`);
      const gradesData = await gradesResponse.json();

      if (gradesResponse.ok && gradesData.grades) {
        // Validate and sanitize grades data
        const sanitizedGrades: StudentGrades = {};
        Object.entries(gradesData.grades).forEach(([subjectId, subjectGrade]: [string, any]) => {
          if (subjectGrade && typeof subjectGrade === 'object') {
            // Try to get subject name from grades data, or fallback to subjects collection
            let subjectName = subjectGrade.subjectName;
            if (!subjectName) {
              const subject = subjectsMap[subjectId];
              subjectName = subject?.name || 'Unknown Subject';
            }

            sanitizedGrades[subjectId] = {
              subjectName: subjectName || 'Unknown Subject',
              period1: typeof subjectGrade.period1 === 'number' ? subjectGrade.period1 : null,
              period2: typeof subjectGrade.period2 === 'number' ? subjectGrade.period2 : null,
              period3: typeof subjectGrade.period3 === 'number' ? subjectGrade.period3 : null,
              period4: typeof subjectGrade.period4 === 'number' ? subjectGrade.period4 : null
            };
          }
        });
        setGrades(sanitizedGrades);
      } else {
        // If no grades exist yet, initialize with empty structure
        setGrades({});
      }

      // Set subjects data
      setSubjects(subjectsMap);

      // Stop loading main content
      setLoading(false);

      // 5. Load teachers and assignments asynchronously (doesn't block UI)
      loadTeachersAndAssignments(enrollmentInfo);

    } catch (error: any) {
      console.error('Error loading academic records:', error);
      setError('Failed to load academic records: ' + error.message);
      setLoading(false);
    }
  };

  const loadTeachersAndAssignments = async (enrollmentInfo: EnrollmentData) => {
    try {
      setLoadingTeachers(true);

      // Only load teacher assignments if student has a section
      if (!enrollmentInfo.enrollmentInfo?.sectionId) {
        setLoadingTeachers(false);
        return;
      }

      // Load teacher assignments for the student's section
      const assignmentsResponse = await fetch(`/api/teacher-assignments?sectionId=${enrollmentInfo.enrollmentInfo.sectionId}`);
      const assignmentsData = await assignmentsResponse.json();

      if (!assignmentsResponse.ok || !assignmentsData.assignments) {
        setLoadingTeachers(false);
        return;
      }

      setTeacherAssignments(assignmentsData.assignments);

      // Load all teachers (needed for teacher name resolution)
      const teachersResponse = await fetch('/api/teachers');
      const teachersData = await teachersResponse.json();

      if (teachersResponse.ok && teachersData.teachers) {
        // Load teacher profiles for photo URLs
        const teachersWithProfiles = await Promise.all(
          teachersData.teachers.map(async (teacher: Teacher) => {
            if (teacher.uid) {
              try {
                const profileResponse = await fetch(`/api/user/profile?uid=${teacher.uid}`);
                const profileData = await profileResponse.json();

                if (profileResponse.ok && profileData.success && profileData.user?.photoURL) {
                  return { ...teacher, photoURL: profileData.user.photoURL };
                }
              } catch (error) {
                console.warn(`Failed to load profile for teacher ${teacher.id}:`, error);
              }
            }
            return teacher;
          })
        );

        const teachersMap: Record<string, Teacher> = {};
        teachersWithProfiles.forEach((teacher: Teacher) => {
          teachersMap[teacher.id] = teacher;
          // Set loading state for teachers with photos
          if (teacher.photoURL) {
            setLoadingTeacherImages(prev => ({ ...prev, [teacher.id]: true }));
          }
        });
        setTeachers(teachersMap);
      }

    } catch (error: any) {
      console.error('Error loading teachers and assignments:', error);
      // Don't show error toast for this - it's not critical
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleTeacherImageLoad = (teacherId: string) => {
    setLoadingTeacherImages(prev => ({ ...prev, [teacherId]: false }));
  };

  const handleTeacherImageError = (teacherId: string) => {
    setLoadingTeacherImages(prev => ({ ...prev, [teacherId]: false }));
  };

  const getTeacherInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
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


  const calculateAverage = (period1: number | null, period2: number | null, period3: number | null, period4: number | null): { average: number | null; completedPeriods: number } => {
    const periods = [period1, period2, period3, period4].filter(p => p !== null && typeof p === 'number');

    // Calculate average with whatever periods are available
    if (periods.length > 0) {
      const average = periods.reduce((sum, grade) => sum + grade, 0) / periods.length;
      return { average, completedPeriods: periods.length };
    }

    return { average: null, completedPeriods: 0 };
  };

  const getGradeStatus = (grade: number | null) => {
    if (grade === null || grade === undefined) {
      return { dotColor: 'bg-gray-400', text: '—', textColor: 'text-gray-500' };
    }

    if (grade >= 90) {
      return { dotColor: 'bg-green-600', text: 'Excellent', textColor: 'text-green-700' };
    } else if (grade >= 85) {
      return { dotColor: 'bg-blue-600', text: 'Very Good', textColor: 'text-blue-700' };
    } else if (grade >= 80) {
      return { dotColor: 'bg-yellow-600', text: 'Good', textColor: 'text-yellow-700' };
    } else if (grade >= 75) {
      return { dotColor: 'bg-orange-600', text: 'Fair', textColor: 'text-orange-700' };
    } else {
      return { dotColor: 'bg-red-600', text: 'Needs Improvement', textColor: 'text-red-700' };
    }
  };

  const getStatusInfo = (average: number | null, completedPeriods: number) => {
    if (average === null || completedPeriods === 0) {
      return {
        text: 'Incomplete',
        dotColor: 'bg-gray-400',
        textColor: 'text-gray-500'
      };
    }

    if (average >= 90) {
      return {
        text: 'Excellent',
        dotColor: 'bg-green-600',
        textColor: 'text-green-700'
      };
    } else if (average >= 85) {
      return {
        text: 'Very Good',
        dotColor: 'bg-blue-600',
        textColor: 'text-blue-700'
      };
    } else if (average >= 80) {
      return {
        text: 'Good',
        dotColor: 'bg-yellow-600',
        textColor: 'text-yellow-700'
      };
    } else if (average >= 75) {
      return {
        text: 'Fair',
        dotColor: 'bg-orange-600',
        textColor: 'text-orange-700'
      };
    } else {
      return {
        text: 'Needs Improvement',
        dotColor: 'bg-red-600',
        textColor: 'text-red-700'
      };
    }
  };


  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <Card className="overflow-hidden pt-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header Skeleton */}
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-300 rounded w-24 animate-pulse"></div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-300 rounded w-20 animate-pulse"></div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body Skeleton */}
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* Subject & Teacher Column */}
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="space-y-2">
                        {/* Subject Info */}
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                        </div>

                        {/* Teacher Info */}
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-200 rounded-full mr-2 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </td>

                    {/* Period Columns */}
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                    </td>

                    {/* Average Column */}
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                    </td>

                    {/* Remarks Column */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
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

  // Check if student is enrolled
  if (!enrollment || enrollment.enrollmentInfo?.status !== 'enrolled') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-800 flex items-center justify-center">
                <BookOpen size={24} className="text-white" weight="fill" />
              </div>
              <div>
                <h1
                  className="text-2xl font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Academic Records
                </h1>
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  View your academic performance and grades
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-12 text-center border-none bg-red-50 border-1 shadow-xl border-red-500">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <GraduationCap size={32} className="text-red-600" weight="duotone" />
          </div>
          <h3
            className="text-xl font-medium text-red-900 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Enrollment Required
          </h3>
          <p
            className="text-red-700 text-justify border-1 shadow-xl border-red-500 p-4 bg-red-100 mb-6 max-w-lg mx-auto"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <strong>You must enroll first before accessing your academic records.</strong> Complete your enrollment process to get assigned to subjects and view your academic performance.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                // Navigate to enrollment tab in dashboard without page reload
                if (onNavigateToEnrollment) {
                  onNavigateToEnrollment();
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <GraduationCap size={20} className="mr-2" />
              Start Enrollment Process
            </Button>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              This will take you to the enrollment section
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={loadAcademicRecords} className="mt-4">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <GraduationCap size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Academic Records
            </h1>
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {studentName ? `View academic performance for ${studentName}` : 'View your academic performance'}
            </p>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <Card className="overflow-hidden pt-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                      <BookOpen size={12} weight="bold" className="text-white" />
                    </div>
                    Subject & Teacher
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                      <Clock size={14} weight="bold" className="text-white" />
                    </div>
                    Period 1
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                      <Clock size={14} weight="bold" className="text-white" />
                    </div>
                    Period 2
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                      <Clock size={14} weight="bold" className="text-white" />
                    </div>
                    Period 3
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                      <Clock size={14} weight="bold" className="text-white" />
                    </div>
                    Period 4
                  </div>
                </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                      <Calculator size={12} weight="bold" className="text-white" />
                    </div>
                    Average
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                      <BookOpen size={12} weight="bold" className="text-white" />
                    </div>
                    Remarks
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(grades).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    No subjects found. Student may not be enrolled yet.
                  </td>
                </tr>
              ) : (
                Object.entries(grades).map(([subjectId, subjectGrade]) => {
                  // Ensure subjectGrade has the expected structure
                  const safeSubjectGrade: SubjectGrade = {
                    subjectName: subjectGrade.subjectName || 'Unknown Subject',
                    period1: typeof subjectGrade.period1 === 'number' ? subjectGrade.period1 : null,
                    period2: typeof subjectGrade.period2 === 'number' ? subjectGrade.period2 : null,
                    period3: typeof subjectGrade.period3 === 'number' ? subjectGrade.period3 : null,
                    period4: typeof subjectGrade.period4 === 'number' ? subjectGrade.period4 : null
                  };

                  const { average, completedPeriods } = calculateAverage(
                    safeSubjectGrade.period1,
                    safeSubjectGrade.period2,
                    safeSubjectGrade.period3,
                    safeSubjectGrade.period4
                  );

                  return (
                    <tr key={subjectId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="space-y-2">
                          {/* Subject Info */}
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 flex-shrink-0 mr-3 border border-gray-300"
                              style={{ backgroundColor: getSubjectColor(subjects[subjectId]?.color || 'blue-800') }}
                            ></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900"
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                {safeSubjectGrade.subjectName || 'Unknown Subject'}
                              </div>
                            </div>
                          </div>

                          {/* Teacher Info */}
                          <div>
                            {(() => {
                              if (!enrollment?.enrollmentInfo?.sectionId) {
                                return (
                                  <div className="flex items-center text-xs text-gray-500"
                                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                    <User size={12} className="mr-1" />
                                    No section assigned
                                  </div>
                                );
                              }

                              if (loadingTeachers) {
                                return (
                                  <div className="flex items-center text-xs text-gray-500"
                                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                    <User size={12} className="mr-1" />
                                    Loading teacher...
                                  </div>
                                );
                              }

                              // Get teachers assigned to this subject for the student's section
                              const assignedTeachers = teacherAssignments[subjectId];
                              if (!assignedTeachers || assignedTeachers.length === 0) {
                                return (
                                  <div className="flex items-center text-xs text-gray-500"
                                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                    <User size={12} className="mr-1" />
                                    No teacher assigned yet
                                  </div>
                                );
                              }

                              // Get the first assigned teacher (assuming one main teacher per subject per section)
                              const teacherId = assignedTeachers[0];
                              const teacher = teachers[teacherId];

                              if (!teacher) {
                                return (
                                  <div className="flex items-center text-xs text-gray-500"
                                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                    <User size={12} className="mr-1" />
                                    Teacher not found
                                  </div>
                                );
                              }

                              const firstName = teacher.firstName || '';
                              const middleInitial = teacher.middleName ? `${teacher.middleName.charAt(0)}. ` : '';
                              const lastName = teacher.lastName || '';
                              const extension = teacher.extension ? ` ${teacher.extension}` : '';
                              const fullName = `${firstName} ${middleInitial}${lastName}${extension}`.trim();

                              return (
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-6 w-6 relative mr-2">
                                    {teacher.photoURL ? (
                                      <>
                                        {loadingTeacherImages[teacher.id] !== false && (
                                          <div className="absolute inset-0 h-6 w-6 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
                                            <div className="w-3 h-3 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                                          </div>
                                        )}
                                        <img
                                          src={teacher.photoURL}
                                          alt={`${teacher.firstName || 'Teacher'} profile`}
                                          className={`h-6 w-6 rounded-full object-cover border border-gray-300 transition-opacity duration-200 ${
                                            loadingTeacherImages[teacher.id] === false ? 'opacity-100' : 'opacity-0'
                                          }`}
                                          onLoad={() => handleTeacherImageLoad(teacher.id)}
                                          onError={() => handleTeacherImageError(teacher.id)}
                                        />
                                      </>
                                    ) : (
                                      <div className="h-6 w-6 rounded-full bg-blue-900 flex items-center justify-center border border-gray-300">
                                        <span className="text-white text-xs font-medium"
                                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                          {getTeacherInitials(teacher.firstName, teacher.lastName)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-900"
                                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                    {fullName}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {safeSubjectGrade.period1 !== null ? safeSubjectGrade.period1.toFixed(1) : '—'}
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 ${getGradeStatus(safeSubjectGrade.period1).dotColor} flex-shrink-0`}></div>
                            <div className={`text-xs font-medium ${getGradeStatus(safeSubjectGrade.period1).textColor}`}>
                              {getGradeStatus(safeSubjectGrade.period1).text}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {safeSubjectGrade.period2 !== null ? safeSubjectGrade.period2.toFixed(1) : '—'}
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 ${getGradeStatus(safeSubjectGrade.period2).dotColor} flex-shrink-0`}></div>
                            <div className={`text-xs font-medium ${getGradeStatus(safeSubjectGrade.period2).textColor}`}>
                              {getGradeStatus(safeSubjectGrade.period2).text}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {safeSubjectGrade.period3 !== null ? safeSubjectGrade.period3.toFixed(1) : '—'}
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 ${getGradeStatus(safeSubjectGrade.period3).dotColor} flex-shrink-0`}></div>
                            <div className={`text-xs font-medium ${getGradeStatus(safeSubjectGrade.period3).textColor}`}>
                              {getGradeStatus(safeSubjectGrade.period3).text}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {safeSubjectGrade.period4 !== null ? safeSubjectGrade.period4.toFixed(1) : '—'}
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 ${getGradeStatus(safeSubjectGrade.period4).dotColor} flex-shrink-0`}></div>
                            <div className={`text-xs font-medium ${getGradeStatus(safeSubjectGrade.period4).textColor}`}>
                              {getGradeStatus(safeSubjectGrade.period4).text}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {average !== null && typeof average === 'number' ? average.toFixed(1) : '—'}
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 ${getStatusInfo(average, completedPeriods).dotColor} flex-shrink-0`}></div>
                            <div className={`text-xs font-medium ${getStatusInfo(average, completedPeriods).textColor}`}>
                              {getStatusInfo(average, completedPeriods).text}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {average !== null && typeof average === 'number' ? average.toFixed(1) : '—'}
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 ${getStatusInfo(average, completedPeriods).dotColor} flex-shrink-0`}></div>
                            <div className={`text-xs font-medium ${getStatusInfo(average, completedPeriods).textColor}`}>
                              {getStatusInfo(average, completedPeriods).text}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
