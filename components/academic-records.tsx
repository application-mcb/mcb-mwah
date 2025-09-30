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
}

export default function AcademicRecords({ userId, studentName }: AcademicRecordsProps) {
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

      if (!enrollmentResponse.ok || !enrollmentData.success) {
        throw new Error(enrollmentData.error || 'Failed to load enrollment data');
      }

      const enrollmentInfo = enrollmentData.data;
      if (!enrollmentInfo) {
        throw new Error('No enrollment data found');
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

      // 3. Load student grades for current AY
      const gradesResponse = await fetch(`/api/students/${userId}/grades?ayCode=${ayCode}`);
      const gradesData = await gradesResponse.json();

      if (gradesResponse.ok && gradesData.grades) {
        setGrades(gradesData.grades);
      } else {
        // If no grades exist yet, initialize with empty structure
        setGrades({});
      }

      // 4. Load subjects data for reference
      const subjectsResponse = await fetch('/api/subjects');
      const subjectsData = await subjectsResponse.json();

      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, SubjectData> = {};
        subjectsData.subjects.forEach((subject: SubjectData) => {
          subjectsMap[subject.id] = subject;
        });
        setSubjects(subjectsMap);
      }

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


  const calculateAverage = (period1: number | null, period2: number | null, period3: number | null, period4: number | null): number | null => {
    const periods = [period1, period2, period3, period4].filter(p => p !== null);

    // Only calculate average if all 4 periods are filled
    if (periods.length === 4) {
      return periods.reduce((sum, grade) => sum + grade!, 0) / 4;
    }

    return null;
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
                      <div className="h-3 bg-gray-300 rounded w-12 animate-pulse"></div>
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
                      <div className="h-6 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="h-6 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="h-6 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="h-6 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                    </td>

                    {/* Average Column */}
                    <td className="px-6 py-4 text-center border-r border-gray-200">
                      <div className="h-6 bg-gray-200 rounded w-10 mx-auto animate-pulse"></div>
                    </td>

                    {/* Remarks Column */}
                    <td className="px-6 py-4 text-center">
                      <div className="h-6 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
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
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <BookOpen size={12} weight="bold" className="text-white" />
                    </div>
                    Subject & Teacher
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Clock size={14} weight="bold" className="text-white" />
                    </div>
                    Period 1
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Clock size={14} weight="bold" className="text-white" />
                    </div>
                    Period 2
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Clock size={14} weight="bold" className="text-white" />
                    </div>
                    Period 3
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Clock size={14} weight="bold" className="text-white" />
                    </div>
                    Period 4
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Calculator size={12} weight="bold" className="text-white" />
                    </div>
                    Average
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
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
                  const average = calculateAverage(
                    subjectGrade.period1,
                    subjectGrade.period2,
                    subjectGrade.period3,
                    subjectGrade.period4
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
                                {subjects[subjectId]?.code || subjectId} - {subjectGrade.subjectName}
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
                        <div className={`text-sm font-medium ${
                          subjectGrade.period1 !== null
                            ? subjectGrade.period1 >= 75 ? 'text-green-600' : 'text-red-600'
                            : 'text-gray-400'
                        }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {subjectGrade.period1 !== null ? subjectGrade.period1.toFixed(1) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className={`text-sm font-medium ${
                          subjectGrade.period2 !== null
                            ? subjectGrade.period2 >= 75 ? 'text-green-600' : 'text-red-600'
                            : 'text-gray-400'
                        }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {subjectGrade.period2 !== null ? subjectGrade.period2.toFixed(1) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className={`text-sm font-medium ${
                          subjectGrade.period3 !== null
                            ? subjectGrade.period3 >= 75 ? 'text-green-600' : 'text-red-600'
                            : 'text-gray-400'
                        }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {subjectGrade.period3 !== null ? subjectGrade.period3.toFixed(1) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className={`text-sm font-medium ${
                          subjectGrade.period4 !== null
                            ? subjectGrade.period4 >= 75 ? 'text-green-600' : 'text-red-600'
                            : 'text-gray-400'
                        }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {subjectGrade.period4 !== null ? subjectGrade.period4.toFixed(1) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-200">
                        <div className={`text-sm font-medium px-3 py-1 rounded ${
                          average !== null
                            ? average >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {average !== null ? average.toFixed(1) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-sm font-medium px-3 py-1 rounded ${
                          average !== null
                            ? average >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {average !== null
                            ? average >= 75 ? 'Passed' : 'Failed'
                            : 'Incomplete'
                          }
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
