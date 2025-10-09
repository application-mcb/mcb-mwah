'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, User, Eye, CheckCircle, XCircle, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { toast } from 'react-toastify';

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

interface SubjectSetData {
  id: string;
  name: string;
  description: string;
  subjects: string[];
  gradeLevel: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
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

interface MySubjectsViewProps {
  userId: string;
  onNavigateToEnrollment?: () => void;
}

export default function MySubjectsView({ userId, onNavigateToEnrollment }: MySubjectsViewProps) {
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [subjects, setSubjects] = useState<Record<string, SubjectData>>({});
  const [subjectSets, setSubjectSets] = useState<Record<number, SubjectSetData[]>>({});
  const [teachers, setTeachers] = useState<Record<string, Teacher>>({});
  const [teacherAssignments, setTeacherAssignments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingTeacherImages, setLoadingTeacherImages] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectSet, setSelectedSubjectSet] = useState<string>('all');

  useEffect(() => {
    loadStudentData();
  }, [userId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Get student's enrollment data
      const enrollmentResponse = await fetch(`/api/enrollment?userId=${userId}`);
      const enrollmentData = await enrollmentResponse.json();

      // Handle 404 (no enrollment found) as a valid case, not an error
      if (enrollmentResponse.status === 404) {
        console.log('No enrollment found for user - showing enrollment required message');
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

      // 2. Load subjects and subject sets in parallel
      const [subjectsResponse, subjectSetsResponse] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/subject-sets')
      ]);

      const [subjectsData, subjectSetsData] = await Promise.all([
        subjectsResponse.json(),
        subjectSetsResponse.json()
      ]);

      // Process subjects
      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, SubjectData> = {};
        subjectsData.subjects.forEach((subject: SubjectData) => {
          subjectsMap[subject.id] = subject;
        });
        setSubjects(subjectsMap);
      }

      // Process subject sets - only store what's needed
      if (subjectSetsResponse.ok && subjectSetsData.subjectSets) {
        const subjectSetsByGrade: Record<number, SubjectSetData[]> = {};

        // Only process subject sets for the student's grade level (if available)
        const studentGradeLevel = enrollmentInfo.enrollmentInfo?.gradeLevel ? parseInt(enrollmentInfo.enrollmentInfo.gradeLevel) : null;

        subjectSetsData.subjectSets.forEach((subjectSet: SubjectSetData) => {
          const gradeLevel = subjectSet.gradeLevel;

          // If we know the student's grade level, only load that grade's subject sets
          // Otherwise, load all (fallback for when grade level isn't available)
          if (studentGradeLevel === null || gradeLevel === studentGradeLevel) {
            if (!subjectSetsByGrade[gradeLevel]) {
              subjectSetsByGrade[gradeLevel] = [];
            }
            subjectSetsByGrade[gradeLevel].push(subjectSet);
          }
        });

        setSubjectSets(subjectSetsByGrade);
      }

      // Stop loading main content - subjects are now available
      setLoading(false);

