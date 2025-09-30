'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import EnrollmentPrintModal from './enrollment-print-modal';

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
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-8 w-16 bg-gray-200"></div>
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
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnrollmentData } from '@/lib/enrollment-database';
import { SubjectData } from '@/lib/subject-database';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-server';
import { Eye, MagnifyingGlass, Calendar, Phone, MapPin, FileText, User, GraduationCap, Circle, Gear, Clock, ArrowUp, ArrowDown, ArrowClockwise, User as UserIcon, FileText as FileTextIcon, GraduationCap as GraduationCapIcon, X, Printer, Check, Lightning } from '@phosphor-icons/react';
import ViewHandler from './viewHandler';

interface EnrollmentManagementProps {
  registrarUid: string;
  registrarName?: string;
}

interface StudentProfile {
  userId: string;
  photoURL?: string;
  email?: string;
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

interface Tab {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export default function EnrollmentManagement({ registrarUid, registrarName }: EnrollmentManagementProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<Record<string, StudentProfile>>({});
  const [studentDocuments, setStudentDocuments] = useState<Record<string, StudentDocuments>>({});
  const [subjectSets, setSubjectSets] = useState<Record<number, SubjectSetData[]>>({});
  const [subjects, setSubjects] = useState<Record<string, SubjectData>>({});
  const [grades, setGrades] = useState<Record<string, { color: string }>>({});
  const [selectedSubjectSets, setSelectedSubjectSets] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showOtherSets, setShowOtherSets] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEnrollment, setViewingEnrollment] = useState<EnrollmentData | null>(null);
  const [sortOption, setSortOption] = useState<string>('latest');
  const [activeTab, setActiveTab] = useState<string>('student-info');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeCountdown, setRevokeCountdown] = useState(0);
  const [enrollingStudent, setEnrollingStudent] = useState(false);
  const [revokingEnrollment, setRevokingEnrollment] = useState(false);
  const [showQuickEnrollModal, setShowQuickEnrollModal] = useState(false);
  const [quickEnrollData, setQuickEnrollData] = useState<{
    enrollment: EnrollmentData;
    subjects: string[];
  } | null>(null);
  const [quickEnrollOrNumber, setQuickEnrollOrNumber] = useState('');
  const [quickEnrollScholarship, setQuickEnrollScholarship] = useState('');
  const [quickEnrollStudentId, setQuickEnrollStudentId] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollOrNumber, setEnrollOrNumber] = useState('');
  const [enrollScholarship, setEnrollScholarship] = useState('');
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Auto-select all subjects when switching to Subject Assignment tab
    if (tabId === 'subjects' && viewingEnrollment) {
      setTimeout(() => {
        const gradeLevel = viewingEnrollment.enrollmentInfo?.gradeLevel;
        if (gradeLevel) {
          const gradeSubjectSets = subjectSets[parseInt(gradeLevel)] || [];
          const allSubjectIds = gradeSubjectSets.flatMap(set => set.subjects);
          const uniqueSubjectIds = Array.from(new Set(allSubjectIds)); // Remove duplicates
          
          if (uniqueSubjectIds.length > 0) {
            setSelectedSubjectSets(gradeSubjectSets.map(set => set.id));
            setSelectedSubjects(uniqueSubjectIds);
          }
        }
      }, 100);
    }
  };
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{
    url: string;
    fileName: string;
    fileType: string;
    fileFormat: string;
  } | null>(null);

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

  // Countdown timer for revoke modal
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showRevokeModal && revokeCountdown > 0) {
      timer = setTimeout(() => {
        setRevokeCountdown(revokeCountdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showRevokeModal, revokeCountdown]);

  const setupRealtimeListener = async () => {
    try {
      setLoading(true);
      setError('');

      // Get system config to determine current AY code
      const response = await fetch('/api/enrollment?getConfig=true');
      const configData = await response.json();

      if (!response.ok || !configData.ayCode) {
        throw new Error('Failed to get system configuration');
      }

      const ayCode = configData.ayCode;
      console.log('🔄 Setting up real-time listener for AY:', ayCode);

      // Create query for real-time listening
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(enrollmentsRef, where('ayCode', '==', ayCode));

      // Set up real-time listener
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('📡 Real-time update received:', snapshot.docChanges().length, 'changes');

        const enrollments: EnrollmentData[] = [];

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

        console.log('📋 Updated enrollments:', enrollments.length, 'total');

        setEnrollments(enrollments);
        setError('');

        // Update related data when enrollments change
        await Promise.all([
          loadStudentProfiles(enrollments),
          loadStudentDocuments(enrollments),
          loadSubjectSets(),
          loadSubjects(),
          loadGrades()
        ]);
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

  const refreshEnrollments = () => {
    // Real-time listener makes manual refresh unnecessary
    // But we can show a visual indicator that data is up-to-date
    toast.success('Real-time updates are active. Table refreshes automatically when data changes.', {
      autoClose: 4000,
    });
  };

  const loadStudentProfiles = async (enrollmentData: EnrollmentData[]) => {
    try {
      const profiles: Record<string, StudentProfile> = {};

      // Fetch student profiles for all enrollments
      for (const enrollment of enrollmentData) {
        try {
          const studentResponse = await fetch(`/api/user/profile?uid=${enrollment.userId}`);
          const studentData = await studentResponse.json();

          if (studentResponse.ok && studentData.success) {
            profiles[enrollment.userId] = {
              userId: enrollment.userId,
              photoURL: studentData.user?.photoURL,
              email: studentData.user?.email
            };
          }
        } catch (error) {
          console.warn(`Failed to load profile for user ${enrollment.userId}:`, error);
        }
      }

      setStudentProfiles(profiles);
    } catch (error) {
      console.error('Error loading student profiles:', error);
    }
  };

  const loadStudentDocuments = async (enrollmentData: EnrollmentData[]) => {
    try {
      const documents: Record<string, StudentDocuments> = {};

      // Fetch student documents for all enrollments
      for (const enrollment of enrollmentData) {
        try {
          const documentsResponse = await fetch(`/api/user/profile?uid=${enrollment.userId}`);
          const documentsData = await documentsResponse.json();

          if (documentsResponse.ok && documentsData.success && documentsData.user?.documents) {
            documents[enrollment.userId] = documentsData.user.documents;
          }
        } catch (error) {
          console.warn(`Failed to load documents for user ${enrollment.userId}:`, error);
        }
      }

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
      const response = await fetch('/api/grades');
      const data = await response.json();

      if (response.ok && data.grades) {
        const gradesMap: Record<string, { color: string }> = {};
        data.grades.forEach((grade: any) => {
          gradesMap[grade.id] = { color: grade.color };
        });
        setGrades(gradesMap);
        console.log('📚 Loaded grades data:', gradesMap);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const handleViewEnrollment = (enrollment: EnrollmentData) => {
    setViewingEnrollment(enrollment);
    setShowViewModal(true);

    // Auto-select all subjects when opening the modal
    setTimeout(() => {
      const gradeLevel = enrollment.enrollmentInfo?.gradeLevel;
      if (gradeLevel) {
        const gradeSubjectSets = subjectSets[parseInt(gradeLevel)] || [];
        const allSubjectIds = gradeSubjectSets.flatMap(set => set.subjects);
        const uniqueSubjectIds = Array.from(new Set(allSubjectIds)); // Remove duplicates

        if (uniqueSubjectIds.length > 0) {
          setSelectedSubjectSets(gradeSubjectSets.map(set => set.id));
          setSelectedSubjects(uniqueSubjectIds);
        }
      }
    }, 100); // Small delay to ensure subject sets are loaded
  };

  const handleQuickEnroll = async (enrollment: EnrollmentData) => {
    if (!enrollment || enrollment.enrollmentInfo?.status === 'enrolled') {
      return; // Already enrolled
    }

    const gradeLevel = enrollment.enrollmentInfo?.gradeLevel;
    if (!gradeLevel) {
      toast.error('No grade level information available for quick enroll.');
      return;
    }

    // Get all subjects for this grade level
    const gradeSubjectSets = subjectSets[parseInt(gradeLevel)] || [];
    const allSubjectIds = gradeSubjectSets.flatMap(set => set.subjects);
    const uniqueSubjectIds = Array.from(new Set(allSubjectIds)); // Remove duplicates

    if (uniqueSubjectIds.length === 0) {
      toast.error('No subjects available for this grade level.');
      return;
    }

    // Fetch the latest student ID and increment it
    try {
      const response = await fetch('/api/enrollment?getLatestId=true');
      const data = await response.json();

      if (response.ok && data.success && data.latestId) {
        const nextStudentId = incrementStudentId(data.latestId);
        setQuickEnrollStudentId(nextStudentId);
      } else {
        console.warn('Failed to fetch latest student ID, using fallback');
        setQuickEnrollStudentId('001-001'); // Fallback
      }
    } catch (error) {
      console.error('Error fetching latest student ID:', error);
      setQuickEnrollStudentId('001-001'); // Fallback
    }

    // Set up preview data and show modal
    setQuickEnrollData({
      enrollment,
      subjects: uniqueSubjectIds,
    });
    setShowQuickEnrollModal(true);
  };

  const confirmQuickEnroll = async () => {
    if (!quickEnrollData) return;

    // Validate required fields
    if (!quickEnrollOrNumber.trim()) {
      toast.error('OR Number is required.', { autoClose: 5000 });
      return;
    }
    if (!quickEnrollScholarship.trim()) {
      toast.error('Scholarship is required.', { autoClose: 5000 });
      return;
    }
    if (!quickEnrollStudentId.trim()) {
      toast.error('Student ID is required.', { autoClose: 5000 });
      return;
    }

    setEnrollingStudent(true);

    try {
      const response = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: quickEnrollData.enrollment.userId,
          selectedSubjects: quickEnrollData.subjects,
          orNumber: quickEnrollOrNumber,
          scholarship: quickEnrollScholarship,
          studentId: quickEnrollStudentId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the latest student ID in the system
        try {
          await fetch('/api/enrollment', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              updateLatestId: quickEnrollStudentId,
            }),
          });
          console.log('✅ Latest student ID updated to:', quickEnrollStudentId);
        } catch (updateError) {
          console.warn('⚠️ Failed to update latest student ID, but enrollment was successful:', updateError);
        }

        toast.success(`Quick enrolled ${quickEnrollData.enrollment.personalInfo?.firstName} ${quickEnrollData.enrollment.personalInfo?.lastName} with ${quickEnrollData.subjects.length} subjects.`, {
          autoClose: 6000,
        });
        setShowQuickEnrollModal(false);
        setQuickEnrollData(null);
        setQuickEnrollOrNumber('');
        setQuickEnrollScholarship('');
        setQuickEnrollStudentId('');
        // The real-time listener will automatically update the table
      } else {
        toast.error(data.error || 'Failed to quick enroll student.', {
          autoClose: 8000,
        });
      }
    } catch (error) {
      console.error('Error quick enrolling student:', error);
      toast.error('Network error occurred while quick enrolling student.', {
        autoClose: 7000,
      });
    } finally {
      setEnrollingStudent(false);
    }
  };

  const cancelQuickEnroll = () => {
    setShowQuickEnrollModal(false);
    setQuickEnrollData(null);
    setQuickEnrollOrNumber('');
    setQuickEnrollScholarship('');
    setQuickEnrollStudentId('');
  };

  const handleOpenEnrollModal = async () => {
    // Fetch the latest student ID and increment it
    try {
      const response = await fetch('/api/enrollment?getLatestId=true');
      const data = await response.json();

      if (response.ok && data.success && data.latestId) {
        const nextStudentId = incrementStudentId(data.latestId);
        setEnrollStudentId(nextStudentId);
      } else {
        console.warn('Failed to fetch latest student ID, using fallback');
        setEnrollStudentId('001-001'); // Fallback
      }
    } catch (error) {
      console.error('Error fetching latest student ID:', error);
      setEnrollStudentId('001-001'); // Fallback
    }

    setShowEnrollModal(true);
    setEnrollOrNumber('');
    setEnrollScholarship('');
  };

  const handleConfirmEnroll = async () => {
    if (!viewingEnrollment || selectedSubjects.length === 0) {
      toast.warning('Please select at least one subject before enrolling the student.', {
        autoClose: 5000,
      });
      return;
    }

    // Validate required fields
    if (!enrollOrNumber.trim()) {
      toast.error('OR Number is required.', { autoClose: 5000 });
      return;
    }
    if (!enrollScholarship.trim()) {
      toast.error('Scholarship is required.', { autoClose: 5000 });
      return;
    }
    if (!enrollStudentId.trim()) {
      toast.error('Student ID is required.', { autoClose: 5000 });
      return;
    }

    setEnrollingStudent(true);

    try {
      const response = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: viewingEnrollment.userId,
          selectedSubjects: selectedSubjects,
          orNumber: enrollOrNumber,
          scholarship: enrollScholarship,
          studentId: enrollStudentId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the latest student ID in the system
        try {
          await fetch('/api/enrollment', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              updateLatestId: enrollStudentId,
            }),
          });
          console.log('✅ Latest student ID updated to:', enrollStudentId);
        } catch (updateError) {
          console.warn('⚠️ Failed to update latest student ID, but enrollment was successful:', updateError);
        }

        toast.success(`Student ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} enrolled with ${selectedSubjects.length} subject(s).`, {
          autoClose: 6000,
        });
        setShowEnrollModal(false);
        // Close the modal
        closeViewModal();
      } else {
        toast.error(data.error || 'Failed to enroll student. Please try again.', {
          autoClose: 8000,
        });
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error('Network error occurred while enrolling student. Please check your connection and try again.', {
        autoClose: 7000,
      });
    } finally {
      setEnrollingStudent(false);
    }
  };

  const cancelEnrollModal = () => {
    setShowEnrollModal(false);
    setEnrollOrNumber('');
    setEnrollScholarship('');
    setEnrollStudentId('');
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingEnrollment(null);
    setActiveTab('student-info');
    setSelectedSubjectSets([]);
    setSelectedSubjects([]);
    setShowOtherSets(false);
    setShowRevokeModal(false);
    setRevokeCountdown(0);
    setShowQuickEnrollModal(false);
    setQuickEnrollData(null);
    setShowEnrollModal(false);
    setEnrollOrNumber('');
    setEnrollScholarship('');
    setEnrollStudentId('');
    setEnrollingStudent(false);
    setRevokingEnrollment(false);
  };

  const handleSubjectSetToggle = (subjectSetId: string, subjectIds: string[]) => {
    setSelectedSubjectSets(prev => {
      const isSelected = prev.includes(subjectSetId);
      let newSelectedSets;
      
      if (isSelected) {
        // Remove subject set and its subjects
        newSelectedSets = prev.filter(id => id !== subjectSetId);
        setSelectedSubjects(prevSubjects => 
          prevSubjects.filter(id => !subjectIds.includes(id))
        );
      } else {
        // Add subject set and its subjects (avoiding duplicates)
        newSelectedSets = [...prev, subjectSetId];
        setSelectedSubjects(prevSubjects => {
          const newSubjects = [...prevSubjects];
          subjectIds.forEach(subjectId => {
            if (!newSubjects.includes(subjectId)) {
              newSubjects.push(subjectId);
            }
          });
          return newSubjects;
        });
      }
      
      return newSelectedSets;
    });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      const isSelected = prev.includes(subjectId);
      if (isSelected) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleViewDocument = (doc: StudentDocument) => {
    setViewingDocument({
      url: doc.fileUrl,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileFormat: doc.fileFormat
    });
    setShowDocumentModal(true);
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setViewingDocument(null);
  };

  const handleEnrollStudent = async () => {
    if (!viewingEnrollment || selectedSubjects.length === 0) {
      toast.warning('Please select at least one subject before enrolling the student.', {
        autoClose: 5000,
      });
      return;
    }

    setEnrollingStudent(true);

    try {
      const response = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: viewingEnrollment.userId,
          selectedSubjects: selectedSubjects,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Student ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} enrolled with ${selectedSubjects.length} subject(s).`, {
          autoClose: 6000,
        });
        // Close the modal
        closeViewModal();
      } else {
        toast.error(data.error || 'Failed to enroll student. Please try again.', {
          autoClose: 8000,
        });
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error('Network error occurred while enrolling student. Please check your connection and try again.', {
        autoClose: 7000,
      });
    } finally {
      setEnrollingStudent(false);
    }
  };

  const handleRevokeEnrollment = () => {
    setShowRevokeModal(true);
    setRevokeCountdown(5);
  };

  const confirmRevokeEnrollment = async () => {
    if (!viewingEnrollment) {
      toast.error('Unable to find enrollment information. Please refresh and try again.', {
        autoClose: 5000,
      });
      return;
    }

    setRevokingEnrollment(true);

    try {
      const response = await fetch('/api/enrollment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: viewingEnrollment.userId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Enrollment for ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} has been revoked.`, {
          autoClose: 6000,
        });
        setShowRevokeModal(false);
        // Close the modal
        closeViewModal();
      } else {
        toast.error(data.error || 'Failed to revoke enrollment. Please try again.', {
          autoClose: 8000,
        });
      }
    } catch (error) {
      console.error('Error revoking enrollment:', error);
      toast.error('Network error occurred while revoking enrollment. Please check your connection and try again.', {
        autoClose: 7000,
      });
    } finally {
      setRevokingEnrollment(false);
    }
  };

  const cancelRevoke = () => {
    setShowRevokeModal(false);
    setRevokeCountdown(0);
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

  // Filter and sort enrollments
  const filteredAndSortedEnrollments = (() => {
    let filtered = enrollments;

    // Apply date filters first
    if (sortOption === 'last-3-days') {
      const threeDaysAgo = getDateRange(3);
      filtered = enrollments.filter(enrollment =>
        enrollment.submittedAt && getDateTimestamp(enrollment.submittedAt) >= threeDaysAgo.getTime()
      );
    } else if (sortOption === 'last-7-days') {
      const sevenDaysAgo = getDateRange(7);
      filtered = enrollments.filter(enrollment =>
        enrollment.submittedAt && getDateTimestamp(enrollment.submittedAt) >= sevenDaysAgo.getTime()
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
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
  })();

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


  // Helper function to increment student ID (YYY-XXX format)
  const incrementStudentId = (currentId: string): string => {
    try {
      const parts = currentId.split('-');
      if (parts.length !== 2) {
        throw new Error('Invalid ID format');
      }

      const prefix = parts[0]; // YYY part
      const numberPart = parseInt(parts[1]); // XXX part

      if (isNaN(numberPart)) {
        throw new Error('Invalid number part');
      }

      const nextNumber = numberPart + 1;
      // Pad with zeros to maintain 3-digit format
      const nextNumberStr = nextNumber.toString().padStart(3, '0');

      return `${prefix}-${nextNumberStr}`;
    } catch (error) {
      console.error('Error incrementing student ID:', error);
      // Return a fallback incremented ID
      return '001-001';
    }
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
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Date of Birth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Civil Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Nationality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Religion
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {formatFullName(
                        viewingEnrollment?.personalInfo?.firstName,
                        viewingEnrollment?.personalInfo?.middleName,
                        viewingEnrollment?.personalInfo?.lastName,
                        viewingEnrollment?.personalInfo?.nameExtension
                      )}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.personalInfo?.gender || 'N/A'}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.personalInfo?.civilStatus || 'N/A'}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.personalInfo?.citizenship || 'N/A'}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Email Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Place of Birth
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {studentProfiles[viewingEnrollment?.userId || '']?.email || viewingEnrollment?.personalInfo?.email || 'N/A'}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.personalInfo?.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.personalInfo?.placeOfBirth || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Academic Information Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Grade Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      School Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Enrollment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.enrollmentInfo?.gradeLevel || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.enrollmentInfo?.schoolYear || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.enrollmentInfo?.enrollmentDate ? formatDate(viewingEnrollment.enrollmentInfo.enrollmentDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(viewingEnrollment?.enrollmentInfo?.status || 'unknown')}`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <Calendar size={14} weight="fill" className="text-white" />
              </div>
              Enrollment Timeline
            </h3>
            <div className="bg-white border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Submitted At
                  </Label>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    {viewingEnrollment?.submittedAt ? formatDate(viewingEnrollment.submittedAt) : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Last Updated
                  </Label>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                  <p className="text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                           style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {documentTypes[key as keyof typeof documentTypes] || key}
                        </p>
                        <p className="text-xs text-gray-500"
                           style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {doc.fileName} • {doc.fileFormat.toUpperCase()} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-gray-400"
                           style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Uploaded: {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="px-3 py-1 bg-blue-800 text-white text-xs hover:bg-blue-900 transition-colors flex items-center gap-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
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
      label: 'Subject Assignment',
      icon: (
        <div className="w-5 h-5 bg-blue-800 flex items-center justify-center">
          <GraduationCapIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                    <GraduationCapIcon size={14} weight="fill" className="text-white" />
                  </div>
              Subject Assignment
            </h3>
            {selectedSubjects.length > 0 && (
              <div className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          
          {selectedSubjects.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-medium text-blue-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Selected Subjects:
                </h4>
                <button
                  onClick={() => {
                    setSelectedSubjectSets([]);
                    setSelectedSubjects([]);
                    toast.info('All selected subjects have been cleared.', {
                      autoClose: 4000,
                    });
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(selectedSubjects)).map((subjectId, index) => {
                  const subject = subjects[subjectId];
                  if (!subject) return null;
                  return (
                    <div 
                      key={`selected-${subjectId}-${index}`} 
                      className={`flex items-center gap-2 px-3 py-1 bg-${subject.color} border border-${subject.color} text-white text-xs`}
                    >
                      <div className="w-2 h-2 bg-white"></div>
                      {subject.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {(() => {
            const gradeLevel = viewingEnrollment?.enrollmentInfo?.gradeLevel;
            console.log('Grade level:', gradeLevel);
            console.log('Subject sets:', subjectSets);
            console.log('Subject sets for grade:', subjectSets[parseInt(gradeLevel || '0')]);
            
            if (!gradeLevel) {
              return (
                <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                  <p className="text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    No grade level information available
                  </p>
                </div>
              );
            }

            const gradeSubjectSets = subjectSets[parseInt(gradeLevel)] || [];
            console.log('Grade subject sets:', gradeSubjectSets);
            
            if (gradeSubjectSets.length === 0) {
              // Show all subject sets as fallback
              const allSubjectSets = Object.values(subjectSets).flat();
              console.log('No grade-specific sets, showing all:', allSubjectSets);
              
              if (allSubjectSets.length === 0) {
                return (
                  <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                    <p className="text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      No subject sets available
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 p-3 mb-4">
                    <p className="text-yellow-800 text-xs" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Showing all subject sets (Grade {gradeLevel} specific sets not found)
                    </p>
                  </div>
                  {allSubjectSets.map((subjectSet) => {
                    const isSubjectSetSelected = selectedSubjectSets.includes(subjectSet.id);
                    
                    return (
                      <div key={subjectSet.id} className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 animate-fadeInUp hover:scale-[1.02] ${
                        isSubjectSetSelected 
                          ? 'border-blue-800 bg-blue-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}>
                        <div 
                          className="flex items-center gap-3 mb-3"
                          onClick={() => handleSubjectSetToggle(subjectSet.id, subjectSet.subjects)}
                        >
                          <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                            isSubjectSetSelected 
                              ? 'border-blue-800 bg-blue-800' 
                              : 'border-gray-300'
                          }`}>
                            {isSubjectSetSelected && (
                              <div className="w-2 h-2 bg-white"></div>
                            )}
                          </div>
                          <div className={`w-4 h-4 bg-${subjectSet.color} flex items-center justify-center`}>
                            <div className="w-2 h-2 bg-white"></div>
                          </div>
                          <h4 className="text-md font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {subjectSet.name} (Grade {subjectSet.gradeLevel})
                          </h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {subjectSet.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {subjectSet.subjects.map((subjectId) => {
                            const subject = subjects[subjectId];
                            if (!subject) return null;
                            const isSubjectSelected = selectedSubjects.includes(subjectId);
                            
                            return (
                              <div 
                                key={subjectId} 
                                className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                                  isSubjectSelected 
                                    ? 'bg-blue-100 border-blue-300' 
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                                onClick={() => handleSubjectToggle(subjectId)}
                              >
                                <div className={`w-3 h-3 border flex items-center justify-center ${
                                  isSubjectSelected 
                                    ? 'border-blue-800 bg-blue-800' 
                                    : 'border-gray-300'
                                }`}>
                                  {isSubjectSelected && (
                                    <div className="w-1 h-1 bg-white"></div>
                                  )}
                                </div>
                                <div className={`w-3 h-3 bg-${subject.color}`}></div>
                                <span className={`text-xs ${
                                  isSubjectSelected ? 'text-blue-800 font-medium' : 'text-gray-700'
                                }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                  {subject.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {gradeSubjectSets.map((subjectSet) => {
                  const isSubjectSetSelected = selectedSubjectSets.includes(subjectSet.id);
                  
                  return (
                    <div 
                      key={subjectSet.id} 
                      className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 animate-fadeInUp hover:scale-[1.02] ${
                        isSubjectSetSelected 
                          ? 'border-blue-800 bg-blue-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-3 mb-3"
                        onClick={() => handleSubjectSetToggle(subjectSet.id, subjectSet.subjects)}
                      >
                        <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                          isSubjectSetSelected 
                            ? 'border-blue-800 bg-blue-800' 
                            : 'border-gray-300'
                        }`}>
                          {isSubjectSetSelected && (
                            <div className="w-2 h-2 bg-white"></div>
                          )}
                        </div>
                        <div className={`w-4 h-4 bg-${subjectSet.color} flex items-center justify-center`}>
                          <div className="w-2 h-2 bg-white"></div>
                        </div>
                        <h4 className="text-md font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {subjectSet.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        {subjectSet.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {subjectSet.subjects.map((subjectId) => {
                          const subject = subjects[subjectId];
                          if (!subject) return null;
                          const isSubjectSelected = selectedSubjects.includes(subjectId);
                          
                          return (
                            <div 
                              key={subjectId} 
                              className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                                isSubjectSelected 
                                  ? 'bg-blue-100 border-blue-300' 
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                              onClick={() => handleSubjectToggle(subjectId)}
                            >
                              <div className={`w-3 h-3 border flex items-center justify-center ${
                                isSubjectSelected 
                                  ? 'border-blue-800 bg-blue-800' 
                                  : 'border-gray-300'
                              }`}>
                                {isSubjectSelected && (
                                  <div className="w-1 h-1 bg-white"></div>
                                )}
                              </div>
                              <div className={`w-3 h-3 bg-${subject.color}`}></div>
                              <span className={`text-xs ${
                                isSubjectSelected ? 'text-blue-800 font-medium' : 'text-gray-700'
                              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                {subject.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          
          {/* Show Other Sets Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowOtherSets(!showOtherSets)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <div className="w-4 h-4 bg-gray-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-white"></div>
              </div>
              {showOtherSets ? 'Hide Other Sets' : 'Show Other Sets'}
            </button>
          </div>
          
          {/* Other Subject Sets */}
          {showOtherSets && (
            <div className="mt-4 space-y-4 animate-fadeInUp">
              <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                <div className="w-6 h-6 bg-gray-600 flex items-center justify-center">
                  <GraduationCapIcon size={14} weight="fill" className="text-white" />
                </div>
                All Subject Sets
              </h4>
              {(() => {
                const currentGrade = viewingEnrollment?.enrollmentInfo?.gradeLevel;
                const otherGrades = Object.entries(subjectSets).filter(([grade]) => {
                  return currentGrade ? parseInt(grade) !== parseInt(currentGrade) : true;
                });
                
                if (otherGrades.length === 0) {
                  return (
                    <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                      <p className="text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        No other subject sets available
                      </p>
                    </div>
                  );
                }
                
                return otherGrades.map(([grade, sets]) => (
                <div key={grade} className="space-y-3">
                  <h5 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Grade {grade}
                  </h5>
                  <div className="space-y-3">
                    {sets.map((subjectSet) => {
                      const isSubjectSetSelected = selectedSubjectSets.includes(subjectSet.id);
                      
                      return (
                        <div 
                          key={subjectSet.id} 
                          className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                            isSubjectSetSelected 
                              ? 'border-blue-800 bg-blue-50 shadow-lg' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div 
                            className="flex items-center gap-3 mb-3"
                            onClick={() => handleSubjectSetToggle(subjectSet.id, subjectSet.subjects)}
                          >
                            <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                              isSubjectSetSelected 
                                ? 'border-blue-800 bg-blue-800' 
                                : 'border-gray-300'
                            }`}>
                              {isSubjectSetSelected && (
                                <div className="w-2 h-2 bg-white"></div>
                              )}
                            </div>
                            <div className={`w-4 h-4 bg-${subjectSet.color} flex items-center justify-center`}>
                              <div className="w-2 h-2 bg-white"></div>
                            </div>
                            <h4 className="text-md font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                              {subjectSet.name}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {subjectSet.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {subjectSet.subjects.map((subjectId) => {
                              const subject = subjects[subjectId];
                              if (!subject) return null;
                              const isSubjectSelected = selectedSubjects.includes(subjectId);
                              
                              return (
                                <div 
                                  key={subjectId} 
                                  className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                                    isSubjectSelected 
                                      ? 'bg-blue-100 border-blue-300' 
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  onClick={() => handleSubjectToggle(subjectId)}
                                >
                                  <div className={`w-3 h-3 border flex items-center justify-center ${
                                    isSubjectSelected 
                                      ? 'border-blue-800 bg-blue-800' 
                                      : 'border-gray-300'
                                  }`}>
                                    {isSubjectSelected && (
                                      <div className="w-1 h-1 bg-white"></div>
                                    )}
                                  </div>
                                  <div className={`w-3 h-3 bg-${subject.color}`}></div>
                                  <span className={`text-xs ${
                                    isSubjectSelected ? 'text-blue-800 font-medium' : 'text-gray-700'
                                  }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                    {subject.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                ));
              })()}
            </div>
          )}
          
          {selectedSubjects.length > 0 && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  // TODO: Implement save functionality
                  console.log('Saving selected subjects:', selectedSubjects);
                  toast.success('Subject assignment has been saved successfully.', {
                    autoClose: 5000,
                  });
                }}
                className="px-4 py-2 bg-blue-800 text-white text-xs hover:bg-blue-900 transition-colors"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Save Assignment
              </button>
              <button
                onClick={() => {
                  setSelectedSubjectSets([]);
                  setSelectedSubjects([]);
                  toast.info('🔄 Selection Reset', {

                    autoClose: 4000,
                  });
                }}
                className="px-4 py-2 bg-gray-500 text-white text-xs hover:bg-gray-600 transition-colors"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'process',
      label: 'Process Enrollment',
      icon: (
        <div className="w-5 h-5 bg-blue-800 flex items-center justify-center">
          <Gear size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <User size={14} weight="fill" className="text-white" />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Full Name
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {formatFullName(
                    viewingEnrollment?.personalInfo?.firstName,
                    viewingEnrollment?.personalInfo?.middleName,
                    viewingEnrollment?.personalInfo?.lastName,
                    viewingEnrollment?.personalInfo?.nameExtension
                  )}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Date of Birth
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {(() => {
                    const birthMonth = viewingEnrollment?.personalInfo?.birthMonth;
                    const birthDay = viewingEnrollment?.personalInfo?.birthDay;
                    const birthYear = viewingEnrollment?.personalInfo?.birthYear;
                    if (birthMonth && birthDay && birthYear) {
                      return formatBirthDate(`${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`);
                    }
                    return 'N/A';
                  })()}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Gender
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {viewingEnrollment?.personalInfo?.gender || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Religion
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {viewingEnrollment?.personalInfo?.religion || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Citizenship
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {viewingEnrollment?.personalInfo?.citizenship || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Place of Birth
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {viewingEnrollment?.personalInfo?.placeOfBirth || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <Phone size={14} weight="fill" className="text-white" />
              </div>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Email Address
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {studentProfiles[viewingEnrollment?.userId || '']?.email || viewingEnrollment?.personalInfo?.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Phone Number
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {viewingEnrollment?.personalInfo?.phone || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <GraduationCapIcon size={14} weight="fill" className="text-white" />
              </div>
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Grade Level
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {viewingEnrollment?.enrollmentInfo?.gradeLevel || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  School Year
                </label>
                <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {viewingEnrollment?.enrollmentInfo?.schoolYear || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium upper text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Status
                </label>
                <p className="text-xs text-gray-900 capitalize font-mono" style={{fontWeight: 400 }}>
                  {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Enrollment Timeline */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              <div className="w-6 h-6 bg-blue-800 flex items-center justify-center">
                <Calendar size={14} weight="fill" className="text-white" />
              </div>
              Enrollment Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Submitted:
                </span>
                <span className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {formatDate(viewingEnrollment?.submittedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Last Updated:
                </span>
                <span className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {formatDate(viewingEnrollment?.updatedAt)}
                </span>
              </div>
            </div>
          </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={closeViewModal}
                  className="px-3 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <X size={16} />
                  Cancel
                </button>
                {viewingEnrollment?.enrollmentInfo?.status === 'enrolled' && (
                  <button
                    onClick={() => {
                      setShowPrintModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-800 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    disabled={enrollingStudent || revokingEnrollment}
                  >
                    <Printer size={16} />
                    Print
                  </button>
                )}
                {viewingEnrollment?.enrollmentInfo?.status === 'enrolled' ? (
                  <button
                    onClick={handleRevokeEnrollment}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    disabled={revokingEnrollment}
                  >
                    {revokingEnrollment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Revoking...
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        Revoke Enrollment
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleOpenEnrollModal}
                    className="flex-1 px-3 py-2 bg-blue-800 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    disabled={enrollingStudent}
                  >
                    {enrollingStudent ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Enroll
                      </>
                    )}
                  </button>
                )}
              </div>
        </div>
      )
    }
  ], [viewingEnrollment, studentProfiles, studentDocuments, subjectSets, subjects, selectedSubjectSets, selectedSubjects, showOtherSets]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        {/* Search and Controls Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-10 bg-gray-200 rounded flex-1 max-w-md animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        {/* Table Skeleton */}
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-light text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Student Enrollments
          </h1>
          <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Manage and review student enrollment applications
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Total Applications
              </p>
              <p className="text-2xl font-light text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {enrollments.length}
              </p>
            </div>

          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Pending Review
              </p>
              <p className="text-2xl font-light text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {enrollments.filter(e => e.enrollmentInfo.status === 'pending').length}
              </p>
            </div>
            <Calendar size={24} className="text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Approved
              </p>
              <p className="text-2xl font-light text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {enrollments.filter(e => e.enrollmentInfo.status === 'approved').length}
              </p>
            </div>
            <FileText size={24} className="text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Rejected
              </p>
              <p className="text-2xl font-light text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {enrollments.filter(e => e.enrollmentInfo.status === 'rejected').length}
              </p>
            </div>
            <FileText size={24} className="text-red-600" />
          </div>
        </Card>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search enrollments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
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
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <div className="flex items-center gap-2">
                <option.icon size={14} weight="bold" />
                {option.label}
              </div>
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          Showing {filteredAndSortedEnrollments.length} of {enrollments.length} enrollments
        </div>
      </div>

      {/* Enrollments Table */}
      <Card className="overflow-hidden pt-0 mt-0 mb-0 pb-0">
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
                    Grade Level
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Circle size={12} weight="bold" className="text-white" />
                    </div>
                    Status
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                      <Calendar size={12} weight="bold" className="text-white" />
                    </div>
                    Submitted
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
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
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    {searchQuery ? 'No enrollments match your search.' : 'No enrollments found.'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedEnrollments.map((enrollment) => (
                  <tr key={enrollment.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">

                        <div className="flex-shrink-0 h-10 w-10">
                          {studentProfiles[enrollment.userId]?.photoURL ? (
                            <img
                              src={studentProfiles[enrollment.userId].photoURL}
                              alt={`${enrollment.personalInfo?.firstName || 'Student'} profile`}
                              className="h-10 w-10 rounded-full object-cover border-2 border-black/80"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center">
                              <span className="text-white text-xs font-medium" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                {getInitials(enrollment.personalInfo?.firstName, enrollment.personalInfo?.lastName)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-xs font-medium text-gray-900"
                               style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 flex-shrink-0"
                          style={{ backgroundColor: getBgColor(getGradeColor(parseInt(enrollment.enrollmentInfo?.gradeLevel || '0'))) }}
                        ></div>
                        <div className="text-xs text-gray-900"
                             style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                              Grade {enrollment.enrollmentInfo?.gradeLevel || 'N/A'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-mono"
                           style={{ fontWeight: 400 }}>
                        {enrollment.enrollmentInfo?.schoolYear || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 flex-shrink-0"
                          style={{ backgroundColor: getStatusHexColor(enrollment.enrollmentInfo?.status || 'unknown') }}
                        ></div>
                        <span className="text-xs capitalize font-medium font-mono"
                              style={{ fontWeight: 400 }}>
                          {enrollment.enrollmentInfo?.status || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 border-r border-gray-200 font-mono"
                        style={{ fontWeight: 400 }}>
                      {formatDate(enrollment.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewEnrollment(enrollment)}
                          size="sm"
                          className="bg-blue-900 hover:bg-blue-800 text-white border"
                          disabled={enrollingStudent}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        {enrollment.enrollmentInfo?.status !== 'enrolled' && (
                          <Button
                            onClick={() => handleQuickEnroll(enrollment)}
                            size="sm"
                            className="bg-blue-900 text-white border hover:bg-blue-800"
                            disabled={enrollingStudent}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {enrollingStudent ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <Lightning size={14} className="mr-1" />
                                Quick Enroll
                              </>
                            )}
                          </Button>
                        )}
                        {enrollment.enrollmentInfo?.status === 'enrolled' && (
                          <Button
                            onClick={async () => {

                              // Get subjects for this enrollment
                              let subjectsToPrint: string[] = [];
                              const gradeLevel = enrollment.enrollmentInfo?.gradeLevel;

                              if (gradeLevel) {
                                const gradeSubjectSets = subjectSets[parseInt(gradeLevel)] || [];
                                console.log('📚 Available subject sets for grade', gradeLevel, ':', gradeSubjectSets.length);

                                if (gradeSubjectSets.length > 0) {
                                  const allSubjects = gradeSubjectSets.flatMap(set => set.subjects);
                                  subjectsToPrint = Array.from(new Set(allSubjects)); // Remove duplicates
                                  console.log('📝 Subjects to print:', subjectsToPrint.length, 'unique subjects (from', allSubjects.length, 'total)');
                                } else {
                                  console.warn('⚠️ No subject sets found for grade level', gradeLevel);
                                }
                              } else {
                                console.warn('⚠️ No grade level found for enrollment');
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
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            <Printer size={14} className="mr-1" />
                            Print
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Enrollment Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={closeViewModal}
        title="Student Enrollment Details"
        size="2xl"
      >
        {viewingEnrollment && (
          <div className="p-6  overflow-y-auto">

            {/* Student Profile Header */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50">
              <div className="flex-shrink-0 h-16 w-16 rounded-full border-2 border-gray-200 border-black/80">
                {studentProfiles[viewingEnrollment.userId]?.photoURL ? (
                  <img
                    src={studentProfiles[viewingEnrollment.userId].photoURL}
                    alt={`${viewingEnrollment.personalInfo?.firstName || 'Student'} profile`}
                    className="h-16 w-16 object-cover border-2 border-gray-200 rounded-full border-black/80"
                  />
                ) : (
                  <div className="h-16 w-16 bg-blue-900 flex items-center justify-center">
                    <span className="text-white text-lg font-medium" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {getInitials(viewingEnrollment.personalInfo?.firstName, viewingEnrollment.personalInfo?.lastName)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Grade {viewingEnrollment?.enrollmentInfo?.gradeLevel || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border border-gray-200 p-3 mb-6">
              <nav className="-mb-px flex">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  
                  // Get the appropriate icon based on tab id
                  const getTabIcon = (tabId: string, active: boolean) => {
                    const iconClass = active ? 'text-blue-800' : 'text-white';
                    const bgClass = active ? 'bg-white' : 'bg-blue-800';
                    
                    switch (tabId) {
                      case 'student-info':
                        return (
                          <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                            <UserIcon size={12} weight="fill" className={iconClass} />
                          </div>
                        );
                      case 'subjects':
                        return (
                          <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                            <GraduationCapIcon size={12} weight="fill" className={iconClass} />
                          </div>
                        );
                      case 'process':
                        return (
                          <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                            <Gear size={12} weight="fill" className={iconClass} />
                          </div>
                        );
                      case 'documents':
                        return (
                          <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                            <FileTextIcon size={12} weight="fill" className={iconClass} />
                          </div>
                        );
                      default:
                        return (
                          <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                            <UserIcon size={12} weight="fill" className={iconClass} />
                          </div>
                        );
                    }
                  };
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex-1 py-3 px-4 font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-800 text-white border-b-2 border-blue-800'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-b-2 border-transparent'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {getTabIcon(tab.id, isActive)}
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
        subjects={subjects as any}
        subjectSets={subjectSets as any}
        registrarName={registrarName}
      />

      {/* Revoke Enrollment Warning Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={cancelRevoke}
        title="Revoke Student Enrollment"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
              <X size={24} className="text-red-600" weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Dangerous Action
              </h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                This action cannot be undone
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <h4 className="text-xs font-medium text-red-900 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              The following will happen when you revoke this enrollment:
            </h4>
            <ul className="text-xs text-red-800 space-y-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              <li>• Student status will change back to "pending"</li>
              <li>• Enrollment date will be removed</li>
              <li>• All assigned subjects and grades will be deleted</li>
              <li>• Student will need to be enrolled again manually</li>
              <li>• Any existing grade records will be lost</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={cancelRevoke}
              className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Cancel
            </button>
            <button
              onClick={confirmRevokeEnrollment}
              disabled={revokeCountdown > 0 || revokingEnrollment}
              className={`flex-1 px-4 py-2 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                revokeCountdown > 0 || revokingEnrollment
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {revokingEnrollment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Revoking...
                </>
              ) : (
                <>
                  <X size={16} />
                  {revokeCountdown > 0 ? `Revoke in ${revokeCountdown}s` : 'Revoke Enrollment'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Enroll Preview Modal */}
      <Modal
        isOpen={showQuickEnrollModal}
        onClose={cancelQuickEnroll}
        title="Quick Enroll Preview"
        size="lg"
      >
        <div className="p-6">
          {quickEnrollData && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                  <Check size={24} className="text-blue-900" weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Quick Enroll Confirmation
                  </h3>
                  <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    Review subjects before enrolling {quickEnrollData.enrollment.personalInfo?.firstName} {quickEnrollData.enrollment.personalInfo?.lastName}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Student Information:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">
                      {formatFullName(
                        quickEnrollData.enrollment.personalInfo?.firstName,
                        quickEnrollData.enrollment.personalInfo?.middleName,
                        quickEnrollData.enrollment.personalInfo?.lastName,
                        quickEnrollData.enrollment.personalInfo?.nameExtension
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Grade Level:</span>
                    <span className="ml-2 text-gray-900">Grade {quickEnrollData.enrollment.enrollmentInfo?.gradeLevel}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="ml-2 text-gray-900 font-mono text-xs">
                      {studentProfiles[quickEnrollData.enrollment.userId]?.email || quickEnrollData.enrollment.personalInfo?.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">School Year:</span>
                    <span className="ml-2 text-gray-900">{quickEnrollData.enrollment.enrollmentInfo?.schoolYear}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Subjects to be Assigned ({quickEnrollData.subjects.length}):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {quickEnrollData.subjects.map((subjectId) => {
                    const subject = subjects[subjectId];
                    return subject ? (
                      <div
                        key={subjectId}
                        className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded"
                      >
                        <div className={`w-3 h-3 bg-${subject.color}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {subject.code || 'N/A'} - {subject.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(subject.lectureUnits || 0) + (subject.labUnits || 0)} units
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Enrollment Details:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      OR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={quickEnrollOrNumber}
                      onChange={(e) => setQuickEnrollOrNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="XXXXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Scholarship <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={quickEnrollScholarship}
                      onChange={(e) => setQuickEnrollScholarship(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="%XXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={quickEnrollStudentId}
                      onChange={(e) => setQuickEnrollStudentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="YYY-XXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <div className="flex items-start gap-2">

                  <div>
                    <h4 className="text-xs font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      What happens next?
                    </h4>
                    <ul className="text-xs text-gray-700 mt-1 space-y-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      <li>• Student will be enrolled with all subjects shown above</li>
                      <li>• Student status will change to "enrolled"</li>
                      <li>• Grade records will be created for each subject</li>
                      <li>• This action can be reversed by revoking enrollment</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelQuickEnroll}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmQuickEnroll}
                  className="flex-1 px-4 py-2 bg-blue-800 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  {enrollingStudent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Lightning size={16} />
                      Confirm Quick Enroll
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Enrollment Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={cancelEnrollModal}
        title="Enroll Student"
        size="md"
      >
        <div className="p-6">
          {viewingEnrollment && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                  <Check size={24} className="text-blue-900" weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Enroll Student
                  </h3>
                  <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    Enter enrollment details for {viewingEnrollment.personalInfo?.firstName} {viewingEnrollment.personalInfo?.lastName}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Student Information:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">
                      {formatFullName(
                        viewingEnrollment.personalInfo?.firstName,
                        viewingEnrollment.personalInfo?.middleName,
                        viewingEnrollment.personalInfo?.lastName,
                        viewingEnrollment.personalInfo?.nameExtension
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Grade Level:</span>
                    <span className="ml-2 text-gray-900">Grade {viewingEnrollment.enrollmentInfo?.gradeLevel}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Subjects:</span>
                    <span className="ml-2 text-gray-900">{selectedSubjects.length} selected</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Enrollment Details:
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      OR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={enrollOrNumber}
                      onChange={(e) => setEnrollOrNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="XXXXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Scholarship <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={enrollScholarship}
                      onChange={(e) => setEnrollScholarship(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="%XXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={enrollStudentId}
                      onChange={(e) => setEnrollStudentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="YYY-XXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <div className="flex items-start gap-2">
                  <div>
                    <h4 className="text-xs font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      What happens next?
                    </h4>
                    <ul className="text-xs text-gray-700 mt-1 space-y-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      <li>• Student will be enrolled with {selectedSubjects.length} selected subjects</li>
                      <li>• Student status will change to "enrolled"</li>
                      <li>• Grade records will be created for each subject</li>
                      <li>• Enrollment details will be saved to database</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelEnrollModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEnroll}
                  className="flex-1 px-4 py-2 bg-blue-800 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  {enrollingStudent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Confirm Enrollment
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
