'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import EnrollmentPrintModal from './enrollment-print-modal';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnrollmentData, EnrollmentDatabase } from '@/lib/enrollment-database';
import { SubjectData } from '@/lib/subject-database';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-server';
import { Eye, MagnifyingGlass, Calendar, Phone, MapPin, FileText, User, GraduationCap, Circle, Gear, Clock, ArrowUp, ArrowDown, ArrowClockwise, User as UserIcon, FileText as FileTextIcon, GraduationCap as GraduationCapIcon, X, Printer, Check, Lightning, Trash, Users, BookOpen, ArrowLeft, ArrowRight, Shield } from '@phosphor-icons/react';
import ViewHandler from './viewHandler';

// Add custom CSS animations
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .animate-slideInUp {
    animation: slideInUp 0.4s ease-out forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

const SkeletonCard = () => (
  <div className="bg-white p-4 shadow animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 w-24"></div>
        <div className="h-8 bg-gray-200 w-16"></div>
      </div>
      <div className="h-6 w-6 bg-gray-200"></div>
    </div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="h-10 w-10 bg-gray-200"></div>
        <div className="ml-4 space-y-2">
          <div className="h-4 bg-gray-200 w-32"></div>
          <div className="h-3 bg-gray-200 w-48"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 w-20"></div>
        <div className="h-3 bg-gray-200 w-16"></div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 bg-gray-200 w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 w-32"></div>
    </td>
  </tr>
);

const SkeletonTable = () => (
  <div className="bg-white shadow overflow-hidden">
    <div className="px-4 py-5 sm:p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-16"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-20"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-12"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-16"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-12"></div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonTableRow key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

interface StudentManagementProps {
  registrarUid: string;
  registrarName?: string;
}

interface StudentProfile {
  userId: string;
  photoURL?: string;
  email?: string;
  studentId?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  emergencyContact?: string;
}

interface StudentDocument {
  fileFormat: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadDate: string;
  uploadedAt: string;
}

interface StudentDocuments {
  [key: string]: StudentDocument;
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

interface SubjectAssignmentData {
  id: string;
  level: 'high-school' | 'college';
  gradeLevel?: number;
  courseCode?: string;
  courseName?: string;
  yearLevel?: number;
  semester?: 'first-sem' | 'second-sem';
  subjectSetId: string;
  registrarUid: string;
  createdAt: string;
  updatedAt: string;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

interface SectionData {
  id: string;
  gradeId?: string;
  courseId?: string;
  sectionName: string;
  grade: string;
  department: string;
  rank: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Extended interface to handle college enrollment fields
interface ExtendedEnrollmentData extends Omit<EnrollmentData, 'enrollmentInfo'> {
  enrollmentInfo: {
    gradeLevel?: string;
    schoolYear: string;
    enrollmentDate: string;
    status: string;
    orNumber?: string;
    scholarship?: string;
    studentId?: string;
    sectionId?: string;
    studentType?: 'regular' | 'irregular';
    // College-specific fields
    level?: 'college' | 'high-school';
    courseId?: string;
    courseCode?: string;
    courseName?: string;
    yearLevel?: string;
    semester?: 'first-sem' | 'second-sem';
  };
}

export default function StudentManagement({ registrarUid, registrarName }: StudentManagementProps) {
  const [enrollments, setEnrollments] = useState<ExtendedEnrollmentData[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<Record<string, StudentProfile>>({});
  const [studentDocuments, setStudentDocuments] = useState<Record<string, StudentDocuments>>({});
  const [subjectSets, setSubjectSets] = useState<Record<number, SubjectSetData[]>>({});
  const [subjects, setSubjects] = useState<Record<string, SubjectData>>({});
  const [grades, setGrades] = useState<Record<string, any>>({});
  const [sections, setSections] = useState<Record<string, SectionData[]>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [coursePage, setCoursePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [error, setError] = useState('');
  
  // Subject Assignments
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignmentData[]>([]);
  const [subjectAssignmentLoading, setSubjectAssignmentLoading] = useState(false);
  
  // Print subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEnrollment, setViewingEnrollment] = useState<ExtendedEnrollmentData | null>(null);
  const [sortOption, setSortOption] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [activeTab, setActiveTab] = useState<string>('student-info');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [unenrollCountdown, setUnenrollCountdown] = useState(0);
  const [unenrollingStudent, setUnenrollingStudent] = useState(false);
  const [assigningSectionStudent, setAssigningSectionStudent] = useState<string | null>(null);
  const [currentAYFilter, setCurrentAYFilter] = useState('');
  const [currentSemesterFilter, setCurrentSemesterFilter] = useState('');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{
    url: string;
    fileName: string;
    fileType: string;
    fileFormat: string;
  } | null>(null);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  // Setup real-time listener on component mount
  useEffect(() => {
    setupRealtimeListener();

    // Cleanup function to unsubscribe from real-time listener
    return () => {
      if (unsubscribeRef.current) {
        console.log('🔌 Unsubscribing from real-time listener');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when sort option changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption]);

  // Countdown timer for unenroll modal
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showUnenrollModal && unenrollCountdown > 0) {
      timer = setTimeout(() => {
        setUnenrollCountdown(unenrollCountdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showUnenrollModal, unenrollCountdown]);

  const setupRealtimeListener = async () => {
    try {
      setLoading(true);
      setAllDataLoaded(false);
      setError('');

      // Get system config to determine current AY code
      const response = await fetch('/api/enrollment?getConfig=true');
      const configData = await response.json();

      if (!response.ok || !configData.ayCode) {
        throw new Error('Failed to get system configuration');
      }

      const ayCode = configData.ayCode;
      const semester = configData.semester || '1';
      console.log('🔄 Setting up real-time listener for AY:', ayCode, 'Semester:', semester);
      
      // Set the current AY and Semester filters
      setCurrentAYFilter(ayCode);
      setCurrentSemesterFilter(semester);

      // Create query for real-time listening - only enrolled students
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(
        enrollmentsRef,
        where('ayCode', '==', ayCode),
        where('enrollmentData.enrollmentInfo.status', '==', 'enrolled')
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('📡 Real-time update received:', snapshot.docChanges().length, 'changes');

        const enrollments: ExtendedEnrollmentData[] = [];

        for (const doc of snapshot.docs) {
          const enrollmentDoc = doc.data();
          if (enrollmentDoc.enrollmentData) {
            enrollments.push({
              ...enrollmentDoc.enrollmentData,
              id: doc.id
            });
          }
        }

        // Sort enrollments by updatedAt (most recent first)
        enrollments.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA;
        });

        console.log('📋 Updated enrolled students:', enrollments.length, 'total');

        setEnrollments(enrollments);
        setError('');

        // Update related data when enrollments change
        try {
          await Promise.all([
            loadStudentProfiles(enrollments),
            loadStudentDocuments(enrollments),
            loadSubjectSets(),
            loadSubjects(),
            loadGrades(),
            loadSections(),
            loadCourses(),
            loadSubjectAssignments()
          ]);
          console.log('✅ All data loaded successfully');
          setAllDataLoaded(true);
        } catch (dataError) {
          console.error('❌ Error loading related data:', dataError);
          setError('Failed to load all required data');
        }
      }, (error) => {
        console.error('❌ Real-time listener error:', error);
        setError('Failed to listen for real-time updates');
        toast.error('Failed to connect to real-time updates. Table may not update automatically.', {
          autoClose: 8000,
        });
      });

      // Store unsubscribe function for cleanup
      unsubscribeRef.current = unsubscribe;

    } catch (error: any) {
      console.error('❌ Error setting up real-time listener:', error);
      setError('Failed to setup real-time updates: ' + error.message);
      toast.error('Unable to setup live table updates. Please refresh the page.', {
        autoClose: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStudents = async () => {
    try {
      setLoading(true);
      // Force reload by refetching student profiles and documents
      const enrollmentData = Object.values(enrollments);
      await Promise.all([
        loadStudentProfiles(enrollmentData),
        loadStudentDocuments(enrollmentData)
      ]);
      toast.success('Data refreshed successfully', {
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Error refreshing students:', error);
      toast.error('Failed to refresh data', {
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentProfiles = async (enrollmentData: ExtendedEnrollmentData[]) => {
    try {
      const profiles: Record<string, StudentProfile> = {};

      // Batch fetch all student profiles at once
      if (enrollmentData.length === 0) {
        setStudentProfiles(profiles);
        return;
      }

      // Chunk userIds to avoid URL length limits (50 per chunk)
      const userIds = enrollmentData.map(e => e.userId);
      const chunkSize = 50;
      const chunks = [];
      
      for (let i = 0; i < userIds.length; i += chunkSize) {
        chunks.push(userIds.slice(i, i + chunkSize));
      }

      // Fetch all chunks in parallel
      const batchPromises = chunks.map(async (chunk) => {
        try {
          const chunkUserIds = chunk.join(',');
          const batchResponse = await fetch(`/api/user/profile?uids=${chunkUserIds}`);
          const batchData = await batchResponse.json();

          if (batchResponse.ok && batchData.success && batchData.users) {
            return batchData.users;
          }
          return [];
        } catch (error) {
          console.warn('Failed to load chunk:', error);
          return [];
        }
      });

      const allUsers = await Promise.all(batchPromises);
      
      // Flatten and process results
      allUsers.flat().forEach((user: any) => {
        if (user && user.uid) {
          profiles[user.uid] = {
            userId: user.uid,
            photoURL: user.photoURL,
            email: user.email,
            studentId: user.studentId,
            guardianName: user.guardianName,
            guardianPhone: user.guardianPhone,
            guardianEmail: user.guardianEmail,
            guardianRelationship: user.guardianRelationship,
            emergencyContact: user.emergencyContact
          };
        }
      });

      setStudentProfiles(profiles);
    } catch (error) {
      console.error('Error loading student profiles:', error);
    }
  };

  const loadStudentDocuments = async (enrollmentData: ExtendedEnrollmentData[]) => {
    try {
      const documents: Record<string, StudentDocuments> = {};

      // Batch fetch all student documents at once
      if (enrollmentData.length === 0) {
        setStudentDocuments(documents);
        return;
      }

      // Chunk userIds to avoid URL length limits (50 per chunk)
      const userIds = enrollmentData.map(e => e.userId);
      const chunkSize = 50;
      const chunks = [];
      
      for (let i = 0; i < userIds.length; i += chunkSize) {
        chunks.push(userIds.slice(i, i + chunkSize));
      }

      // Fetch all chunks in parallel
      const batchPromises = chunks.map(async (chunk) => {
        try {
          const chunkUserIds = chunk.join(',');
          const batchResponse = await fetch(`/api/user/profile?uids=${chunkUserIds}`);
          const batchData = await batchResponse.json();

          if (batchResponse.ok && batchData.success && batchData.users) {
            return batchData.users;
          }
          return [];
        } catch (error) {
          console.warn('Failed to load chunk:', error);
          return [];
        }
      });

      const allUsers = await Promise.all(batchPromises);
      
      // Flatten and process results
      allUsers.flat().forEach((user: any) => {
        if (user && user.uid && user.documents) {
          documents[user.uid] = user.documents;
        }
      });

      setStudentDocuments(documents);
    } catch (error) {
      console.error('Error loading student documents:', error);
    }
  };

  const loadSubjectSets = async () => {
    try {
      // Load all subject sets at once
      const response = await fetch('/api/subject-sets');
      const data = await response.json();

      if (response.ok && data.subjectSets) {
        // Group subject sets by grade level
        const subjectSetsByGrade: Record<number, SubjectSetData[]> = {};

        data.subjectSets.forEach((subjectSet: SubjectSetData) => {
          const gradeLevel = subjectSet.gradeLevel;
          if (!subjectSetsByGrade[gradeLevel]) {
            subjectSetsByGrade[gradeLevel] = [];
          }
          subjectSetsByGrade[gradeLevel].push(subjectSet);
        });

        console.log('Loaded subject sets by grade:', subjectSetsByGrade);
        setSubjectSets(subjectSetsByGrade);
      } else {
        console.error('Failed to load subject sets:', data);
      }
    } catch (error) {
      console.error('Error loading subject sets:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();

      if (response.ok && data.subjects) {
        const subjectsMap: Record<string, SubjectData> = {};
        data.subjects.forEach((subject: SubjectData) => {
          subjectsMap[subject.id] = subject;
        });
        setSubjects(subjectsMap);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadGrades = async () => {
    try {
      setLoadingGrades(true);
      const response = await fetch('/api/grades');
      const data = await response.json();

      if (response.ok && data.grades) {
        const gradesMap: Record<string, any> = {};
        data.grades.forEach((grade: any) => {
          gradesMap[grade.id] = grade;
        });
        setGrades(gradesMap);
        console.log('📚 Loaded grades data:', gradesMap);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      setLoadingGrades(false);
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch('/api/sections');
      const data = await response.json();

      if (response.ok && data.sections) {
        // Group sections by grade level or course
        const sectionsByGrade: Record<string, SectionData[]> = {};

        data.sections.forEach((section: SectionData) => {
          let key: string;
          
          // For high school sections, use gradeId
          if (section.gradeId) {
            // Extract grade level from grade string or use gradeId
            key = section.grade.replace('Grade ', '').replace('G', '');
          } 
          // For college sections, use courseId
          else if (section.courseId) {
            key = section.courseId;
          } 
          // Fallback
          else {
            key = section.grade.replace('Grade ', '');
          }
          
          if (!sectionsByGrade[key]) {
            sectionsByGrade[key] = [];
          }
          sectionsByGrade[key].push(section);
        });

        console.log('🏫 Loaded sections data:', sectionsByGrade);
        setSections(sectionsByGrade);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch('/api/courses');
      const data = await response.json();

      if (response.ok && data.courses) {
        setCourses(data.courses);
        console.log('🎓 Loaded courses data:', data.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadSubjectAssignments = async () => {
    try {
      setSubjectAssignmentLoading(true);
      const response = await fetch('/api/subject-assignments');
      const data = await response.json();
      
      if (response.ok && data.subjectAssignments) {
        setSubjectAssignments(data.subjectAssignments);
      } else {
        console.error('Failed to load subject assignments:', data);
      }
    } catch (error) {
      console.error('Error loading subject assignments:', error);
    } finally {
      setSubjectAssignmentLoading(false);
    }
  };

  const handleViewStudent = (enrollment: ExtendedEnrollmentData) => {
    setViewingEnrollment(enrollment);
    setShowViewModal(true);
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setViewingDocument(null);
  };

  const handleImageLoad = (userId: string) => {
    setLoadingImages(prev => ({ ...prev, [userId]: false }));
  };

  const handleImageError = (userId: string) => {
    setLoadingImages(prev => ({ ...prev, [userId]: false }));
  };

  const handleSectionChange = async (enrollment: ExtendedEnrollmentData, sectionId: string) => {
    setAssigningSectionStudent(enrollment.userId);

    try {
      let response;
      let data;
      let currentSectionId = enrollment.enrollmentInfo?.sectionId;

      if (sectionId) {
        // Assigning a section
        response = await fetch('/api/enrollment', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: enrollment.userId,
            sectionId: sectionId,
          }),
        });

        data = await response.json();

        if (response.ok && data.success) {
          const selectedSection = Object.values(sections)
            .flat()
            .find(section => section.id === sectionId);

          toast.success(`Student assigned to ${selectedSection?.sectionName || 'section'} successfully`, {
            autoClose: 3000,
          });
          
          // Refresh to update stats
          await refreshStudents();
        } else {
          toast.error(data.error || 'Failed to assign section. Please try again.', {
            autoClose: 4000,
          });
        }
      } else if (currentSectionId) {
        // Unassigning from current section
        response = await fetch('/api/enrollment', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: enrollment.userId,
            sectionId: currentSectionId,
            unassignSection: true,
          }),
        });

        data = await response.json();

        if (response.ok && data.success) {
          toast.success('Student unassigned from section successfully', {
            autoClose: 3000,
          });
          
          // Refresh to update stats
          await refreshStudents();
        } else {
          toast.error(data.error || 'Failed to unassign section. Please try again.', {
            autoClose: 4000,
          });
        }
      } else {
        // No section selected and no current section - nothing to do
        return;
      }
    } catch (error) {
      console.error('Error changing section assignment:', error);
      toast.error('Network error occurred while changing section assignment. Please check your connection and try again.', {
        autoClose: 4000,
      });
    } finally {
      setAssigningSectionStudent(null);
    }
  };


  const handleUnenrollStudent = () => {
    setShowUnenrollModal(true);
    setUnenrollCountdown(5);
  };

  const confirmUnenrollStudent = async () => {
    if (!viewingEnrollment) {
      toast.error('Unable to find student information. Please refresh and try again.', {
        autoClose: 5000,
      });
      return;
    }

    setUnenrollingStudent(true);

    try {
      const response = await fetch('/api/enrollment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: viewingEnrollment.userId,
          level: viewingEnrollment.enrollmentInfo?.level,
          semester: viewingEnrollment.enrollmentInfo?.semester,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Student ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} has been unenrolled.`, {
          autoClose: 6000,
        });
        setShowUnenrollModal(false);
        // Close the modal
        closeViewModal();
      } else {
        toast.error(data.error || 'Failed to unenroll student. Please try again.', {
          autoClose: 8000,
        });
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast.error('Network error occurred while unenrolling student. Please check your connection and try again.', {
        autoClose: 7000,
      });
    } finally {
      setUnenrollingStudent(false);
    }
  };

  const cancelUnenroll = () => {
    setShowUnenrollModal(false);
    setUnenrollCountdown(0);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingEnrollment(null);
    setActiveTab('student-info');
    setShowUnenrollModal(false);
    setUnenrollCountdown(0);
    setUnenrollingStudent(false);
  };

  // Get date range for filtering
  const getDateRange = (days: number) => {
    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - days);
    return pastDate;
  };

  const getDateTimestamp = (dateInput: any): number => {
    try {
      let date: Date;

      // Handle Firestore Timestamp objects (before JSON serialization)
      if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        date = dateInput.toDate();
      }
      // Handle serialized Firestore timestamps (after JSON serialization)
      else if (dateInput && typeof dateInput === 'object' && ('_seconds' in dateInput || 'seconds' in dateInput)) {
        const seconds = dateInput._seconds || dateInput.seconds;
        const nanoseconds = dateInput._nanoseconds || dateInput.nanoseconds || 0;
        date = new Date(seconds * 1000 + nanoseconds / 1000000);
      }
      // Handle string dates
      else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      }
      // Handle number timestamps (milliseconds)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      }
      // Handle Date objects
      else if (dateInput instanceof Date) {
        date = dateInput;
      }
      else {
        return 0; // Default timestamp for invalid dates
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 0;
      }

      return date.getTime();
    } catch {
      return 0;
    }
  };

  // Filter and sort enrollments - memoized for performance
  const filteredAndSortedEnrollments = React.useMemo(() => {
    let filtered = enrollments;

    // First, filter by AY to match current academic year
    if (currentAYFilter) {
      filtered = filtered.filter(enrollment => {
        const enrollmentAY = enrollment.enrollmentInfo?.schoolYear;
        return enrollmentAY === currentAYFilter;
      });
    }

    // Then, filter by semester for college students only
    filtered = filtered.filter(enrollment => {
      const isCollege = enrollment.enrollmentInfo?.level === 'college';
      
      // If not college, always show (semester filter doesn't apply)
      if (!isCollege) return true;
      
      // If no semester filter set, show all college students
      if (!currentSemesterFilter) return true;
      
      // Convert filter value ('1' or '2') to enrollment format ('first-sem' or 'second-sem')
      const filterSemesterValue = currentSemesterFilter === '1' ? 'first-sem' : currentSemesterFilter === '2' ? 'second-sem' : null;
      
      // For college students, check if semester matches
      const enrollmentSemester = enrollment.enrollmentInfo?.semester;
      return enrollmentSemester === filterSemesterValue;
    });

    // Apply date filters
    if (sortOption === 'last-3-days') {
      const threeDaysAgo = getDateRange(3);
      filtered = filtered.filter(enrollment =>
        enrollment.submittedAt && getDateTimestamp(enrollment.submittedAt) >= threeDaysAgo.getTime()
      );
    } else if (sortOption === 'last-7-days') {
      const sevenDaysAgo = getDateRange(7);
      filtered = filtered.filter(enrollment =>
        enrollment.submittedAt && getDateTimestamp(enrollment.submittedAt) >= sevenDaysAgo.getTime()
      );
    }

    // Apply search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((enrollment) => {
        const fullName = formatFullName(
          enrollment.personalInfo?.firstName,
          enrollment.personalInfo?.middleName,
          enrollment.personalInfo?.lastName,
          enrollment.personalInfo?.nameExtension
        ).toLowerCase();
        const email = String(enrollment.personalInfo?.email || '').toLowerCase();
        const gradeLevel = String(enrollment.enrollmentInfo?.gradeLevel || '').toLowerCase();
        const status = String(enrollment.enrollmentInfo?.status || '').toLowerCase();

        return fullName.includes(query) ||
               email.includes(query) ||
               gradeLevel.includes(query) ||
               status.includes(query);
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'a-z':
          const nameA = formatFullName(a.personalInfo?.firstName, a.personalInfo?.middleName, a.personalInfo?.lastName, a.personalInfo?.nameExtension).toLowerCase();
          const nameB = formatFullName(b.personalInfo?.firstName, b.personalInfo?.middleName, b.personalInfo?.lastName, b.personalInfo?.nameExtension).toLowerCase();
          return nameA.localeCompare(nameB);

        case 'z-a':
          const nameARev = formatFullName(a.personalInfo?.firstName, a.personalInfo?.middleName, a.personalInfo?.lastName, a.personalInfo?.nameExtension).toLowerCase();
          const nameBRev = formatFullName(b.personalInfo?.firstName, b.personalInfo?.middleName, b.personalInfo?.lastName, b.personalInfo?.nameExtension).toLowerCase();
          return nameBRev.localeCompare(nameARev);

        case 'latest':
          const dateA = getDateTimestamp(a.submittedAt);
          const dateB = getDateTimestamp(b.submittedAt);
          return dateB - dateA; // Most recent first

        case 'oldest':
          const dateAOld = getDateTimestamp(a.submittedAt);
          const dateBOld = getDateTimestamp(b.submittedAt);
          return dateAOld - dateBOld; // Oldest first

        default:
          return 0;
      }
    });

    return sorted;
  }, [enrollments, debouncedSearchQuery, sortOption, currentAYFilter, currentSemesterFilter]);

  // Paginated enrollments
  const paginatedEnrollments = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedEnrollments.slice(startIndex, endIndex);
  }, [filteredAndSortedEnrollments, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedEnrollments.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'enrolled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateInput: any) => {
    try {
      let date: Date;

      // Handle Firestore Timestamp objects (before JSON serialization)
      if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        date = dateInput.toDate();
      }
      // Handle serialized Firestore timestamps (after JSON serialization)
      else if (dateInput && typeof dateInput === 'object' && ('_seconds' in dateInput || 'seconds' in dateInput)) {
        const seconds = dateInput._seconds || dateInput.seconds;
        const nanoseconds = dateInput._nanoseconds || dateInput.nanoseconds || 0;
        date = new Date(seconds * 1000 + nanoseconds / 1000000);
      }
      // Handle string dates
      else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      }
      // Handle number timestamps (milliseconds)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      }
      // Handle Date objects
      else if (dateInput instanceof Date) {
        date = dateInput;
      }
      else {
        return 'Invalid Date';
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatBirthDate = (dateInput: any) => {
    try {
      let date: Date;

      // Handle string dates (YYYY-MM-DD format)
      if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      }
      // Handle Date objects
      else if (dateInput instanceof Date) {
        date = dateInput;
      }
      else {
        return 'Invalid Date';
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    return first;
  };

  const formatFullName = (firstName?: string, middleName?: string, lastName?: string, nameExtension?: string) => {
    if (!lastName && !firstName) return 'N/A';

    const parts: string[] = [];

    // Last name first
    if (lastName) {
      parts.push(lastName);
    }

    // First name
    if (firstName) {
      parts.push(firstName);
    }

    // Middle name (if exists, show as initial with period)
    if (middleName && middleName.trim()) {
      const middleInitial = middleName.charAt(0).toUpperCase();
      parts.push(`${middleInitial}.`);
    }

    // Extension (if exists)
    if (nameExtension && nameExtension.trim()) {
      parts.push(nameExtension);
    }

    return parts.join(', ');
  };

  // Get grade color from database (matching grade-list.tsx structure)
  const getGradeColor = (gradeLevel: number): string => {
    // Find the grade document that matches this grade level
    const gradeEntries = Object.entries(grades);
    console.log('🔍 Looking for grade color for level:', gradeLevel, 'Available grades:', gradeEntries);

    const matchingGrade = gradeEntries.find(([id, gradeData]) => {
      // Extract grade level from ID like "grade-7-jhs" -> 7
      const idParts = id.split('-');
      const idGradeLevel = parseInt(idParts[1]);
      console.log('🔍 Checking grade ID:', id, 'Parts:', idParts, 'Grade level:', idGradeLevel);
      return idGradeLevel === gradeLevel;
    });

    const color = matchingGrade ? matchingGrade[1].color : 'blue-800';
    console.log('🎨 Grade', gradeLevel, 'color:', color);
    return color; // default to blue-800
  };

  // Get course color from database by course code
  const getCourseColor = (courseCode: string): string => {
    // Find the course that matches the course code
    const courseData = courses.find(c => c.code === courseCode);
    console.log('🔍 Looking for course color for code:', courseCode, 'Found:', courseData);

    const color = courseData ? courseData.color : 'blue-900';
    console.log('🎨 Course', courseCode, 'color:', color);
    return color; // default to blue-900
  };

  // Helper function to get display info for enrollment (handles both high school and college)
  const getEnrollmentDisplayInfo = (enrollment: ExtendedEnrollmentData | null) => {
    if (!enrollment || !enrollment.enrollmentInfo) {
      return {
        type: 'unknown',
        displayText: 'N/A',
        subtitle: 'N/A',
        color: 'blue-900'
      };
    }

    const enrollmentInfo = enrollment.enrollmentInfo;
    
    if (enrollmentInfo?.level === 'college') {
      const semesterDisplay = enrollmentInfo.semester === 'first-sem' ? 'Q1' : enrollmentInfo.semester === 'second-sem' ? 'Q2' : '';
      const semesterSuffix = semesterDisplay ? ` ${semesterDisplay}` : '';
      return {
        type: 'college',
        displayText: `${enrollmentInfo.courseCode || 'N/A'} ${enrollmentInfo.yearLevel || 'N/A'}${semesterSuffix}`,
        subtitle: enrollmentInfo?.schoolYear || 'N/A',
        color: getCourseColor(enrollmentInfo.courseCode || '')
      };
    } else {
      // High school enrollment
      const gradeLevel = parseInt(enrollmentInfo?.gradeLevel || '0');
      return {
        type: 'high-school',
        displayText: `Grade ${gradeLevel || 'N/A'}`,
        subtitle: enrollmentInfo?.schoolYear || 'N/A',
        color: getGradeColor(gradeLevel)
      };
    }
  };

  // Color mapping for background colors (matching grade-list.tsx)
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


  // Get status color as hex value for square badge
  const getStatusHexColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#22c55e'; // green-500
      case 'pending':
        return '#eab308'; // yellow-500
      case 'rejected':
        return '#ef4444'; // red-500
      case 'enrolled':
        return '#3b82f6'; // blue-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Tab content for the modal
  const tabs: Tab[] = React.useMemo(() => [
    {
      id: 'student-info',
      label: 'Student Information',
      icon: (
        <div className="w-5 h-5 bg-blue-800 flex items-center justify-center">
          <UserIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <div className="space-y-6">
          {/* Personal Information Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
              >
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <UserIcon size={14} weight="fill" className="text-white" />
              </div>
              Personal Information
            </h3>
            <div className="overflow-hidden bg-white border border-gray-200">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Date of Birth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Civil Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Nationality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Religion
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {formatFullName(
                        viewingEnrollment?.personalInfo?.firstName,
                        viewingEnrollment?.personalInfo?.middleName,
                        viewingEnrollment?.personalInfo?.lastName,
                        viewingEnrollment?.personalInfo?.nameExtension
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {(() => {
                        const birthMonth = viewingEnrollment?.personalInfo?.birthMonth;
                        const birthDay = viewingEnrollment?.personalInfo?.birthDay;
                        const birthYear = viewingEnrollment?.personalInfo?.birthYear;
                        if (birthMonth && birthDay && birthYear) {
                          return formatBirthDate(`${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`);
                        }
                        return 'N/A';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {(() => {
                        const birthYear = viewingEnrollment?.personalInfo?.birthYear;
                        if (birthYear) {
                          const age = new Date().getFullYear() - parseInt(birthYear);
                          return `${age} years`;
                        }
                        return 'N/A';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {viewingEnrollment?.personalInfo?.gender || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {viewingEnrollment?.personalInfo?.civilStatus || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {viewingEnrollment?.personalInfo?.citizenship || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900"
                      >
                      {viewingEnrollment?.personalInfo?.religion || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact Information Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
              >
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <Phone size={14} weight="fill" className="text-white" />
              </div>
              Contact Information
            </h3>
            <div className="overflow-hidden bg-white border border-gray-200">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Email Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Place of Birth
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {studentProfiles[viewingEnrollment?.userId || '']?.email || viewingEnrollment?.personalInfo?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {viewingEnrollment?.personalInfo?.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-900"
                      >
                      {viewingEnrollment?.personalInfo?.placeOfBirth || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Guardian Information Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <Shield size={14} weight="fill" className="text-white" />
              </div>
              Guardian Information
            </h3>
            <div className="overflow-hidden bg-white border border-gray-200">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Guardian Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Relationship
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Email Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {studentProfiles[viewingEnrollment?.userId || '']?.guardianName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {studentProfiles[viewingEnrollment?.userId || '']?.guardianRelationship || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {studentProfiles[viewingEnrollment?.userId || '']?.guardianPhone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {studentProfiles[viewingEnrollment?.userId || '']?.guardianEmail || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Emergency Contact */}
            {(studentProfiles[viewingEnrollment?.userId || '']?.emergencyContact) && (
              <div className="bg-gray-50 border border-gray-200 p-4">
                <h4 className="text-xs font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Emergency Contact
                </h4>
                <p className="text-xs text-gray-700" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {studentProfiles[viewingEnrollment?.userId || '']?.emergencyContact}
                </p>
              </div>
            )}
          </div>

          {/* Academic Information Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
              >
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <GraduationCapIcon size={14} weight="fill" className="text-white" />
              </div>
              Academic Information
            </h3>
            <div className="overflow-hidden bg-white border border-gray-200">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      School Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                      Enrollment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {(() => {
                        const displayInfo = getEnrollmentDisplayInfo(viewingEnrollment);
                        return displayInfo.displayText;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {viewingEnrollment?.enrollmentInfo?.schoolYear || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                      >
                      {viewingEnrollment?.enrollmentInfo?.enrollmentDate ? formatDate(viewingEnrollment.enrollmentInfo.enrollmentDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(viewingEnrollment?.enrollmentInfo?.status || 'unknown')}`}
                        >
                        {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Enrollment Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
              >
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <Calendar size={14} weight="fill" className="text-white" />
              </div>
              Enrollment Timeline
            </h3>
            <div className="bg-white border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label >
                    Submitted At
                  </Label>
                  <p >
                    {viewingEnrollment?.submittedAt ? formatDate(viewingEnrollment.submittedAt) : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label >
                    Last Updated
                  </Label>
                  <p >
                    {viewingEnrollment?.updatedAt ? formatDate(viewingEnrollment.updatedAt) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'documents',
      label: 'Student Documents',
      icon: (
        <div className="w-5 h-5 bg-blue-800 flex items-center justify-center">
          <FileTextIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
            >
            <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
              <FileTextIcon size={14} weight="fill" className="text-white" />
            </div>
            Submitted Documents
          </h3>
          {(() => {
            const documents = viewingEnrollment ? studentDocuments[viewingEnrollment.userId] : null;
            if (!documents || Object.keys(documents).length === 0) {
              return (
                <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                  <p className="text-gray-500" >
                    No documents submitted
                  </p>
                </div>
              );
            }

            const documentTypes = {
              birthCertificate: 'Birth Certificate',
              certificateOfGoodMoral: 'Certificate of Good Moral',
              form137: 'Form 137',
              idPicture: 'ID Picture',
              reportCard: 'Report Card'
            };

            return (
              <div className="space-y-3">
                {Object.entries(documents).map(([key, doc]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 bg-blue-800 flex items-center justify-center mr-4">
                        <FileText size={16} weight="fill" className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900"
                          >
                          {documentTypes[key as keyof typeof documentTypes] || key}
                        </p>
                        <p className="text-xs text-gray-500"
                          >
                          {doc.fileName} • {doc.fileFormat.toUpperCase()} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-gray-400"
                          >
                          Uploaded: {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setViewingDocument({
                          url: doc.fileUrl,
                          fileName: doc.fileName,
                          fileType: doc.fileType,
                          fileFormat: doc.fileFormat
                        });
                        setShowDocumentModal(true);
                      }}
                      className="px-3 py-1 bg-blue-800 text-white text-xs hover:bg-blue-900 transition-colors flex items-center gap-1"
                      
                    >
                      <Eye size={12} />
                      View Document
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )
    },
    {
      id: 'subjects',
      label: 'Assigned Subjects',
      icon: (
        <div className="w-5 h-5 bg-blue-800 flex items-center justify-center">
          <GraduationCapIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
            >
            <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
              <GraduationCapIcon size={14} weight="fill" className="text-white" />
            </div>
            Currently Assigned Subjects
          </h3>
          {(() => {
            const enrollmentInfo = viewingEnrollment?.enrollmentInfo;
            let gradeSubjectSets: SubjectSetData[] = [];
            let displayLevel: string = '';
            let assignedSubjectIds: string[] = [];

            if (enrollmentInfo?.level === 'college') {
              // For college students, find the subject assignment for this course, year level, and semester
              const assignment = subjectAssignments.find(assignment => 
                assignment.level === 'college' &&
                assignment.courseCode === enrollmentInfo.courseCode &&
                assignment.yearLevel === parseInt(enrollmentInfo.yearLevel || '1') &&
                assignment.semester === enrollmentInfo.semester
              );

              if (assignment) {
                // Get the subject set for this assignment
                const subjectSet = Object.values(subjectSets).flat().find(set => set.id === assignment.subjectSetId);
                if (subjectSet) {
                  gradeSubjectSets = [subjectSet];
                  assignedSubjectIds = subjectSet.subjects;
                }
              }

              const semesterDisplay = enrollmentInfo.semester === 'first-sem' ? 'Q1' : enrollmentInfo.semester === 'second-sem' ? 'Q2' : '';
              displayLevel = `${enrollmentInfo.courseCode || 'N/A'} ${enrollmentInfo.yearLevel || 'N/A'}${semesterDisplay ? ` ${semesterDisplay}` : ''}`;
            } else {
              // High school logic - find assignment for this grade level
              const gradeLevel = enrollmentInfo?.gradeLevel;
              if (!gradeLevel) {
                return (
                  <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                    <p className="text-gray-500" >
                      No grade level information available
                    </p>
                  </div>
                );
              }

              const assignment = subjectAssignments.find(assignment => 
                assignment.level === 'high-school' &&
                assignment.gradeLevel === parseInt(gradeLevel)
              );

              if (assignment) {
                // Get the subject set for this assignment
                const subjectSet = Object.values(subjectSets).flat().find(set => set.id === assignment.subjectSetId);
                if (subjectSet) {
                  gradeSubjectSets = [subjectSet];
                  assignedSubjectIds = subjectSet.subjects;
                }
              }

              displayLevel = `Grade ${gradeLevel}`;
            }

            if (gradeSubjectSets.length === 0 || assignedSubjectIds.length === 0) {
              return (
                <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                  <p className="text-gray-500" >
                    No subject assignment found for {displayLevel}. Please create a subject assignment in Subject Management.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-medium text-blue-900" >
                      Assigned Subjects ({assignedSubjectIds.length})
                    </h4>
                    <span className="text-xs text-blue-700" >
                      {displayLevel}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {assignedSubjectIds.map((subjectId) => {
                      const subject = subjects[subjectId];
                      if (!subject) return null;
                      return (
                        <div
                          key={subjectId}
                          className="flex items-center gap-2 p-3 bg-white border border-blue-200 rounded"
                        >
                          <div className={`w-4 h-4 border-2 border-${subject.color} bg-${subject.color} flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {subject.code || 'N/A'} - {subject.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(subject.lectureUnits || 0) + (subject.labUnits || 0)} units
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: (
        <div className="w-5 h-5 bg-blue-800 flex items-center justify-center">
          <Gear size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
            >
            <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
              <Gear size={14} weight="fill" className="text-white" />
            </div>
            Student Actions
          </h3>

          {/* Student Information Summary */}
          <div className="bg-white border border-gray-200 p-4">
            <h4 className="text-xs font-medium text-gray-900 mb-3" >
              Student Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-gray-900">
                  {formatFullName(
                    viewingEnrollment?.personalInfo?.firstName,
                    viewingEnrollment?.personalInfo?.middleName,
                    viewingEnrollment?.personalInfo?.lastName,
                    viewingEnrollment?.personalInfo?.nameExtension
                  )}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Level:</span>
                <span className="ml-2 text-gray-900">
                  {(() => {
                    const displayInfo = getEnrollmentDisplayInfo(viewingEnrollment);
                    return displayInfo.displayText;
                  })()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(viewingEnrollment?.enrollmentInfo?.status || 'unknown')}`}>
                  {viewingEnrollment?.enrollmentInfo?.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Enrolled:</span>
                <span className="ml-2 text-gray-900">
                  {viewingEnrollment?.enrollmentInfo?.enrollmentDate ? formatDate(viewingEnrollment.enrollmentInfo.enrollmentDate) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Available Actions */}
          <div className="bg-gray-50 border border-gray-200 p-4">
            <h4 className="text-xs font-medium text-gray-900 mb-4" >
              Available Actions
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex-1 px-4 py-3 bg-blue-800 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                
              >
                <Printer size={16} />
                Print Student Information
              </button>

              <button
                onClick={handleUnenrollStudent}
                className="flex-1 px-4 py-3 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                
                disabled={unenrollingStudent}
              >
                {unenrollingStudent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Unenrolling...
                  </>
                ) : (
                  <>
                    <Trash size={16} />
                    Unenroll Student
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )
    }
  ], [viewingEnrollment, studentProfiles, studentDocuments, subjectSets, subjects, showUnenrollModal, unenrollCountdown, unenrollingStudent]);

  // Show loading skeleton only for table during data loading
  const showTableSkeleton = loading || !allDataLoaded;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-light text-gray-900 flex items-center gap-2" >
            <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
              <Users size={20} weight="fill" className="text-white" />
            </div>
            Student Management
          </h1>
          <p className="text-xs text-gray-600 mt-1" >
            Manage enrolled students and their academic records
          </p>
        </div>
        <Button
          onClick={refreshStudents}
          disabled={loading}
          
        >
          <ArrowClockwise size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Junior High School */}
        <Card className="p-6 bg-white border border-gray-200 shadow-lg">
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-gray-900 flex items-center gap-2" >
              <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                <BookOpen size={12} weight="fill" className="text-white" />
              </div>
              Junior High School
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono">
              {loadingGrades ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))
              ) : (
                Object.values(grades).filter((grade: any) => {
                  const gradeLevel = parseInt(grade.gradeLevel || '0');
                  return gradeLevel >= 7 && gradeLevel <= 10;
                }).sort((a: any, b: any) => a.gradeLevel - b.gradeLevel).slice(0, 4).map((grade: any) => (
                  <div key={grade.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 border flex-shrink-0"
                      style={{
                        borderColor: getBgColor(grade.color),
                        backgroundColor: getBgColor(grade.color)
                      }}
                    ></div>
                    <span className="text-xs text-gray-900 font-mono" >
                      Grade {grade.gradeLevel}: {filteredAndSortedEnrollments.filter(e => parseInt(e.enrollmentInfo?.gradeLevel || '0') === grade.gradeLevel).length}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Senior High School */}
        <Card className="p-6 bg-white border border-gray-200 shadow-lg">
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-gray-900 flex items-center gap-2" >
              <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                <GraduationCap size={12} weight="fill" className="text-white" />
              </div>
              Senior High School
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {loadingGrades ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))
              ) : (
                Object.values(grades).filter((grade: any) => {
                  const gradeLevel = parseInt(grade.gradeLevel || '0');
                  return gradeLevel >= 11 && gradeLevel <= 12;
                }).sort((a: any, b: any) => a.gradeLevel - b.gradeLevel).slice(0, 2).map((grade: any) => (
                  <div key={grade.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 border flex-shrink-0"
                      style={{
                        borderColor: getBgColor(grade.color),
                        backgroundColor: getBgColor(grade.color)
                      }}
                    ></div>
                    <span className="text-xs text-gray-900 font-mono" >
                      Grade {grade.gradeLevel}: {filteredAndSortedEnrollments.filter(e => parseInt(e.enrollmentInfo?.gradeLevel || '0') === grade.gradeLevel).length}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* College Level */}
        <Card className="p-6 bg-white border border-gray-200 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-900 flex items-center gap-2" >
                <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                  <GraduationCap size={12} weight="fill" className="text-white" />
                </div>
                College Department
              </h3>
              {courses.length > 4 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCoursePage(Math.max(0, coursePage - 1))}
                    disabled={coursePage === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <span className="text-xs text-gray-500">
                    {coursePage + 1} / {Math.ceil(courses.length / 4)}
                  </span>
                  <button
                    onClick={() => setCoursePage(Math.min(Math.ceil(courses.length / 4) - 1, coursePage + 1))}
                    disabled={coursePage >= Math.ceil(courses.length / 4) - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>  
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {loadingCourses ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))
              ) : (
                courses.slice(coursePage * 4, (coursePage + 1) * 4).map((course, index) => (
                  <div key={course.code} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 border flex-shrink-0"
                      style={{
                        borderColor: getBgColor(course.color),
                        backgroundColor: getBgColor(course.color)
                      }}
                    ></div>
                    <span className="text-xs text-gray-900 font-mono" >
                      {course.code}: {filteredAndSortedEnrollments.filter(e => {
                        return e.enrollmentInfo?.courseCode === course.code;
                      }).length}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Active Filters Display */}
      {(currentAYFilter || currentSemesterFilter) && (
        <div className="bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Active Filters:
            </span>
            {currentAYFilter && (
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 border border-blue-300">
                <Calendar size={12} className="text-blue-900" weight="bold" />
                <span className="text-xs font-mono text-blue-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  AY: {currentAYFilter}
                </span>
              </div>
            )}
            {currentSemesterFilter && (
              <div className="flex items-center gap-2 px-2 py-1 bg-purple-100 border border-purple-300">
                <Calendar size={12} className="text-purple-900" weight="bold" />
                <span className="text-xs font-mono text-purple-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Semester: {currentSemesterFilter}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search enrolled students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-4 py-2 w-full"

            />
          </div>
        </div>
      </div>

      {/* Sorting and Filtering */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'latest', label: 'Latest', icon: Clock },
            { key: 'oldest', label: 'Oldest', icon: Clock },
            { key: 'a-z', label: 'A-Z', icon: ArrowUp },
            { key: 'z-a', label: 'Z-A', icon: ArrowDown },
            { key: 'last-3-days', label: 'Last 3 days', icon: Clock },
            { key: 'last-7-days', label: 'Last 7 days', icon: Clock }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortOption(option.key)}
              className={`px-4 py-2 rounded-none text-xs font-medium transition-all duration-200 ${
                sortOption === option.key
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              
            >
              <div className="flex items-center gap-2">
                <option.icon size={14} weight="bold" />
                {option.label}
              </div>
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500" >
          Showing {filteredAndSortedEnrollments.length} of {enrollments.length} enrolled students
        </div>
      </div>

      {/* Students Table */}
      <Card className="overflow-hidden pt-0 mt-0 mb-0 pb-0">
        {showTableSkeleton ? (
          <SkeletonTable />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <User size={12} weight="bold" className="text-white" />
                      </div>
                      Student
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <Users size={12} weight="bold" className="text-white" />
                      </div>
                      Student ID
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <GraduationCap size={12} weight="bold" className="text-white" />
                      </div>
                      Level
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <Users size={12} weight="bold" className="text-white" />
                      </div>
                      Section
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <Gear size={12} weight="bold" className="text-white" />
                      </div>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                      >
                      {searchQuery ? 'No enrolled students match your search.' : 'No enrolled students found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedEnrollments.map((enrollment) => (
                  <tr key={enrollment.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {studentProfiles[enrollment.userId]?.photoURL ? (
                            <>
                              {/* Loading spinner - show by default when photoURL exists */}
                              {loadingImages[enrollment.userId] !== false && (
                                <div className="absolute inset-0 h-10 w-10 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                              <img
                                src={studentProfiles[enrollment.userId].photoURL}
                                alt={`${enrollment.personalInfo?.firstName || 'Student'} profile`}
                                className={`h-10 w-10 rounded-full object-cover border-2 border-black/80 transition-opacity duration-200 ${
                                  loadingImages[enrollment.userId] === false ? 'opacity-100' : 'opacity-0'
                                }`}
                                onLoad={() => handleImageLoad(enrollment.userId)}
                                onError={() => handleImageError(enrollment.userId)}
                              />
                            </>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center border-2 border-black/80">
                              <span className="text-white text-xs font-medium" >
                                {getInitials(enrollment.personalInfo?.firstName, enrollment.personalInfo?.lastName)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-xs font-medium text-gray-900"
                            >
                            {formatFullName(
                              enrollment.personalInfo?.firstName,
                              enrollment.personalInfo?.middleName,
                              enrollment.personalInfo?.lastName,
                              enrollment.personalInfo?.nameExtension
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono"
                            style={{ fontWeight: 400 }}>
                            {studentProfiles[enrollment.userId]?.email || enrollment.personalInfo?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="text-xs font-mono text-gray-900 uppercase" style={{ fontWeight: 400 }}>
                        ID: {(studentProfiles[enrollment.userId]?.studentId || 'N/A').substring(0, 10)}
                      </div>
                      <div className="text-xs font-mono text-gray-500 uppercase" style={{ fontWeight: 300 }}>
                        #{(enrollment.id || 'N/A').substring(0, 10)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      {(() => {
                        const displayInfo = getEnrollmentDisplayInfo(enrollment);
                        return (
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 flex-shrink-0"
                              style={{ backgroundColor: getBgColor(displayInfo.color) }}
                            ></div>
                            <div className="text-xs text-gray-900"
                              >
                              {displayInfo.displayText}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="text-xs text-gray-500 font-mono"
                        style={{ fontWeight: 400 }}>
                        {(() => {
                          const displayInfo = getEnrollmentDisplayInfo(enrollment);
                          return displayInfo.subtitle;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      {(() => {
                        // For high school: use gradeLevel
                        // For college: use courseCode
                        const gradeLevel = enrollment.enrollmentInfo?.gradeLevel;
                        const courseCode = enrollment.enrollmentInfo?.courseCode;
                        const lookupKey = gradeLevel || courseCode;
                        const gradeSections = lookupKey ? sections[lookupKey] : null;
                        const currentSectionId = enrollment.enrollmentInfo?.sectionId;
                        const isAssigning = assigningSectionStudent === enrollment.userId;

                        if (gradeSections && gradeSections.length > 0) {
                          return (
                            <div className="relative">
                              <select
                                value={currentSectionId || ""}
                                onChange={(e) => handleSectionChange(enrollment, e.target.value)}
                                disabled={isAssigning}
                                className={`w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent ${
                                  isAssigning ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                                
                              >
                                <option value="">Select Section</option>
                                {gradeSections.map((section) => (
                                  <option key={section.id} value={section.id}>
                                    {section.sectionName} ({section.rank})
                                  </option>
                                ))}
                              </select>
                              {isAssigning && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded">
                                  <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="text-xs text-gray-500 italic"
                            >
                            No sections available
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewStudent(enrollment)}
                          size="sm"
                          className="bg-blue-900 hover:bg-blue-800 text-white border"
                          disabled={loading}
                          
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        <Button
                          onClick={() => {
                            // Get subjects for this enrollment based on assignments
                            let subjectsToPrint: string[] = [];
                            const enrollmentInfo = enrollment.enrollmentInfo;

                            if (enrollmentInfo?.level === 'college') {
                              // For college students, find the subject assignment for this course, year level, and semester
                              const assignment = subjectAssignments.find(assignment => 
                                assignment.level === 'college' &&
                                assignment.courseCode === enrollmentInfo.courseCode &&
                                assignment.yearLevel === parseInt(enrollmentInfo.yearLevel || '1') &&
                                assignment.semester === enrollmentInfo.semester
                              );

                              if (assignment) {
                                // Get the subject set for this assignment
                                const subjectSet = Object.values(subjectSets).flat().find(set => set.id === assignment.subjectSetId);
                                if (subjectSet) {
                                  subjectsToPrint = subjectSet.subjects;
                                  console.log('📝 Subjects to print for college:', subjectsToPrint.length, 'subjects from assignment');
                                } else {
                                  console.warn('⚠️ Subject set not found for assignment');
                                }
                              } else {
                                console.warn('⚠️ No subject assignment found for college enrollment');
                              }
                            } else {
                              // High school logic - find assignment for this grade level
                              const gradeLevel = enrollmentInfo?.gradeLevel;
                              if (gradeLevel) {
                                const assignment = subjectAssignments.find(assignment => 
                                  assignment.level === 'high-school' &&
                                  assignment.gradeLevel === parseInt(gradeLevel)
                                );

                                if (assignment) {
                                  // Get the subject set for this assignment
                                  const subjectSet = Object.values(subjectSets).flat().find(set => set.id === assignment.subjectSetId);
                                  if (subjectSet) {
                                    subjectsToPrint = subjectSet.subjects;
                                    console.log('📝 Subjects to print for high school:', subjectsToPrint.length, 'subjects from assignment');
                                  } else {
                                    console.warn('⚠️ Subject set not found for assignment');
                                  }
                                } else {
                                  console.warn('⚠️ No subject assignment found for grade level', gradeLevel);
                                }
                              } else {
                                console.warn('⚠️ No grade level found for enrollment');
                              }
                            }

                            // Set the viewing enrollment and selected subjects for printing
                            console.log('🖨️ Opening print modal with enrollment data:', {
                              enrollmentId: enrollment.id,
                              enrollmentInfo: enrollment.enrollmentInfo,
                              orNumber: enrollment.enrollmentInfo?.orNumber,
                              scholarship: enrollment.enrollmentInfo?.scholarship,
                            });
                            setViewingEnrollment(enrollment);
                            setSelectedSubjects(subjectsToPrint);
                            setShowPrintModal(true);

                            console.log('✅ Opening print modal with', subjectsToPrint.length, 'subjects');
                          }}
                          size="sm"
                          className="bg-blue-900 hover:bg-blue-800 text-white border"
                          
                        >
                          <Printer size={14} className="mr-1" />
                          Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200">
          <div className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedEnrollments.length)} of {filteredAndSortedEnrollments.length} students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <ArrowLeft size={14} />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Next
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={closeViewModal}
        title="Student Details"
        size="2xl"
      >
        {viewingEnrollment && (
          <div className="p-6  overflow-y-auto">

            {/* Student Profile Header */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50">
              <div className="flex-shrink-0 h-16 w-16 relative rounded-full border-2 border-gray-200 border-black/80">
                {studentProfiles[viewingEnrollment.userId]?.photoURL ? (
                  <>
                    {/* Loading spinner - show by default when photoURL exists */}
                    {loadingImages[viewingEnrollment.userId] !== false && (
                      <div className="absolute inset-0 h-16 w-16 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img
                      src={studentProfiles[viewingEnrollment.userId].photoURL}
                      alt={`${viewingEnrollment.personalInfo?.firstName || 'Student'} profile`}
                      className={`h-16 w-16 object-cover rounded-full border-2 border-gray-200 border-black/80 transition-opacity duration-200 ${
                        loadingImages[viewingEnrollment.userId] === false ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => handleImageLoad(viewingEnrollment.userId)}
                      onError={() => handleImageError(viewingEnrollment.userId)}
                    />
                  </>
                ) : (
                  <div className="h-16 w-16 bg-blue-900 flex items-center justify-center">
                    <span className="text-white text-lg font-medium" >
                      {getInitials(viewingEnrollment.personalInfo?.firstName, viewingEnrollment.personalInfo?.lastName)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-900" >
                  {formatFullName(
                    viewingEnrollment?.personalInfo?.firstName,
                    viewingEnrollment?.personalInfo?.middleName,
                    viewingEnrollment?.personalInfo?.lastName,
                    viewingEnrollment?.personalInfo?.nameExtension
                  )}
                </h2>
                <p className="text-gray-600 font-mono uppercase text-xs" style={{ fontWeight: 400 }}>
                  #{viewingEnrollment.id || 'N/A'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium uppercase ${getStatusColor(viewingEnrollment?.enrollmentInfo?.status || 'unknown')}`}
                    >
                    {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500" >
                    {(() => {
                      const displayInfo = getEnrollmentDisplayInfo(viewingEnrollment);
                      return displayInfo.displayText;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border border-gray-200 p-3 mb-6">
              <nav className="-mb-px flex">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex-1 py-3 px-4 font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-800 text-white border-b-2 border-blue-800'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-b-2 border-transparent'
                      }`}
                      
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {tabs.find(tab => tab.id === activeTab)?.content}
            </div>

          </div>
        )}
      </Modal>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <ViewHandler
          isOpen={showDocumentModal}
          onClose={handleCloseDocumentModal}
          documentUrl={viewingDocument.url}
          fileName={viewingDocument.fileName}
          fileType={viewingDocument.fileType}
          fileFormat={viewingDocument.fileFormat}
        />
      )}

      {/* Print Modal */}
      <EnrollmentPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        enrollment={viewingEnrollment}
        studentProfile={viewingEnrollment ? studentProfiles[viewingEnrollment.userId] : null}
        selectedSubjects={selectedSubjects}
        subjects={subjects}
        subjectSets={subjectSets}
        registrarName={registrarName}
      />

      {/* Unenroll Student Warning Modal */}
      <Modal
        isOpen={showUnenrollModal}
        onClose={cancelUnenroll}
        title="Unenroll Student"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
              <Trash size={24} className="text-red-600" weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900" >
                Unenroll Student
              </h3>
              <p className="text-xs text-gray-600" >
                This action will change the student's status back to pending
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <h4 className="text-xs font-medium text-red-900 mb-2" >
              The following will happen when you unenroll this student:
            </h4>
            <ul className="text-xs text-red-800 space-y-1" >
              <li>• Student status will change back to "pending"</li>
              <li>• Enrollment date will be removed</li>
              <li>• All assigned subjects and grades will be deleted</li>
              <li>• Student can be re-enrolled later if needed</li>
              <li>• Any existing grade records will be lost</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={cancelUnenroll}
              className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              
            >
              Cancel
            </button>
            <button
              onClick={confirmUnenrollStudent}
              disabled={unenrollCountdown > 0 || unenrollingStudent}
              className={`flex-1 px-4 py-2 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                unenrollCountdown > 0 || unenrollingStudent
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              
            >
              {unenrollingStudent ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Unenrolling...
                </>
              ) : (
                <>
                  <Trash size={16} />
                  {unenrollCountdown > 0 ? `Unenroll in ${unenrollCountdown}s` : 'Unenroll Student'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