      // 3. Load teachers and assignments asynchronously (doesn't block UI)
      loadTeachersAndAssignments(enrollmentInfo);

    } catch (error: any) {
      console.error('Error loading student subjects:', error);
      setError(error.message || 'Failed to load subjects data');
      toast.error('Failed to load your subjects. Please try again.', { autoClose: 5000 });
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

    } catch (error) {
      console.warn('Error loading teachers and assignments:', error);
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
              My Subjects
            </h1>
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your enrolled subjects and curriculum
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      Subject
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      Teacher
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                          <div className="h-2 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-2 bg-gray-200 rounded w-32"></div>
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

  if (error) {
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
              My Subjects
            </h1>
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your enrolled subjects and curriculum
            </p>
          </div>
        </div>

        <Card className="p-12 text-center border-none bg-blue-50 border-l-5 border-blue-500">
          <XCircle size={48} className="mx-auto mb-4" weight="duotone" />
          <h3
            className="text-lg font-medium text-blue-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Error Loading Subjects
          </h3>
          <p
            className="text-blue-700 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {error}
          </p>
          <Button
            onClick={loadStudentData}
            className="bg-blue-800 hover:bg-blue-700"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Try Again
          </Button>
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
                  My Subjects
                </h1>
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  View your enrolled subjects and curriculum
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-12 text-center border-none bg-red-50 border-l-5 border-red-500">
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
            className="text-red-700 text-justify border-l-5 border-red-500 p-4 bg-red-100 mb-6 max-w-lg mx-auto"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <strong>You must enroll first before accessing your subjects.</strong> Complete your enrollment process to get assigned to subjects and view your curriculum.
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

  // Get enrolled subjects
  const enrolledSubjectIds = enrollment.selectedSubjects || [];

  // If no selected subjects, try to get all subjects for the student's grade level
  let finalSubjectIds = enrolledSubjectIds;
  if (enrolledSubjectIds.length === 0 && enrollment.enrollmentInfo?.gradeLevel) {
    const gradeLevel = parseInt(enrollment.enrollmentInfo.gradeLevel);
    // Get all subject sets for this grade level
    const gradeSubjectSets = Object.values(subjectSets).flat().filter(set => set.gradeLevel === gradeLevel);
    const allSubjectIds = gradeSubjectSets.flatMap(set => set.subjects);
    finalSubjectIds = Array.from(new Set(allSubjectIds));
  }

  const enrolledSubjects = finalSubjectIds
    .map(subjectId => subjects[subjectId])
    .filter(Boolean);

  // Filter subjects based on search query and selected subject set
  const filteredSubjects = enrolledSubjects.filter((subject) => {
    // Search filter
    const matchesSearch = searchQuery.trim() === '' ||
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.code && subject.code.toLowerCase().includes(searchQuery.toLowerCase()));

    // Subject set filter
    let matchesSubjectSet = true;
    if (selectedSubjectSet !== 'all') {
      const gradeLevel = enrollment.enrollmentInfo?.gradeLevel ? parseInt(enrollment.enrollmentInfo.gradeLevel) : null;
      if (gradeLevel) {
        const gradeSubjectSets = subjectSets[gradeLevel] || [];
        const selectedSet = gradeSubjectSets.find(set => set.id === selectedSubjectSet);
        matchesSubjectSet = selectedSet ? selectedSet.subjects.includes(subject.id) : true;
      }
    }

    return matchesSearch && matchesSubjectSet;
  });

  if (enrolledSubjects.length === 0) {
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
              My Subjects
            </h1>
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View your enrolled subjects and curriculum
            </p>
          </div>
        </div>

        <Card className="p-12 text-center border-none bg-yellow-50 border-l-5 border-yellow-500">
          <BookOpen size={48} className="mx-auto text-yellow-400 mb-4" weight="duotone" />
          <h3
            className="text-lg font-medium text-yellow-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No Subjects Assigned
          </h3>
          <p
            className="text-yellow-700 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Your enrollment is complete but no subjects have been assigned yet. Please contact your registrar.
          </p>
        </Card>
      </div>
    );
  }

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
                My Subjects ({enrolledSubjects.length})
              </h1>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                View your enrolled subjects and assigned teachers
              </p>
            </div>
          </div>

          {/* Enrollment Status Badge */}
          <div className="flex items-center space-x-2">
            <CheckCircle size={16} className="text-green-600" weight="fill" />
            <span className="text-xs text-green-700 font-medium" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Enrolled - {enrollment.enrollmentInfo?.schoolYear}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-2">

            {/* Subject Set Pills */}
            {(() => {
              const gradeLevel = enrollment.enrollmentInfo?.gradeLevel ? parseInt(enrollment.enrollmentInfo.gradeLevel) : null;
              if (gradeLevel && subjectSets[gradeLevel]) {
                return subjectSets[gradeLevel].map((subjectSet) => (
                  <button
                    key={subjectSet.id}
                    onClick={() => setSelectedSubjectSet(subjectSet.id)}
                    className={`px-3 py-1 text-xs font-medium text-white transition-all duration-200 shadow-sm ${
                      selectedSubjectSet === subjectSet.id
                        ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-105'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: 300,
                      backgroundColor: getSubjectColor(subjectSet.color)
                    }}
                  >
                    {subjectSet.name}
                  </button>
                ));
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-gray-500 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
        Showing {filteredSubjects.length} of {enrolledSubjects.length} subject{enrolledSubjects.length !== 1 ? 's' : ''}
        {(searchQuery || selectedSubjectSet !== 'all') && (
          <span className="ml-2">
            {searchQuery && `• Search: "${searchQuery}"`}
            {selectedSubjectSet !== 'all' && (() => {
              const gradeLevel = enrollment.enrollmentInfo?.gradeLevel ? parseInt(enrollment.enrollmentInfo.gradeLevel) : null;
              if (gradeLevel && subjectSets[gradeLevel]) {
                const selectedSet = subjectSets[gradeLevel].find(set => set.id === selectedSubjectSet);
                return selectedSet ? `• ${selectedSet.name}` : '';
              }
              return '';
            })()}
          </span>
        )}
      </div>

      {/* Subjects Table */}
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
                    Subject
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                      <User size={12} weight="bold" className="text-white" />
                    </div>
                    Teacher
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    {enrolledSubjects.length === 0 ? 'No subjects found' : 'No subjects match your search'}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    {/* Subject Column */}
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        <div
                          className="w-10 h-10 flex items-center justify-center shadow-sm mr-4"
                          style={{ backgroundColor: getSubjectColor(subject.color) }}
                        >
                          <BookOpen size={16} className="text-white" weight="fill" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900"
                               style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {subject.name}
                          </div>
                          {subject.code && (
                            <div className="text-xs text-gray-500 font-mono"
                                 style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                              {subject.code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Teacher Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        if (!enrollment?.enrollmentInfo?.sectionId) {
                          return (
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg flex items-center justify-center mr-3">
                                <XCircle size={12} className="text-blue-800" weight="fill" />
                              </div>
                              <div className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                No Section Assigned
                              </div>
                            </div>
                          );
                        }
                        if (loadingTeachers) {
                          return (
                            <div className="flex items-center animate-pulse">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                              <div className="space-y-1">
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                                <div className="h-2 bg-gray-200 rounded w-32"></div>
                              </div>
                            </div>
                          );
                        }

                        // Get teachers assigned to this subject for the student's section
                        const assignedTeachers = teacherAssignments[subject.id];
                        if (!assignedTeachers || assignedTeachers.length === 0) {
                          return (
                            <div className="flex items-center">
                         
                              <div className="text-xs text-gray-900 font-mono">
                                No Teachers Assigned Yet
                                <br />
                                Please check later.
                              </div>
                        
                            </div>
                          );
                        }

                        // Get the first assigned teacher (assuming one main teacher per subject per section)
                        const teacherId = assignedTeachers[0];
                        const teacher = teachers[teacherId];

                        if (!teacher) {
                          return (
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-  flex items-center justify-center mr-3">
                                <XCircle size={12} className="text-blue-800" weight="fill" />
                              </div>
                              <div className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                Teacher Not Found
                              </div>
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
                            <div className="flex-shrink-0 h-10 w-10 relative mr-3">
                              {teacher.photoURL ? (
                                <>
                                  {/* Loading spinner - show by default when photoURL exists */}
                                  {loadingTeacherImages[teacher.id] !== false && (
                                    <div className="absolute inset-0 h-10 w-10 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  )}
                                  <img
                                    src={teacher.photoURL}
                                    alt={`${teacher.firstName || 'Teacher'} profile`}
                                    className={`h-10 w-10 rounded-full object-cover border-2 border-black/80 transition-opacity duration-200 ${
                                      loadingTeacherImages[teacher.id] === false ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    onLoad={() => handleTeacherImageLoad(teacher.id)}
                                    onError={() => handleTeacherImageError(teacher.id)}
                                  />
                                </>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center border-2 border-black/80">
                                  <span className="text-white text-xs font-medium" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                    {getTeacherInitials(teacher.firstName, teacher.lastName)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs text-gray-900 font-medium" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                {fullName}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {teacher.email}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
