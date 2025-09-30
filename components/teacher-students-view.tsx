'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, User, MagnifyingGlass, Funnel, Phone, MapPin, IdentificationCard } from '@phosphor-icons/react';
import { toast } from 'react-toastify';

interface TeacherStudentsViewProps {
  teacherId: string;
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

interface StudentProfile {
  userId: string;
  photoURL?: string;
  email?: string;
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

export default function TeacherStudentsView({ teacherId }: TeacherStudentsViewProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, EnrollmentData>>({});
  const [studentProfiles, setStudentProfiles] = useState<Record<string, StudentProfile>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [sectionsMap, setSectionsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  useEffect(() => {
    loadTeacherStudents();
  }, [teacherId]);

  const loadTeacherStudents = async () => {
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

        // Get unique section IDs from assignments
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
        const enrollmentsMap: Record<string, EnrollmentData> = {};
        if (uniqueStudentIds.length > 0) {
          const enrollmentPromises = uniqueStudentIds.map(userId =>
            fetch(`/api/enrollment?userId=${userId}`)
          );

          const enrollmentResponses = await Promise.all(enrollmentPromises);
          const enrollmentDataArrays = await Promise.all(
            enrollmentResponses.map(r => r.ok ? r.json() : { data: null })
          );

          enrollmentDataArrays.forEach(data => {
            if (data.success && data.data) {
              enrollmentsMap[data.data.userId] = data.data;
            }
          });
        }
        setEnrollments(enrollmentsMap);

        // Load student profiles
        const studentIds = Object.keys(enrollmentsMap);
        if (studentIds.length > 0) {
          const profilePromises = studentIds.map(userId =>
            fetch(`/api/user/profile?uid=${userId}`)
          );

          const profileResponses = await Promise.all(profilePromises);
          const profileDataArrays = await Promise.all(
            profileResponses.map(r => r.ok ? r.json() : { success: false })
          );

          const profilesMap: Record<string, StudentProfile> = {};
          profileDataArrays.forEach((data, index) => {
            const userId = studentIds[index];
            if (data.success && data.user) {
              profilesMap[userId] = {
                userId,
                photoURL: data.user.photoURL,
                email: data.user.email
              };
            }
          });
          setStudentProfiles(profilesMap);
        }
      }

      // Load subjects
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

    } catch (error) {
      console.error('Error loading teacher students:', error);
      toast.error('Failed to load your students');
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

  // Get unique subjects and sections for filtering
  const availableSubjects = [...new Set(assignments.map(a => a.subjectId))];
  const availableSections = [...new Set(assignments.map(a => a.sectionId))];

  // Filter students based on search and filters
  const filteredStudents = Object.values(enrollments).filter((enrollment) => {
    // Subject filter
    if (selectedSubjectFilter !== 'all') {
      const studentSection = enrollment.enrollmentInfo?.sectionId;
      if (!studentSection) return false;

      const hasSubjectInSection = assignments.some(a =>
        a.subjectId === selectedSubjectFilter && a.sectionId === studentSection
      );
      if (!hasSubjectInSection) return false;
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
      const email = enrollment.personalInfo?.email?.toLowerCase() || '';

      return fullName.includes(query) ||
             studentId.includes(query) ||
             email.includes(query);
    }

    return true;
  });

  // Group students by section for better organization
  const studentsBySection = filteredStudents.reduce((acc, enrollment) => {
    const sectionId = enrollment.enrollmentInfo?.sectionId || 'unassigned';
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(enrollment);
    return acc;
  }, {} as Record<string, EnrollmentData[]>);

  // Helper function to get section name
  const getSectionName = (sectionId: string) => {
    if (sectionId === 'unassigned') return 'Unassigned';
    const section = sections[sectionId];
    return section ? `${section.sectionName} - ${section.rank}` : sectionId;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Users size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              My Students
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View students in your classes
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
                      Section
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      Subjects
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-2 bg-gray-200 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
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

  if (filteredStudents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Users size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              My Students
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View students in your classes
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
          <Users size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {Object.keys(enrollments).length === 0 ? 'No Students Assigned' : 'No Students Match Your Search'}
          </h3>
          <p
            className="text-gray-600 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {Object.keys(enrollments).length === 0
              ? 'No students are currently enrolled in your classes.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {Object.keys(enrollments).length > 0 && (searchQuery || selectedSubjectFilter !== 'all' || selectedSectionFilter !== 'all') && (
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
            <Users size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              My Students ({filteredStudents.length})
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              View students in your classes
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
          Showing {filteredStudents.length} of {Object.keys(enrollments).length} student{Object.keys(enrollments).length !== 1 ? 's' : ''}
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

      {/* Students Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <User size={12} weight="bold" className="text-white" />
                    </div>
                    Student
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <GraduationCap size={12} weight="bold" className="text-white" />
                    </div>
                    Section
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                     style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <IdentificationCard size={12} weight="bold" className="text-white" />
                    </div>
                    Subjects with You
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(studentsBySection).map(([sectionId, sectionStudents]) =>
                sectionStudents.map((enrollment) => {
                  const profile = studentProfiles[enrollment.userId];
                  const section = sections[sectionId] || sectionsMap[sectionId];

                  // Find subjects this teacher teaches in this student's section
                  const studentSubjects = assignments
                    .filter(a => a.sectionId === sectionId)
                    .map(a => subjects[a.subjectId])
                    .filter(Boolean);

                  return (
                    <tr key={enrollment.userId} className="hover:bg-gray-50">
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
                                 style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                              {formatFullName(enrollment)}
                            </div>
                            <div className="text-xs text-gray-500 font-mono"
                                 style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                              {enrollment.enrollmentInfo?.studentId || 'No ID'}
                            </div>
                            <div className="text-xs text-gray-500"
                                 style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                              {enrollment.personalInfo.email}
                            </div>
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
                          <div className="text-xs text-gray-500"
                               style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {enrollment.enrollmentInfo?.schoolYear || 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Subjects Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {studentSubjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="inline-flex items-center px-2 py-1 border border-gray-200 text-xs font-medium bg-gray-50"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              <div
                                className="w-2 h-2 mr-2 flex-shrink-0"
                                style={{ backgroundColor: getSubjectColor(subject.color) }}
                              ></div>
                              {subject.code}
                            </div>
                          ))}
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
