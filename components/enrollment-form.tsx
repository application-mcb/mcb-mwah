'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { initializeApp } from 'firebase/app';
import { GraduationCap, BookOpen, Check, Warning, Calendar, IdentificationCard, Heart, User, Envelope, Phone, MapPin, Users, UserCircle, File, FileText, X, ArrowRight, ArrowLeft, Medal, Certificate, Clock, CalendarBlank, UserCheck, ShieldCheck, Info, WarningCircle, Calculator, Atom, Globe, Monitor, Palette, MusicNote, Book, Books } from '@phosphor-icons/react';
import { GradeData } from '@/lib/grade-section-database';

// Function to get appropriate icon based on subject content
const getSubjectIcon = (subject: any) => {
  const subjectName = (subject.name || '').toLowerCase();
  const subjectCode = (subject.code || '').toLowerCase();

  // Math-related subjects
  if (subjectName.includes('math') || subjectName.includes('calculus') || subjectName.includes('algebra') ||
      subjectName.includes('geometry') || subjectName.includes('trigonometry') || subjectName.includes('statistics') ||
      subjectCode.includes('math') || subjectCode.includes('calc')) {
    return Calculator;
  }

  // Science-related subjects
  if (subjectName.includes('science') || subjectName.includes('physics') || subjectName.includes('chemistry') ||
      subjectName.includes('biology') || subjectName.includes('geology') || subjectName.includes('astronomy') ||
      subjectCode.includes('sci') || subjectCode.includes('phy') || subjectCode.includes('chem') ||
      subjectCode.includes('bio')) {
    return Atom;
  }

  // Language/English subjects
  if (subjectName.includes('english') || subjectName.includes('language') || subjectName.includes('literature') ||
      subjectName.includes('grammar') || subjectName.includes('reading') || subjectName.includes('writing') ||
      subjectCode.includes('eng') || subjectCode.includes('lang')) {
    return Book;
  }

  // Social Studies/History subjects
  if (subjectName.includes('history') || subjectName.includes('social') || subjectName.includes('geography') ||
      subjectName.includes('civics') || subjectName.includes('economics') || subjectName.includes('government') ||
      subjectCode.includes('hist') || subjectCode.includes('soc') || subjectCode.includes('geo')) {
    return Globe;
  }

  // Computer/Technology subjects
  if (subjectName.includes('computer') || subjectName.includes('technology') || subjectName.includes('programming') ||
      subjectName.includes('coding') || subjectName.includes('ict') || subjectName.includes('digital') ||
      subjectCode.includes('comp') || subjectCode.includes('tech') || subjectCode.includes('prog')) {
    return Monitor;
  }

  // Art subjects
  if (subjectName.includes('art') || subjectName.includes('drawing') || subjectName.includes('painting') ||
      subjectName.includes('visual') || subjectName.includes('design') ||
      subjectCode.includes('art') || subjectCode.includes('draw')) {
    return Palette;
  }

  // Music subjects
  if (subjectName.includes('music') || subjectName.includes('choir') || subjectName.includes('band') ||
      subjectName.includes('orchestra') || subjectCode.includes('music')) {
    return MusicNote;
  }

  // Default icon for other subjects
  return BookOpen;
};

// Function to get appropriate icon color based on background
const getIconColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-700': '#1d4ed8',
    'blue-900': '#1e40af',
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

// Helper function to get color value
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8',
    'indigo-800': '#312e81'
  };
  return colorMap[color] || '#1e40af';
};

interface EnrollmentFormProps {
  userId: string;
  userProfile: any;
  onProgressUpdate?: () => void;
}

export default function EnrollmentForm({ userId, userProfile, onProgressUpdate }: EnrollmentFormProps) {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<GradeData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'high-school' | 'college' | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<'first-sem' | 'second-sem' | null>(null);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [currentStep, setCurrentStep] = useState<'compliance' | 'level-selection' | 'grade-selection' | 'course-selection' | 'year-selection' | 'semester-selection' | 'personal-info' | 'confirmation'>('compliance');
  const [animatingStep, setAnimatingStep] = useState(false);
  const [selectingGrade, setSelectingGrade] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [showDataPreserved, setShowDataPreserved] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState<any>(null);
  const [submittedEnrollment, setSubmittedEnrollment] = useState<any>(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEnrollment, setDeletingEnrollment] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  const [studentType, setStudentType] = useState<'regular' | 'irregular' | null>(null);
  const [showIrregularModal, setShowIrregularModal] = useState(false);
  const [documentsStatus, setDocumentsStatus] = useState<{
    uploaded: number;
    required: number;
    isComplete: boolean;
    uploadedDocuments?: any[];
  } | null>(null);
  const [checkingDocuments, setCheckingDocuments] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectsCarouselIndex, setSubjectsCarouselIndex] = useState(0);
  const subjectsLoadedRef = useRef(false);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Personal Information Form State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    extension: '',
    email: '',
    phone: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    placeOfBirth: '',
    gender: '',
    citizenship: '',
    religion: '',
    civilStatus: ''
  });

  useEffect(() => {
    loadGrades();
    checkExistingEnrollment();
    checkDocumentsStatus();
  }, []);

  useEffect(() => {
    const enrollmentToCheck = submittedEnrollment || existingEnrollment;
    if (enrollmentToCheck &&
        enrollmentToCheck.enrollmentInfo?.status === 'enrolled' &&
        !subjectsLoadedRef.current) {
      subjectsLoadedRef.current = true;
      loadStudentSubjects();
    }
  }, [submittedEnrollment?.enrollmentInfo?.status, existingEnrollment?.enrollmentInfo?.status]);

  // Countdown effect for submit modal
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (submitModalOpen && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [submitModalOpen, countdown]);

  // Countdown effect for delete modal
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showDeleteModal && deleteCountdown > 0) {
      interval = setInterval(() => {
        setDeleteCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showDeleteModal, deleteCountdown]);

  // Autofill personal information when userProfile is available
  useEffect(() => {
    if (userProfile) {
      console.log('Syncing user profile to enrollment form:', userProfile);
      setPersonalInfo({
        firstName: userProfile.firstName || '',
        middleName: userProfile.middleName || '',
        lastName: userProfile.lastName || '',
        extension: userProfile.nameExtension || '',
        email: userProfile.email || '',
        phone: userProfile.phoneNumber ? formatPhoneNumber(userProfile.phoneNumber) : '',
        birthMonth: userProfile.birthMonth || '',
        birthDay: userProfile.birthDay || '',
        birthYear: userProfile.birthYear || '',
        placeOfBirth: '', // Not stored in profile
        gender: userProfile.gender || '',
        citizenship: '', // Not stored in profile
        religion: '', // Not stored in profile
        civilStatus: userProfile.civilStatus || ''
      });
      console.log('Birthday fields synced:', {
        birthMonth: userProfile.birthMonth,
        birthDay: userProfile.birthDay,
        birthYear: userProfile.birthYear
      });

      // Format and display the birthday for verification
      if (userProfile.birthMonth && userProfile.birthDay && userProfile.birthYear) {
        const formattedBirthday = `${userProfile.birthMonth}/${userProfile.birthDay}/${userProfile.birthYear}`;
        console.log('Formatted birthday:', formattedBirthday);

        // Calculate age from profile data
        setTimeout(() => {
          calculateAgeFromValues(userProfile.birthMonth, userProfile.birthDay, userProfile.birthYear);
        }, 200);
      }
    }
  }, [userProfile]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/grades');
      if (!response.ok) {
        throw new Error('Failed to load grades');
      }
      const data = await response.json();
      setGrades(data.grades || []);
    } catch (error: any) {
      toast.error('Failed to load available grades');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingEnrollment = async () => {
    try {
      setCheckingEnrollment(true);
      subjectsLoadedRef.current = false; // Reset the ref when checking enrollment
      const response = await fetch(`/api/enrollment?userId=${userId}`);
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setExistingEnrollment(data.data);
      } else {
        setExistingEnrollment(null);
      }
    } catch (error) {
      console.error('Error checking existing enrollment:', error);
      setExistingEnrollment(null);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const checkDocumentsStatus = async () => {
    try {
      setCheckingDocuments(true);
      const response = await fetch(`/api/documents?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const documents = data.documents || [];

        // Define required documents based on the documents-manager.tsx structure
        const requiredTypes = ['reportCard', 'certificateOfGoodMoral', 'birthCertificate', 'idPicture'];
        const uploadedRequired = requiredTypes.filter(type => documents.some((doc: any) => doc.type === type));

        setDocumentsStatus({
          uploaded: uploadedRequired.length,
          required: requiredTypes.length,
          isComplete: uploadedRequired.length === requiredTypes.length,
          uploadedDocuments: documents // Store the full documents array for detailed checking
        });
      } else {
        setDocumentsStatus({
          uploaded: 0,
          required: 4,
          isComplete: false,
          uploadedDocuments: []
        });
      }
    } catch (error) {
      console.error('Error checking documents status:', error);
      setDocumentsStatus({
        uploaded: 0,
        required: 4,
        isComplete: false,
        uploadedDocuments: []
      });
    } finally {
      setCheckingDocuments(false);
    }
  };

  const loadStudentSubjects = async () => {
    try {
      setLoadingSubjects(true);
      
      // Get student's enrollment data to determine grade level
      const enrollmentResponse = await fetch(`/api/enrollment?userId=${userId}`);
      const enrollmentData = await enrollmentResponse.json();
      
      if (!enrollmentResponse.ok || !enrollmentData.success || !enrollmentData.data) {
        console.log('No enrollment data found for subjects');
        setSubjects([]);
        setLoadingSubjects(false);
        return;
      }

      const enrollmentInfo = enrollmentData.data;
      const gradeLevel = enrollmentInfo.enrollmentInfo?.gradeLevel;

      if (!gradeLevel) {
        console.log('No grade level found in enrollment');
        setSubjects([]);
        setLoadingSubjects(false);
        return;
      }

      // Load subjects and subject sets in parallel
      const [subjectsResponse, subjectSetsResponse] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/subject-sets')
      ]);

      const [subjectsData, subjectSetsData] = await Promise.all([
        subjectsResponse.json(),
        subjectSetsResponse.json()
      ]);

      // Process subjects
      let subjectsMap: Record<string, any> = {};
      if (subjectsResponse.ok && subjectsData.subjects) {
        subjectsData.subjects.forEach((subject: any) => {
          subjectsMap[subject.id] = subject;
        });
      }

      // Process subject sets
      let subjectSetsByGrade: Record<number, any[]> = {};
      if (subjectSetsResponse.ok && subjectSetsData.subjectSets) {
        const studentGradeLevel = parseInt(gradeLevel);
        
        subjectSetsData.subjectSets.forEach((subjectSet: any) => {
          const setGradeLevel = subjectSet.gradeLevel;
          
          // Only load subject sets for the student's grade level
          if (setGradeLevel === studentGradeLevel) {
            if (!subjectSetsByGrade[setGradeLevel]) {
              subjectSetsByGrade[setGradeLevel] = [];
            }
            subjectSetsByGrade[setGradeLevel].push(subjectSet);
          }
        });
      }

      // Get enrolled subjects - follow the pattern from my-subjects-view.tsx
      const enrolledSubjectIds = enrollmentInfo.selectedSubjects || [];
      
      // If no selected subjects, try to get all subjects for the student's grade level
      let finalSubjectIds = enrolledSubjectIds;
      if (enrolledSubjectIds.length === 0 && enrollmentInfo.enrollmentInfo?.gradeLevel) {
        const gradeLevelNum = parseInt(enrollmentInfo.enrollmentInfo.gradeLevel);
        // Get all subject sets for this grade level
        const gradeSubjectSets = Object.values(subjectSetsByGrade).flat().filter((set: any) => set.gradeLevel === gradeLevelNum);
        const allSubjectIds = gradeSubjectSets.flatMap((set: any) => set.subjects);
        finalSubjectIds = Array.from(new Set(allSubjectIds));
      }

      // Map subject IDs to actual subject data
      const enrolledSubjects = finalSubjectIds
        .map((subjectId: string) => subjectsMap[subjectId])
        .filter(Boolean);

      console.log('Loaded subjects for enrollment:', {
        enrolledSubjectIds,
        finalSubjectIds,
        enrolledSubjects: enrolledSubjects.map((s: any) => ({ id: s.id, name: s.name })),
        gradeLevel: enrollmentInfo.enrollmentInfo?.gradeLevel
      });

      setSubjects(enrolledSubjects);
      
    } catch (error) {
      console.error('Error loading student subjects:', error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleDeleteEnrollment = () => {
    setShowDeleteModal(true);
    setDeleteCountdown(5);
  };

  const confirmDeleteEnrollment = async () => {
    try {
      setDeletingEnrollment(true);

      const response = await fetch('/api/enrollment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Enrollment deleted successfully. You can now submit a new enrollment.', {
          autoClose: 6000,
        });
        setExistingEnrollment(null);
        setSubmittedEnrollment(null);
        setShowDeleteModal(false);
        // Reset form to initial state
        setSelectedGrade(null);
        setSelectedCourse(null);
        setSelectedLevel(null);
        setSelectedYear(null);
        setSelectedSemester(null);
        setPersonalInfo({
          firstName: '',
          middleName: '',
          lastName: '',
          extension: '',
          email: '',
          phone: '',
          birthMonth: '',
          birthDay: '',
          birthYear: '',
          placeOfBirth: '',
          gender: '',
          citizenship: '',
          religion: '',
          civilStatus: ''
        });
        setCurrentStep('compliance');
        setComplianceChecked(false);
      } else {
        toast.error(data.error || 'Failed to delete enrollment.', {
          autoClose: 8000,
        });
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Network error occurred while deleting enrollment.', {
        autoClose: 7000,
      });
    } finally {
      setDeletingEnrollment(false);
    }
  };

  const cancelDeleteEnrollment = () => {
    setShowDeleteModal(false);
    setDeleteCountdown(0);
  };

  const handleComplianceCheck = () => {
    setComplianceChecked(!complianceChecked);
  };

  const changeStep = (newStep: 'compliance' | 'level-selection' | 'grade-selection' | 'course-selection' | 'year-selection' | 'semester-selection' | 'personal-info' | 'confirmation') => {
    setAnimatingStep(true);
    setTimeout(() => {
      setCurrentStep(newStep);
      setAnimatingStep(false);
    }, 300);
  };

  // Helper function to check if personal info is completed
  const isPersonalInfoCompleted = () => {
    const hasSelection = selectedGrade !== null || (selectedCourse !== null && selectedYear !== null && selectedSemester !== null);
    return hasSelection &&
           personalInfo.firstName?.trim() && 
           personalInfo.lastName?.trim() && 
           personalInfo.email?.trim() && 
           personalInfo.phone?.trim() &&
           personalInfo.gender && 
           personalInfo.civilStatus;
  };


  const handleProgressStepClick = (step: 'compliance' | 'level-selection' | 'grade-selection' | 'course-selection' | 'year-selection' | 'semester-selection' | 'personal-info' | 'confirmation') => {
    // Dynamic step order based on selected level
    let stepOrder: string[];
    if (selectedLevel === 'college') {
      stepOrder = ['compliance', 'level-selection', 'course-selection', 'year-selection', 'semester-selection', 'personal-info', 'confirmation'];
    } else if (selectedLevel === 'high-school') {
      stepOrder = ['compliance', 'level-selection', 'grade-selection', 'personal-info', 'confirmation'];
    } else {
      stepOrder = ['compliance', 'level-selection'];
    }

    const currentStepIndex = stepOrder.indexOf(currentStep);
    const targetStepIndex = stepOrder.indexOf(step);
    
    // Check if the target step has been completed
    const isStepCompleted = (targetStep: string) => {
      switch (targetStep) {
        case 'compliance':
          return complianceChecked;
        case 'level-selection':
          return selectedLevel !== null;
        case 'grade-selection':
          return selectedGrade !== null;
        case 'course-selection':
          return selectedCourse !== null;
        case 'year-selection':
          return selectedYear !== null;
        case 'semester-selection':
          return selectedSemester !== null;
        case 'personal-info':
          return isPersonalInfoCompleted();
        case 'confirmation':
          return isPersonalInfoCompleted();
        default:
          return false;
      }
    };
    
    // Allow navigation if:
    // 1. It's the current step
    // 2. It's a previous step (always allowed)
    // 3. It's a future step that has been completed
    if (targetStepIndex <= currentStepIndex || isStepCompleted(step)) {
      // Save current form data before navigating
      saveCurrentStepData();
      
      // Show data preserved notification if navigating to a different step
      if (targetStepIndex !== currentStepIndex) {
        setShowDataPreserved(true);
        setTimeout(() => setShowDataPreserved(false), 3000);
      }
      
      changeStep(step);
    } else {
      // Show a helpful message for incomplete future steps
      toast.info(`Please complete the current step before proceeding to ${step.replace('-', ' ')}`);
    }
  };

  const saveCurrentStepData = () => {
    // This function ensures all current form data is preserved
    // The state variables (personalInfo, documents, selectedGrade, complianceChecked) 
    // are already being maintained by React state, so they persist automatically
    // when navigating between steps
    
    // Optional: You could add localStorage persistence here if needed
    // localStorage.setItem('enrollmentData', JSON.stringify({
    //   personalInfo,
    //   documents: Object.keys(documents).reduce((acc, key) => {
    //     acc[key] = documents[key as keyof typeof documents]?.name || null;
    //     return acc;
    //   }, {} as any),
    //   selectedGrade,
    //   complianceChecked
    // }));
  };


  const handleOpenSubmitModal = () => {
    setCountdown(5);
    setSubmitModalOpen(true);
  };

  const handleCloseSubmitModal = () => {
    setSubmitModalOpen(false);
    setCountdown(5);
  };


  const handleFinalSubmit = async () => {
    // Check if all required documents are uploaded
    if (!documentsStatus?.isComplete) {
      toast.error(`Please upload all required documents (${documentsStatus?.required || 4}) before submitting your enrollment. You have uploaded ${documentsStatus?.uploaded || 0} of ${documentsStatus?.required || 4} required documents.`, {
        autoClose: 8000,
      });
      return;
    }

    try {
      setEnrolling(true);

      // Submit enrollment without documents (they'll be referenced from the Documents section)
      const enrollmentData = {
        userId,
        personalInfo,
        studentType,
        documents: {} // Empty documents object - documents will be referenced separately
      };

      if (selectedLevel === 'college' && selectedCourse && selectedYear && selectedSemester) {
        // College enrollment
        Object.assign(enrollmentData, {
          courseId: selectedCourse.code, // Use code as the identifier since courses don't have id field
          courseCode: selectedCourse.code,
          courseName: selectedCourse.name,
          yearLevel: selectedYear,
          semester: selectedSemester,
          level: 'college'
        });
      } else if (selectedLevel === 'high-school' && selectedGrade) {
        // High school enrollment
        Object.assign(enrollmentData, {
          gradeId: selectedGrade.id,
          gradeLevel: selectedGrade.gradeLevel,
          department: selectedGrade.department,
          level: 'high-school'
        });
      }

      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit enrollment');
      }

      // Close modal
      setSubmitModalOpen(false);
      setCountdown(5);

      toast.success('Enrollment submitted successfully!');

      // Set the submitted enrollment as existing enrollment to show status
      const submittedEnrollment = {
        enrollmentInfo: {
          status: 'enrolled',
          gradeLevel: selectedLevel === 'college' ? null : selectedGrade?.gradeLevel,
          courseId: selectedLevel === 'college' ? selectedCourse?.code : null,
          courseCode: selectedLevel === 'college' ? selectedCourse?.code : null,
          courseName: selectedLevel === 'college' ? selectedCourse?.name : null,
          yearLevel: selectedLevel === 'college' ? selectedYear : null,
          semester: selectedLevel === 'college' ? selectedSemester : null,
          level: selectedLevel,
          schoolYear: new Date().getFullYear().toString(),
          enrollmentDate: new Date().toISOString(),
          studentType: selectedLevel === 'college' ? 'regular' : (studentType || 'regular')
        },
        personalInfo: personalInfo,
        selectedSubjects: selectedLevel === 'college' ? [] : [],
        documents: {}
      };

      setSubmittedEnrollment({
        enrollmentInfo: submittedEnrollment.enrollmentInfo,
        personalInfo: submittedEnrollment.personalInfo,
        selectedSubjects: submittedEnrollment.selectedSubjects,
        documents: submittedEnrollment.documents
      });

      // Reset form after successful submission
      setSelectedGrade(null);
      setSelectedCourse(null);
      setSelectedLevel(null);
      setSelectedYear(null);
      setSelectedSemester(null);
      setPersonalInfo({
        firstName: '',
        middleName: '',
        lastName: '',
        extension: '',
        email: '',
        phone: '',
        birthMonth: '',
        birthDay: '',
        birthYear: '',
        placeOfBirth: '',
        gender: '',
        citizenship: '',
        religion: '',
        civilStatus: ''
      });

    } catch (error: any) {
      toast.error(error.message || 'Failed to submit enrollment');
    } finally {
      setEnrolling(false);
    }
  };

  const handleProceedToLevelSelection = () => {
    if (!complianceChecked) {
      toast.error('Please check the compliance box to proceed');
      return;
    }
    changeStep('level-selection');
  };

  const handleLevelSelect = (level: 'high-school' | 'college') => {
    setSelectedLevel(level);
    setSelectedGrade(null);
    setSelectedCourse(null);
    setSelectedYear(null);
    if (level === 'high-school') {
    changeStep('grade-selection');
    } else {
      loadCourses();
      changeStep('course-selection');
    }
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to load courses');
      }
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error: any) {
      toast.error('Failed to load available courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCourseSelect = (course: any) => {
    setSelectedCourse(course);
    if (selectedLevel === 'college') {
      changeStep('year-selection');
    } else {
      changeStep('personal-info');
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    changeStep('semester-selection');
  };

  const handleSemesterSelect = (semester: 'first-sem' | 'second-sem') => {
    setSelectedSemester(semester);
    changeStep('personal-info');
  };


  const handleProceedToConfirmation = () => {
    // Validate personal information (documents are handled separately now)
    if (!personalInfo.firstName?.trim()) {
      toast.error('Please enter your first name');
      return;
    }

    if (!personalInfo.lastName?.trim()) {
      toast.error('Please enter your last name');
      return;
    }

    // Date of birth validation
    if (!personalInfo.birthMonth) {
      toast.error('Please select your birth month');
      return;
    }

    if (!personalInfo.birthDay) {
      toast.error('Please select your birth day');
      return;
    }

    if (!personalInfo.birthYear) {
      toast.error('Please select your birth year');
      return;
    }

    // Phone number validation
    if (!personalInfo.phone?.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!personalInfo.phone.startsWith('+63')) {
      toast.error('Phone number must start with +63');
      return;
    }

    const phoneDigits = personalInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 12) { // +63 (2) + 10 digits = 12 total
      toast.error('Please enter a valid 10-digit Philippine phone number');
      return;
    }

    // Gender validation
    if (!personalInfo.gender) {
      toast.error('Please select your gender');
      return;
    }

    // Civil status validation
    if (!personalInfo.civilStatus) {
      toast.error('Please select your civil status');
      return;
    }

    // Additional required field validation
    if (!personalInfo.email?.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!personalInfo.placeOfBirth?.trim()) {
      toast.error('Please enter your place of birth');
      return;
    }

    if (!personalInfo.citizenship?.trim()) {
      toast.error('Please enter your citizenship');
      return;
    }

    if (!personalInfo.religion?.trim()) {
      toast.error('Please enter your religion');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    console.log('Proceeding to confirmation with personal info:', personalInfo);
    changeStep('confirmation');
  };

  const handleProceedToFinalConfirmation = () => {
    console.log('Proceeding to final confirmation');
    changeStep('confirmation');
  };

 

   const handleBackToLevelSelection = () => {
    setSelectedLevel(null);
    setSelectedGrade(null);
    setSelectedCourse(null);
    changeStep('level-selection');
  };

   const handleBackToGradeSelection = () => {
    setSelectedGrade(null);
    changeStep('grade-selection');
  };

  const handleBackToCourseSelection = () => {
    setSelectedCourse(null);
    changeStep('course-selection');
  };

  const handleBackToSemesterSelection = () => {
    setSelectedSemester(null);
    changeStep('semester-selection');
  };

  const handleBackToPersonalInfo = () => {
    changeStep('personal-info');
  };


  const handleBackToCompliance = () => {
    setSelectedGrade(null);
    setSelectedCourse(null);
    setSelectedLevel(null);
    changeStep('compliance');
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // If empty, return empty
    if (!digits) return '';

    // If starts with 63, keep it
    if (digits.startsWith('63')) {
      const withoutCountryCode = digits.substring(2);
      if (withoutCountryCode.length <= 10) {
        // Format as +63 XXX XXX XXXX
        const formatted = withoutCountryCode.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        return `+63${formatted}`;
      }
    }

    // If starts with 0, remove it and add +63
    if (digits.startsWith('0')) {
      const withoutZero = digits.substring(1);
      if (withoutZero.length <= 10) {
        const formatted = withoutZero.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        return `+63${formatted}`;
      }
    }

    // If doesn't start with 63 or 0, treat as local number
    if (digits.length <= 10) {
      const formatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
      return `+63${formatted}`;
    }

    // If too long, truncate to 10 digits
    const truncated = digits.substring(0, 10);
    const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    return `+63${formatted}`;
  };

  const handlePhoneNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent deletion of +63 prefix
    if (e.key === 'Backspace' && personalInfo.phone.startsWith('+63') && personalInfo.phone.length <= 3) {
      e.preventDefault();
      return;
    }

    // Prevent typing 0 as first character (after +63)
    if (e.key === '0' && personalInfo.phone === '+63') {
      e.preventDefault();
      return;
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPersonalInfo(prev => ({
      ...prev,
      phone: formatted
    }));

    // Calculate age if needed (though phone change shouldn't affect age)
    // This is just to maintain consistency with the change handler pattern
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Calculate age immediately with updated values
      if (field === 'birthMonth' || field === 'birthDay' || field === 'birthYear') {
        calculateAgeFromValues(updated.birthMonth, updated.birthDay, updated.birthYear);
      }

      return updated;
    });
  };

  const calculateAgeFromValues = (birthMonth: string, birthDay: string, birthYear: string) => {
    if (!birthMonth || !birthDay || !birthYear) {
      setCalculatedAge(null);
      return;
    }

    const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay));
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // If birthday hasn't occurred this year yet, subtract 1 from age
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Validate that the calculated age is reasonable (between 5 and 100)
    if (age >= 5 && age <= 100) {
      setCalculatedAge(age);
      console.log(`Age calculated: ${age} years old (DOB: ${birthMonth}/${birthDay}/${birthYear})`);
    } else {
      setCalculatedAge(null);
      console.log(`Invalid age calculated: ${age} (must be between 5-100)`);
    }
  };

  const calculateAge = () => {
    const { birthMonth, birthDay, birthYear } = personalInfo;
    calculateAgeFromValues(birthMonth, birthDay, birthYear);
  };

  // Helper function to determine if a grade level is regular or irregular
  const isRegularGradeLevel = (gradeLevel: number): boolean => {
    // Regular grades: 7 (JHS entry), 11 (SHS entry), 1 (College freshman)
    return gradeLevel === 7 || gradeLevel === 11 || gradeLevel === 1;
  };

  const handleGradeSelect = (grade: GradeData) => {
    setSelectingGrade(grade.id);

    // Check if this is an irregular grade level
    const isRegular = isRegularGradeLevel(grade.gradeLevel);

    if (!isRegular) {
      // Show irregular student modal
      setTimeout(() => {
        setSelectingGrade(null);
        setShowIrregularModal(true);
        // Store the selected grade temporarily
        setSelectedGrade(grade);
      }, 600);
    } else {
      // Regular grade level - proceed normally
      setTimeout(() => {
        setSelectedGrade(grade);
        setStudentType('regular');
        setSelectingGrade(null);
        changeStep('personal-info');
      }, 600);
    }
  };

  const confirmIrregularStudent = () => {
    setStudentType('irregular');
    setShowIrregularModal(false);
    changeStep('personal-info');
  };

  const cancelIrregularStudent = () => {
    setSelectedGrade(null);
    setShowIrregularModal(false);
  };

  const handleSubmitEnrollment = async () => {
    if (!selectedGrade) return;

    try {
      setEnrolling(true);

      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          gradeId: selectedGrade.id,
          gradeLevel: selectedGrade.gradeLevel,
          department: selectedGrade.department,
          personalInfo,
          studentType: studentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit enrollment');
      }

      toast.success('Enrollment submitted successfully! You will be notified once it\'s processed.');

      // Trigger progress update callback
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading || checkingEnrollment || checkingDocuments) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 animate-pulse rounded w-48"></div>
            <div className="h-4 bg-gray-100 animate-pulse rounded w-64"></div>
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
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show document upload message if required documents are not complete
  if (documentsStatus && !documentsStatus.isComplete) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
              <Warning size={20} className="text-white" weight="bold" />
        </div>
        <div>
          <h1
            className="text-2xl font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
                Complete Document Requirements
          </h1>
          <p
            className="text-sm text-gray-600"
             
          >
                You must upload all required documents before proceeding with enrollment
          </p>
            </div>
        </div>
      </div>

        {/* Document Requirements Alert */}
        <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
              <FileText size={24} className="text-blue-900" weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                Required Documents Missing
              </h3>
              <p className="text-sm text-gray-600"  >
                You have uploaded {documentsStatus.uploaded} of {documentsStatus.required} required documents.
                Complete document upload to access the enrollment form.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Required Documents:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'reportCard', name: 'Report Card (Form 138)' },
                  { key: 'certificateOfGoodMoral', name: 'Certificate of Good Moral Character' },
                  { key: 'birthCertificate', name: 'Birth Certificate' },
                  { key: 'idPicture', name: 'ID Picture' }
                ].map((doc) => {
                  const isUploaded = documentsStatus?.uploadedDocuments?.some((uploadedDoc: any) => uploadedDoc.type === doc.key) || false;
                  return (
                    <div key={doc.key} className="flex items-center gap-3">
                      <div className={`w-5 h-5 flex items-center justify-center border-2 ${
                        isUploaded
                          ? 'border-blue-900 bg-blue-900'
                          : 'border-gray-300'
                      }`}>
                        {isUploaded ? (
                          <Check size={12} className="text-white" weight="bold" />
                        ) : (
                          <div className="w-3 h-3 border border-gray-300"></div>
                        )}
                      </div>
                      <span className={`text-sm ${
                        isUploaded ? 'text-blue-900' : 'text-gray-700'
                      }`}  >
                        {doc.name}
                        {!isUploaded && <span className="text-gray-500 ml-1">*</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
      </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  toast.info('Navigate to the Documents section in your dashboard sidebar to upload required documents.');
                }}
                className="bg-blue-900 hover:bg-blue-900 text-white"
                 
              >
                <FileText size={16} className="mr-2" />
                Go to Documents Section
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                 
              >
                Refresh Status
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Information */}
        <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
          <h3 className="text-lg font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
            Need Help?
          </h3>
          <div className="text-sm text-gray-700 space-y-2"  >
            <p>• Navigate to the <strong>Documents</strong> section in your dashboard sidebar</p>
            <p>• Upload each required document using the upload buttons</p>
            <p>• Ensure all documents are clearly readable and complete</p>
            <p>• Once all documents are uploaded, return here to access the enrollment form</p>
          </div>
        </Card>
      </div>
    );
  }

  // Show enrollment summary if student already has an enrollment with 'enrolled' status
  const enrollmentToShow = submittedEnrollment || existingEnrollment;
  if (enrollmentToShow && enrollmentToShow.enrollmentInfo?.status === 'enrolled') {
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

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'enrolled':
          return 'bg-blue-900 text-white';
        case 'approved':
          return 'bg-gray-100 text-gray-800';
        case 'pending':
          return 'bg-gray-200 text-gray-700';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'enrolled':
          return <Check size={16} weight="bold" />;
        case 'approved':
          return <Check size={16} weight="bold" />;
        case 'pending':
          return <Warning size={16} weight="bold" />;
        default:
          return <Warning size={16} weight="bold" />;
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                <Check size={20} className="text-white" weight="bold" />
              </div>
              <div>
                <h1
                  className="text-2xl font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Enrollment Submitted
                </h1>
                <p
                  className="text-sm text-gray-600"
                   
                >
                  Your enrollment application has been submitted and is being processed
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Enrollment Details Grid */}
        <div className="space-y-6">
          {/* First Row - Personal Info, Academic Info, Actions */}
         

          {/* Second Row - Subjects Carousel */}
          <div className="bg-white p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
                <BookOpen size={16} className="text-white" weight="bold" />
              </div>
              <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                Enrolled Subjects
              </h3>
            </div>
            
            {/* Subjects Carousel */}
            <div className="relative overflow-hidden">
              {loadingSubjects ? (
                <div className="flex justify-center">
                  <div className="p-8 bg-gray-50 border border-gray-200 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900 mx-auto mb-3"></div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Loading subjects...
                    </h4>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      Please wait while we fetch your enrolled subjects
                    </p>
                  </div>
                </div>
              ) : subjects && subjects.length > 0 ? (
                <>
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${subjectsCarouselIndex * 100}%)` }}
                  >
                    {Array.from({ length: Math.ceil(subjects.length / 3) }).map((_, groupIndex) => (
                      <div key={groupIndex} className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${groupIndex * 150}ms` }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subjects.slice(groupIndex * 3, (groupIndex + 1) * 3).map((subject: any, subjectIndex: number) => {
                            const IconComponent = getSubjectIcon(subject);
                            return (
                              <div
                                key={subject.id}
                                className="group p-6 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-l-5 transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
                                style={{ 
                                  backgroundColor: getColorValue(subject.color),
                                  borderLeftColor: getColorValue(subject.color),
                                  animationDelay: `${(groupIndex * 150) + (subjectIndex * 75) + 200}ms`,
                                  animationFillMode: 'both'
                                }}
                              >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white flex items-center justify-center flex-shrink-0">
                                      <IconComponent
                                        size={32}
                                        style={{ color: getColorValue(subject.color) }}
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
                                        <div className="w-3 h-3 bg-white"></div>
                                        <div className="w-3 h-3 bg-white/80"></div>
                                        <div className="w-3 h-3 bg-white/60"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                  <div className="flex items-center p-1 text-xs font-medium rounded-none border border-white/30 bg-white/20 text-white">
                                    <BookOpen size={12} className="mr-1" weight="duotone" />
                                    Grade {subject.gradeLevel}
                                  </div>
                                  <div className="flex items-center p-1 text-xs font-medium rounded-none border border-white/30 bg-white/20 text-white">
                                    <Calculator size={12} className="mr-1" weight="duotone" />
                                    {(subject.lectureUnits || 0) + (subject.labUnits || 0)} units
                                  </div>
                                </div>

                                <div className="flex flex-col text-xs truncate-2-lines font-light text-justify">
                                  <span className="text-white text-sm font-medium">{subject.code} {subject.name}</span>
                                  <span className="text-white">{subject.description}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Subjects carousel dots */}
                  <div className="flex justify-center mt-4 space-x-2">
                    {Array.from({ length: Math.ceil(subjects.length / 3) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSubjectsCarouselIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                          index === subjectsCarouselIndex ? 'bg-blue-900' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-shrink-0 w-full">
                  <div className="p-8 bg-gray-50 border border-gray-200 text-center">
                    <BookOpen size={32} className="mx-auto text-gray-400 mb-3" />
                    <h4 className="text-sm font-medium text-gray-500 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      No subjects found
                    </h4>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      No subjects are currently assigned to your grade level
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={cancelDeleteEnrollment}
          title="Delete Enrollment Submission"
          size="md"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
              <Warning size={24} className="text-gray-600" weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Dangerous Action
              </h3>
              <p className="text-xs text-gray-600"  >
                This action cannot be undone
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
            <h4 className="text-xs font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              What happens when you delete your enrollment?
            </h4>
            <ul className="text-xs text-gray-700 space-y-1"  >
                <li>• Your current enrollment submission will be permanently deleted</li>
                <li>• All associated data will be removed from our system</li>
                <li>• You will need to complete the enrollment process again from the beginning</li>
                <li>• Any progress made on your application will be lost</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={cancelDeleteEnrollment}
                variant="outline"
                className="flex-1"
                disabled={deletingEnrollment}
                 
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteEnrollment}
                disabled={deletingEnrollment || deleteCountdown > 0}
                className={`flex-1 ${
                  deletingEnrollment || deleteCountdown > 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-900 hover:bg-blue-900'
                }`}
                 
              >
                {deletingEnrollment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <X size={16} className="mr-2" />
                    {deleteCountdown > 0 ? `Delete in ${deleteCountdown}s` : 'Delete Enrollment'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
              <GraduationCap size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1
                className="text-2xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Student Enrollment
              </h1>
              <p
                className="text-sm text-gray-600"
                 
              >
                Select your grade level and complete your enrollment process
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Progress Indicator */}
      <div className="bg-white p-6 border border-gray-200 shadow-lg">
        <div className="relative">
          {/* Progress Steps Container */}
          <div className="flex justify-between items-start relative">
            {/* Progress Line Background - positioned behind circles */}
            <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 z-0"></div>
            
            {/* Animated Progress Line - positioned behind circles */}
            <div 
              className="absolute top-6 left-6 h-1 bg-gradient-to-r from-blue-600 to-blue-900 transition-all duration-1000 ease-out z-10"
              style={{
                width: (() => {
                  let steps: string[];
                  if (selectedLevel === 'college') {
                    steps = ['compliance', 'level-selection', 'course-selection', 'year-selection', 'personal-info', 'confirmation'];
                  } else {
                    steps = ['compliance', 'level-selection', 'grade-selection', 'personal-info', 'confirmation'];
                  }

                  let stepIndex = steps.indexOf(currentStep);

                  // Handle course-selection as grade-selection for high school
                  if (stepIndex === -1 && currentStep === 'course-selection' && selectedLevel === 'high-school') {
                    stepIndex = steps.indexOf('grade-selection');
                  }

                  // Calculate based on step position with proper spacing
                  if (stepIndex >= 0) {
                  // Define progress positions as variables for easy editing
                  const collegePositions = [0, 15, 30, 45, 60, 75, 93]; // 7 steps
                  const highSchoolPositions = [0, 22.5, 45, 69, 93]; // 5 steps

                    const positions = selectedLevel === 'college' ? collegePositions : highSchoolPositions;
                    return `${positions[stepIndex]}%`;
                  }

                  return '0%';
                })()
              }}
            ></div>
            {/* Step 1: Compliance */}
            <div 
              key="compliance-step"
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'compliance' ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick('compliance')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'compliance' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                complianceChecked ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <Check size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {currentStep === 'compliance' && (
                  <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                currentStep === 'compliance' ? 'text-blue-900 font-semibold' :
                complianceChecked ? 'text-blue-900' : 'text-gray-400 group-hover:text-gray-600'
              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Compliance
            </span>
          </div>

            {/* Step 2: Level Selection */}
            <div 
              key="level-selection-step"
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'level-selection' ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick('level-selection')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'level-selection' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                selectedLevel !== null ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <User size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {currentStep === 'level-selection' && (
                  <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                currentStep === 'level-selection' ? 'text-blue-900 font-semibold' :
                selectedLevel !== null ? 'text-blue-900' : 'text-gray-400 group-hover:text-gray-600'
              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Level Selection
            </span>
          </div>

            {/* Step 3: Grade/Course Selection */}
            <div
              key="selection-step"
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                (currentStep === 'grade-selection' || currentStep === 'course-selection') ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick(selectedLevel === 'high-school' ? 'grade-selection' : 'course-selection')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                (currentStep === 'grade-selection' || currentStep === 'course-selection') ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                (selectedGrade !== null || selectedCourse !== null) ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <GraduationCap size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {(currentStep === 'grade-selection' || currentStep === 'course-selection') && (
                  <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                (currentStep === 'grade-selection' || currentStep === 'course-selection') ? 'text-blue-900 font-semibold' :
                (selectedGrade !== null || selectedCourse !== null) ? 'text-blue-900' : 'text-gray-400 group-hover:text-gray-600'
              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {selectedLevel === 'high-school' ? 'Grade Selection' :
                 selectedLevel === 'college' ? 'Course Selection' :
                 'Selection'}
            </span>
          </div>

            {/* Step 4: Year Selection (College only) */}
            {selectedLevel === 'college' && (
              <div
                key="year-selection-step"
                className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                  currentStep === 'year-selection' ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => handleProgressStepClick('year-selection')}
              >
                <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                  currentStep === 'year-selection' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                  selectedYear !== null ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}>
                  <User size={18} weight="bold" className="transition-all duration-300" />
                  {/* Pulse animation for current step */}
                  {currentStep === 'year-selection' && (
                    <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                  )}
                </div>
                <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                  currentStep === 'year-selection' ? 'text-blue-900 font-semibold' :
                  selectedYear !== null ? 'text-blue-900' : 'text-gray-400 group-hover:text-gray-600'
                }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Year Level
                </span>
              </div>
            )}

            {/* Step 5: Semester Selection (College only) */}
            {selectedLevel === 'college' && (
              <div
                key="semester-selection-step"
                className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                  currentStep === 'semester-selection' ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => handleProgressStepClick('semester-selection')}
              >
                <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                  currentStep === 'semester-selection' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                  selectedSemester !== null ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}>
                  <Calendar size={18} weight="bold" className="transition-all duration-300" />
                  {/* Pulse animation for current step */}
                  {currentStep === 'semester-selection' && (
                    <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                  )}
                </div>
                <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                  currentStep === 'semester-selection' ? 'text-blue-900 font-semibold' :
                  selectedSemester !== null ? 'text-blue-900' : 'text-gray-400 group-hover:text-gray-600'
                }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Semester
                </span>
              </div>
            )}

            {/* Step 6/5: Personal Info */}
            <div
              key="personal-info-step"
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'personal-info' ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick('personal-info')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'personal-info' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                isPersonalInfoCompleted() ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <User size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {currentStep === 'personal-info' && (
                  <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                currentStep === 'personal-info' ? 'text-blue-900 font-semibold' :
                isPersonalInfoCompleted() ? 'text-blue-900' : 'text-gray-400 group-hover:text-gray-600'
              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Personal Info
            </span>
          </div>

            {/* Step 7/6: Confirmation */}
            <div 
              key="confirmation-step"
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'confirmation' ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick('confirmation')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'confirmation' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                isPersonalInfoCompleted() ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <Check size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {currentStep === 'confirmation' && (
                  <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                currentStep === 'confirmation' ? 'text-blue-900 font-semibold' :
                isPersonalInfoCompleted() ? 'text-blue-900' : 'text-gray-400 group-hover:text-gray-600'
              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Confirmation
            </span>
            </div>
          </div>
        </div>
      </div>


      {/* Loading State */}
      {!userProfile && (
        <Card className="p-8 border-none bg-gray-50 border-l-5 border-blue-900">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-none h-8 w-8 border-2 border-blue-900/30 border-t-blue-900 mx-auto"></div>
            <p className="text-gray-600"  >
              Loading your profile information...
            </p>
          </div>
        </Card>
      )}

      {/* Step Content */}
      {userProfile && currentStep === 'compliance' && (
        <Card className={`p-8 border-none bg-gray-50 border-l-5 border-blue-900 h-full transition-all duration-500 ${animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-900 flex items-center justify-center mx-auto">
              <BookOpen size={32} className="text-white" weight="fill" />
            </div>
                  <div className="space-y-4 flex flex-col items-center">
                    <h3
                      className="text-xl font-medium text-gray-900 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Enrollment Compliance Agreement
                    </h3>
              <p
                className="text-gray-600 text-sm text-justify max-w-2xl mx-auto border-l-5 border-blue-900 p-4 bg-blue-50"
                 
              >
                Before proceeding with enrollment, you must acknowledge and agree to comply with all school policies, academic requirements, and institutional guidelines. This includes maintaining academic integrity, following the code of conduct, and meeting all course prerequisites. By checking the box below, you confirm your understanding and commitment to these standards.
              </p>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="compliance-check"
                    checked={complianceChecked}
                    onChange={handleComplianceCheck}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 transition-all duration-200"
                  />

                <label
                  htmlFor="compliance-check"
                  className="text-sm text-gray-900 cursor-pointer"
                   
                >
                  I acknowledge and agree to comply with all school policies and requirements
                </label>
              </div>
            </div>

            <div className="space-y-4">
             
            </div>

            <Button
              onClick={handleProceedToLevelSelection}
              disabled={!complianceChecked}
              className={`bg-blue-900 hover:bg-blue-900 transition-all duration-300 hover:shadow-lg ${!complianceChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
               
            >
              Proceed to Level Selection
            </Button>
          </div>
        </Card>
      )}

      {userProfile && currentStep === 'level-selection' && (
        <div className={`space-y-6 transition-all duration-500 ${animatingStep ? 'opacity-0 transform -translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <User size={20} className="text-white" weight="bold" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Select Your Education Level
                  </h2>
                  <p
                    className="text-sm text-gray-600"

                  >
                    Choose whether you're enrolling for high school or college
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToCompliance}

            >
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* High School Option */}
            <Card
              className="group p-8 border-none bg-gray-50 hover:border-blue-900 cursor-pointer border-l-5 hover:shadow-lg transition-all duration-300"
              onClick={() => handleLevelSelect('high-school')}
            >
              <div className="space-y-6 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-blue-900 flex items-center justify-center">
                      <GraduationCap size={32} weight="fill" className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xl font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        High School
                      </h3>
                      <p
                        className="text-sm text-gray-600"

                      >
                        Grades 7-12
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className="text-sm text-gray-700"

                >
                  Select this option if you're enrolling for junior high school (Grade 7-10) or senior high school (Grade 11-12) programs.
                </p>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check size={16} className="text-blue-900" weight="bold" />
                    <span>Grade-based curriculum</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check size={16} className="text-blue-900" weight="bold" />
                    <span>Subject sets by grade level</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check size={16} className="text-blue-900" weight="bold" />
                    <span>Regular/Irregular student options</span>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm text-gray-600"

                    >
                      Click to select
                    </span>
                    <div className="w-6 h-6 border-2 border-blue-900"></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* College Option */}
            <Card
              className="group p-8 border-none bg-gray-50 hover:border-blue-900 cursor-pointer border-l-5 hover:shadow-lg transition-all duration-300"
              onClick={() => handleLevelSelect('college')}
            >
              <div className="space-y-6 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-blue-900 flex items-center justify-center">
                      <GraduationCap size={32} weight="fill" className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xl font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        College
                      </h3>
                      <p
                        className="text-sm text-gray-600"

                      >
                        Degree Programs
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className="text-sm text-gray-700"

                >
                  Select this option if you're enrolling for college degree programs and courses.
                </p>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check size={16} className="text-blue-900" weight="bold" />
                    <span>Course-based curriculum</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check size={16} className="text-blue-900" weight="bold" />
                    <span>Degree program enrollment</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check size={16} className="text-blue-900" weight="bold" />
                    <span>Subject selection by course</span>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm text-gray-600"

                    >
                      Click to select
                    </span>
                    <div className="w-6 h-6 border-2 border-blue-900"></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {userProfile && currentStep === 'grade-selection' && (
        <div className={`space-y-6 transition-all duration-500 ${animatingStep ? 'opacity-0 transform -translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <GraduationCap size={20} className="text-white" weight="bold" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Select Your Grade Level
                  </h2>
                  <p
                    className="text-sm text-gray-600"
                     
                  >
                    Choose the grade level you wish to enroll in
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToLevelSelection}
               
            >
              Back
            </Button>
          </div>

          {grades.length === 0 ? (
            <Card className="p-12 text-center border-none bg-gray-50 border-l-5 border-blue-900">
              <GraduationCap size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
              <h3
                className="text-lg font-medium text-gray-900 mb-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                No grades available
              </h3>
              <p
                className="text-gray-600 text-justify border-l-5 border-blue-900 p-3 bg-blue-50"
                 
              >
                There are currently no grade levels available for enrollment. Please contact your registrar or try again later.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grades.map((grade, index) => (
                <Card
                  key={grade.id}
                  className={`group p-6 border-none border-l-5 bg-gray-50 hover:border-blue-900 cursor-pointer ${
                    selectingGrade === grade.id ? 'shadow-lg border-blue-900' : ''
                  }`}
                  style={{
                    backgroundColor: getColorValue(grade.color)
                  }}
                  onClick={() => handleGradeSelect(grade)}
                >
                  <div className="space-y-4 flex flex-col justify-between h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                          <GraduationCap size={20} weight="fill" style={{ color: getColorValue(grade.color) }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-lg font-medium text-white"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            Grade {grade.gradeLevel} {grade.strand}
                          </h3>
                          <p
                            className="text-sm text-white"
                             
                          >
                            {grade.department} Department
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p
                      className="text-xs text-white line-clamp-3"
                       
                    >
                      {grade.description}
                    </p>

                    {/* Action */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs text-white"
                           
                        >
                          Click to select
                        </span>
                        <div className={`w-4 h-4 border-2 border-white transition-colors`}></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {userProfile && currentStep === 'course-selection' && selectedLevel === 'college' && (
        <div className={`space-y-6 transition-all duration-500 ${animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <GraduationCap size={20} className="text-white" weight="bold" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Select Your Course
                  </h2>
                  <p
                    className="text-sm text-gray-600"

                  >
                    Choose the college course you wish to enroll in
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToLevelSelection}

            >
              Back
            </Button>
          </div>

          {loadingCourses ? (
            <Card className="p-12 text-center border-none bg-gray-50 border-l-5 border-blue-900">
              <div className="animate-spin rounded-none h-8 w-8 border-2 border-blue-900/30 border-t-blue-900 mx-auto mb-4"></div>
              <h3
                className="text-lg font-medium text-gray-900 mb-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Loading courses...
              </h3>
              <p
                className="text-gray-600 text-justify border-l-5 border-blue-900 p-3 bg-blue-50"

              >
                Please wait while we load available college courses.
              </p>
            </Card>
          ) : courses.length === 0 ? (
            <Card className="p-12 text-center border-none bg-gray-50 border-l-5 border-blue-900">
              <GraduationCap size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
              <h3
                className="text-lg font-medium text-gray-900 mb-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                No courses available
              </h3>
              <p
                className="text-gray-600 text-justify border-l-5 border-blue-900 p-3 bg-blue-50"

              >
                There are currently no college courses available for enrollment. Please contact your registrar or try again later.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <Card
                  key={`course-${course.id}-${index}`}
                  className={`group p-6 border-none border-l-5 bg-gray-50 hover:border-blue-900 cursor-pointer ${
                    selectedCourse?.id === course.id ? 'shadow-lg border-blue-900' : ''
                  }`}
                  style={{
                    backgroundColor: getColorValue(course.color)
                  }}
                  onClick={() => handleCourseSelect(course)}
                >
                  <div className="space-y-4 flex flex-col justify-between h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                          <GraduationCap size={20} weight="fill" style={{ color: getColorValue(course.color) }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-lg font-medium text-white"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {course.code}
                          </h3>
                          <p
                            className="text-sm text-white"

                          >
                            {course.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p
                      className="text-xs text-white line-clamp-3"

                    >
                      {course.description}
                    </p>

                    {/* Action */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs text-white"

                        >
                          Click to select
                        </span>
                        <div className={`w-4 h-4 border-2 border-white transition-colors`}></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {userProfile && currentStep === 'year-selection' && selectedLevel === 'college' && selectedCourse && (
        <div className={`space-y-6 transition-all duration-500 ${animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <User size={20} className="text-white" weight="bold" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Select Your Year Level
                  </h2>
                  <p
                    className="text-sm text-gray-600"

                  >
                    Choose your current year level in college
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => changeStep('course-selection')}

            >
              Back
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* First Year */}
            <Card
              className={`group p-6 border-none bg-gray-50 hover:border-blue-900 cursor-pointer border-l-5 hover:shadow-lg transition-all duration-300 ${
                selectedYear === 1 ? 'shadow-lg border-blue-900' : ''
              }`}
              style={{
                backgroundColor: selectedYear === 1 ? getColorValue('blue-900') : getColorValue('blue-800')
              }}
              onClick={() => handleYearSelect(1)}
            >
              <div className="space-y-4 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                      <GraduationCap size={20} weight="fill" className={`${selectedYear === 1 ? 'text-blue-900' : 'text-blue-800'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-medium ${selectedYear === 1 ? 'text-white' : 'text-white'}`}
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        First Year
                      </h3>
                      <p
                        className={`text-sm ${selectedYear === 1 ? 'text-white' : 'text-white'}`}

                      >
                        Freshman Level
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-sm ${selectedYear === 1 ? 'text-white' : 'text-white'}`}

                >
                  First year college students beginning their academic journey.
                </p>

                {/* Action */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${selectedYear === 1 ? 'text-white' : 'text-white'}`}

                    >
                      Click to select
                    </span>
                    <div className={`w-4 h-4 border-2 ${selectedYear === 1 ? 'border-white bg-white' : 'border-white'}`}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Second Year */}
            <Card
              className={`group p-6 border-none bg-gray-50 hover:border-blue-900 cursor-pointer border-l-5 hover:shadow-lg transition-all duration-300 ${
                selectedYear === 2 ? 'shadow-lg border-blue-900' : ''
              }`}
              style={{
                backgroundColor: selectedYear === 2 ? getColorValue('blue-900') : getColorValue('blue-800')
              }}
              onClick={() => handleYearSelect(2)}
            >
              <div className="space-y-4 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                      <GraduationCap size={20} weight="fill" className={`${selectedYear === 2 ? 'text-blue-900' : 'text-blue-800'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-medium ${selectedYear === 2 ? 'text-white' : 'text-white'}`}
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Second Year
                      </h3>
                      <p
                        className={`text-sm ${selectedYear === 2 ? 'text-white' : 'text-white'}`}

                      >
                        Sophomore Level
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-sm ${selectedYear === 2 ? 'text-white' : 'text-white'}`}

                >
                  Second year college students continuing their studies.
                </p>

                {/* Action */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${selectedYear === 2 ? 'text-white' : 'text-white'}`}

                    >
                      Click to select
                    </span>
                    <div className={`w-4 h-4 border-2 ${selectedYear === 2 ? 'border-white bg-white' : 'border-white'}`}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Third Year */}
            <Card
              className={`group p-6 border-none bg-gray-50 hover:border-blue-900 cursor-pointer border-l-5 hover:shadow-lg transition-all duration-300 ${
                selectedYear === 3 ? 'shadow-lg border-blue-900' : ''
              }`}
              style={{
                backgroundColor: selectedYear === 3 ? getColorValue('blue-900') : getColorValue('blue-800')
              }}
              onClick={() => handleYearSelect(3)}
            >
              <div className="space-y-4 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                      <GraduationCap size={20} weight="fill" className={`${selectedYear === 3 ? 'text-blue-900' : 'text-blue-800'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-medium ${selectedYear === 3 ? 'text-white' : 'text-white'}`}
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Third Year
                      </h3>
                      <p
                        className={`text-sm ${selectedYear === 3 ? 'text-white' : 'text-white'}`}

                      >
                        Junior Level
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-sm ${selectedYear === 3 ? 'text-white' : 'text-white'}`}

                >
                  Third year college students advancing in their major studies.
                </p>

                {/* Action */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${selectedYear === 3 ? 'text-white' : 'text-white'}`}

                    >
                      Click to select
                    </span>
                    <div className={`w-4 h-4 border-2 ${selectedYear === 3 ? 'border-white bg-white' : 'border-white'}`}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Fourth Year */}
            <Card
              className={`group p-6 border-none bg-gray-50 hover:border-blue-900 cursor-pointer border-l-5 hover:shadow-lg transition-all duration-300 ${
                selectedYear === 4 ? 'shadow-lg border-blue-900' : ''
              }`}
              style={{
                backgroundColor: selectedYear === 4 ? getColorValue('blue-900') : getColorValue('blue-800')
              }}
              onClick={() => handleYearSelect(4)}
            >
              <div className="space-y-4 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                      <GraduationCap size={20} weight="fill" className={`${selectedYear === 4 ? 'text-blue-900' : 'text-blue-800'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-medium ${selectedYear === 4 ? 'text-white' : 'text-white'}`}
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Fourth Year
                      </h3>
                      <p
                        className={`text-sm ${selectedYear === 4 ? 'text-white' : 'text-white'}`}

                      >
                        Senior Level
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-sm ${selectedYear === 4 ? 'text-white' : 'text-white'}`}

                >
                  Fourth year college students completing their degree requirements.
                </p>

                {/* Action */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${selectedYear === 4 ? 'text-white' : 'text-white'}`}

                    >
                      Click to select
                    </span>
                    <div className={`w-4 h-4 border-2 ${selectedYear === 4 ? 'border-white bg-white' : 'border-white'}`}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {userProfile && currentStep === 'semester-selection' && selectedLevel === 'college' && selectedCourse && selectedYear && (
        <div className={`space-y-6 transition-all duration-500 ${animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <Calendar size={20} className="text-white" weight="bold" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Select Your Semester
                  </h2>
                  <p
                    className="text-sm text-gray-600"
                  >
                    Choose the semester you wish to enroll in
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => changeStep('year-selection')}
            >
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Semester */}
            <Card
              className={`group p-6 border-none bg-gray-50 hover:border-blue-900 cursor-pointer border-l-5 hover:shadow-lg transition-all duration-300 ${
                selectedSemester === 'first-sem' ? 'shadow-lg border-blue-900' : ''
              }`}
              style={{
                backgroundColor: selectedSemester === 'first-sem' ? getColorValue('blue-900') : getColorValue('blue-800')
              }}
              onClick={() => handleSemesterSelect('first-sem')}
            >
              <div className="space-y-4 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                      <Calendar size={20} weight="fill" className={`${selectedSemester === 'first-sem' ? 'text-blue-900' : 'text-blue-800'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-medium ${selectedSemester === 'first-sem' ? 'text-white' : 'text-white'}`}
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        First Semester
                      </h3>
                      <p
                        className={`text-sm ${selectedSemester === 'first-sem' ? 'text-white' : 'text-white'}`}
                      >
                        August - December
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-sm ${selectedSemester === 'first-sem' ? 'text-white' : 'text-white'}`}
                >
                  First semester enrollment for the academic year.
                </p>

                {/* Action */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${selectedSemester === 'first-sem' ? 'text-white' : 'text-white'}`}
                    >
                      Click to select
                    </span>
                    <div className={`w-4 h-4 border-2 ${selectedSemester === 'first-sem' ? 'border-white bg-white' : 'border-white'}`}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Second Semester */}
            <Card
              className={`group p-6 border-none bg-gray-50 hover:border-blue-900 cursor-pointer border-l-5 hover:shadow-lg transition-all duration-300 ${
                selectedSemester === 'second-sem' ? 'shadow-lg border-blue-900' : ''
              }`}
              style={{
                backgroundColor: selectedSemester === 'second-sem' ? getColorValue('blue-900') : getColorValue('blue-800')
              }}
              onClick={() => handleSemesterSelect('second-sem')}
            >
              <div className="space-y-4 flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                      <Calendar size={20} weight="fill" className={`${selectedSemester === 'second-sem' ? 'text-blue-900' : 'text-blue-800'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-medium ${selectedSemester === 'second-sem' ? 'text-white' : 'text-white'}`}
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Second Semester
                      </h3>
                      <p
                        className={`text-sm ${selectedSemester === 'second-sem' ? 'text-white' : 'text-white'}`}
                      >
                        January - May
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-sm ${selectedSemester === 'second-sem' ? 'text-white' : 'text-white'}`}
                >
                  Second semester enrollment for the academic year.
                </p>

                {/* Action */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${selectedSemester === 'second-sem' ? 'text-white' : 'text-white'}`}
                    >
                      Click to select
                    </span>
                    <div className={`w-4 h-4 border-2 ${selectedSemester === 'second-sem' ? 'border-white bg-white' : 'border-white'}`}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {userProfile && currentStep === 'personal-info' && (selectedGrade || (selectedCourse && selectedYear && selectedSemester)) && (
        <div className={`space-y-6 transition-all duration-500 ${animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <User size={20} className="text-white" weight="bold" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Personal Information
                  </h2>
                  <p
                    className="text-sm text-gray-600"
                     
                  >
                    Review and update your personal details for enrollment
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedLevel === 'college') {
                  changeStep('semester-selection');
                } else {
                  handleBackToGradeSelection();
                }
              }}
               
            >
              Back
            </Button>
          </div>

          <Card className="p-8 border-none bg-gray-50 border-l-5 border-blue-900">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Name Section */}
              <div>
                <h3
                  className="text-lg font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Full Name
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={personalInfo.firstName}
                      onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                       
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Middle Name <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={personalInfo.middleName}
                      onChange={(e) => handlePersonalInfoChange('middleName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                       
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={personalInfo.lastName}
                      onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                       
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Extension <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={personalInfo.extension}
                      onChange={(e) => handlePersonalInfoChange('extension', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                       
                      placeholder="Jr., Sr., III, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3
                  className="text-lg font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Envelope size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg"
                         
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        onKeyDown={handlePhoneNumberKeyDown}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg"
                         
                        placeholder="+63 962 781 1434"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h3
                  className="text-lg font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Date of Birth <span className="text-red-500">*</span>

                    </label>
                    <div className="grid grid-cols-4 gap-2 items-end">
                      <div>
                        <select
                          value={personalInfo.birthMonth || ''}
                          onChange={(e) => handlePersonalInfoChange('birthMonth', e.target.value)}
                          className="w-full px-3 py-2 h-10 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "

                        >
                          <option value="">Month</option>
                          <option value="01">January</option>
                          <option value="02">February</option>
                          <option value="03">March</option>
                          <option value="04">April</option>
                          <option value="05">May</option>
                          <option value="06">June</option>
                          <option value="07">July</option>
                          <option value="08">August</option>
                          <option value="09">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                      </div>
                      <div className="relative">
                        <select
                          value={personalInfo.birthDay || ''}
                          onChange={(e) => handlePersonalInfoChange('birthDay', e.target.value)}
                          className="w-full px-4 py-2 h-10 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                           
                        >
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day.toString().padStart(2, '0')}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="relative">
                        <select
                          value={personalInfo.birthYear || ''}
                          onChange={(e) => handlePersonalInfoChange('birthYear', e.target.value)}
                          className="w-full px-4 py-2 h-10 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                           
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year.toString()}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center min-h-[40px]">
                        {calculatedAge !== null ? (
                          <div className="px-3 py-2 bg-white border border-gray-300 text-sm font-light text-gray-700 text-center min-w-[60px]">
                            {calculatedAge} Years Old
                          </div>
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-400 text-center min-w-[60px]">
                            Age
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Place of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={personalInfo.placeOfBirth}
                      onChange={(e) => handlePersonalInfoChange('placeOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                       
                      placeholder="Enter place of birth"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={personalInfo.gender}
                      onChange={(e) => handlePersonalInfoChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                       
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Civil Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={personalInfo.civilStatus}
                      onChange={(e) => handlePersonalInfoChange('civilStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                       
                    >
                      <option value="">Select Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div className="relative">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Citizenship <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IdentificationCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={personalInfo.citizenship}
                        onChange={(e) => handlePersonalInfoChange('citizenship', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg"
                         
                        placeholder="Enter citizenship"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Religion <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Heart size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={personalInfo.religion}
                        onChange={(e) => handlePersonalInfoChange('religion', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg"
                         
                        placeholder="Enter religion"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={handleProceedToConfirmation}
                  className="bg-blue-900 hover:bg-blue-900 transition-all duration-300  hover:shadow-lg"
                   
                >
                  Proceed to Confirmation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}



      {userProfile && currentStep === 'confirmation' && (selectedGrade || selectedCourse) && (
        <div className={`space-y-6 transition-all duration-500 ${animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <Check size={20} className="text-white" weight="bold" />
                </div>
                <div>
                  <h2
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Confirm Your Enrollment
                  </h2>
                  <p
                    className="text-sm text-gray-600"
                     
                  >
                    Review all information and submit your enrollment
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToPersonalInfo}
               
            >
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Personal Information */}
            <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
            <div className="space-y-6">
                <div>
                  <h4
                    className="text-lg font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                    Personal Information
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          Full Name
                        </label>
                        <p className="text-sm text-gray-900 mt-1 font-mono"  >
                          {personalInfo.firstName} {personalInfo.middleName} {personalInfo.lastName} {personalInfo.extension}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          Email Address
                        </label>
                          <p className="text-sm text-gray-900 mt-1 font-mono"  >
                            {personalInfo.email || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Phone Number
                          </label>
                          <p className="text-sm text-gray-900 mt-1 font-mono"  >
                            {personalInfo.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Date of Birth
                          </label>
                          <p className="text-sm text-gray-900 mt-1 font-mono"  >
                            {personalInfo.birthMonth && personalInfo.birthDay && personalInfo.birthYear
                                ? `${personalInfo.birthMonth}/${personalInfo.birthDay}/${personalInfo.birthYear}`
                              : 'Not provided'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Place of Birth
                          </label>
                          <p className="text-sm text-gray-900 mt-1 font-mono"  >
                            {personalInfo.placeOfBirth || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Gender
                          </label>
                          <p className="text-sm text-gray-900 mt-1 font-mono"  >
                            {personalInfo.gender || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Civil Status
                          </label>
                          <p className="text-sm text-gray-900 mt-1 font-mono"  >
                            {personalInfo.civilStatus || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Citizenship
                          </label>
                          <p className="text-sm text-gray-900 mt-1 font-mono"  >
                            {personalInfo.citizenship || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Religion
                          </label>
                          <p className="text-sm text-gray-900 mt-1 font-mono  "  >
                            {personalInfo.religion || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4
                  className="text-lg font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Enrollment Details
                </h4>
                  
                  {/* Selected Grade/Course Card */}
                  <div className="mb-4">
                    <div
                      className="p-4 border border-gray-200 bg-white shadow-inner"
                      style={{
                        backgroundColor: selectedLevel === 'high-school' && selectedGrade
                          ? getColorValue(selectedGrade.color)
                          : selectedLevel === 'college' && selectedCourse
                          ? getColorValue(selectedCourse.color)
                          : '#1e40af'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <GraduationCap size={16} weight="fill" style={{
                            color: selectedLevel === 'high-school' && selectedGrade
                              ? getColorValue(selectedGrade.color)
                              : selectedLevel === 'college' && selectedCourse
                              ? getColorValue(selectedCourse.color)
                              : '#1e40af'
                          }} />
                  </div>
                        <div className="flex-1">
                          {selectedLevel === 'high-school' && selectedGrade && (
                            <>
                          <h5 className="font-medium text-white text-sm" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Grade {selectedGrade.gradeLevel} {selectedGrade.strand}
                          </h5>
                          <p className="text-xs text-white"  >
                            {selectedGrade.department} Department
                          </p>
                            </>
                          )}
                          {selectedLevel === 'college' && selectedCourse && selectedYear && selectedSemester && (
                            <>
                              <h5 className="font-medium text-white text-sm" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                                {selectedCourse.code} {selectedYear} {selectedSemester === 'first-sem' ? 'Q1' : 'Q2'}
                              </h5>
                              <p className="text-xs text-white"  >
                                {selectedCourse.name}
                              </p>
                            </>
                          )}
                  </div>
                        <div className="flex items-center space-x-2">
                          <Check size={14} className="text-white" weight="bold" />
                          <span className="text-xs text-white"  >
                            Selected
                    </span>
                  </div>
                  </div>
                  </div>
                  </div>

                  <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600"  >
                      Enrollment Date:
                    </span>
                    <span className="text-sm text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600"  >
                        Academic Year:
                      </span>
                      <span className="text-sm text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        {new Date().getFullYear()} - {new Date().getFullYear() + 1}
                      </span>
                </div>
              </div>
                </div>
              </div>
            </Card>

            {/* Right Column - Documents Info */}
            <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
              <div className="space-y-6">
                <h4
                  className="text-lg font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Document Management
                </h4>
                
                <div className="space-y-4">
                  {/* Documents Status */}
                  <div className={`p-4 border ${
                  documentsStatus?.isComplete
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`font-medium text-sm text-gray-900`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        Required Documents Status
                      </h5>
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 ${
                        documentsStatus?.isComplete
                          ? 'bg-blue-900 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {documentsStatus?.isComplete ? (
                          <Check size={12} />
                        ) : (
                          <Warning size={12} />
                        )}
                        <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {documentsStatus?.uploaded || 0}/{documentsStatus?.required || 4}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs text-gray-600`}  >
                      {documentsStatus?.isComplete
                        ? 'All required documents have been uploaded. You can proceed with enrollment.'
                        : `You need to upload ${documentsStatus?.required || 4 - (documentsStatus?.uploaded || 0)} more required document(s) before submitting your enrollment.`
                      }
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4">
                      <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-900 flex items-center justify-center">
                        <FileText size={16} className="text-white" weight="bold" />
                        </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Documents Managed Separately
                          </h5>
                        <p className="text-xs text-gray-600 mb-3"  >
                          Your academic documents are now managed in the Documents section of your dashboard. You can upload and manage all your documents once and reuse them across multiple enrollments.
                        </p>
                        {!documentsStatus?.isComplete && (
                          <div className="mb-3 p-2 bg-gray-100 border border-gray-200 rounded text-xs text-gray-700"  >
                            <strong>⚠️ Required:</strong> Report Card, Certificate of Good Moral, Birth Certificate, and ID Picture must be uploaded before enrollment.
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                           
                          onClick={() => {
                            // This would navigate to documents section, but since we're in a modal, we'll just show info
                            toast.info('Navigate to the Documents section in your dashboard sidebar to manage your documents.');
                          }}
                        >
                          <FileText size={14} className="mr-1" />
                          Manage Documents
                        </Button>
                      </div>
                        </div>
                        </div>

                  <div className="text-xs text-gray-600 bg-gray-100 p-3"  >
                    <strong>Note:</strong> Make sure you have uploaded all required documents in the Documents section before submitting your enrollment. Your documents will be automatically referenced during the enrollment process.
                        </div>
                </div>
              </div>
            </Card>
              </div>

          {/* Agreement and Submit Section */}
          <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
            <div className="space-y-4">
     

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={handleBackToGradeSelection}
                  disabled={enrolling}
                   
                >
                  Back
                </Button>
                <Button
                  onClick={handleOpenSubmitModal}
                  disabled={enrolling}
                  className={`bg-blue-900 hover:bg-blue-900 transition-all duration-300  hover:shadow-lg transform ${
                    enrolling ? 'animate-pulse scale-110' : ''
                  }`}
                   
                >
                  {enrolling ? (
                    <>
                      <div className="animate-spin rounded-none h-4 w-4 border-b-2 border-white mr-2 inline-block animate-pulse"></div>
                      <span className="animate-pulse">
'Submitting...'
                      </span>
                    </>
                  ) : (
                    <>
                      <Check size={16} className="mr-2 transition-transform duration-200 hover:rotate-12" />
                      Submit Enrollment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}


      {/* Irregular Student Modal */}
      <Modal
        isOpen={showIrregularModal}
        onClose={cancelIrregularStudent}
        title="Irregular Student Enrollment"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
              <Warning size={24} className="text-gray-600" weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Irregular Student Enrollment
              </h3>
              <p className="text-xs text-gray-600"  >
                Confirmation required
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              You have selected Grade {selectedGrade?.gradeLevel}
            </h4>
            <p className="text-sm text-gray-700"  >
              You have selected a grade level that is not a typical starting point. Does this mean you are enrolling as a transferee student rather than beginning at the entry level? If so, you will be classified as an irregular student.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              What does this mean?
            </h4>
            <ul className="text-sm text-gray-700 space-y-1"  >
              <li>• You will be classified as an <strong>irregular student</strong></li>
              <li>• This indicates you are transferring from another school or institution</li>
              <li>• Your enrollment will be processed accordingly</li>
              <li>• You may need to provide additional documentation</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={cancelIrregularStudent}
              variant="outline"
              className="flex-1"
               
            >
              Cancel Selection
            </Button>
            <Button
              onClick={confirmIrregularStudent}
              className="flex-1 bg-blue-900 hover:bg-blue-900 text-white border-blue-900"
               
            >
              Yes, I'm a Transferee
            </Button>
          </div>
        </div>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={handleCloseSubmitModal}
        title="Final Confirmation"
        size="sm"
      >
        <div className="p-6 text-center">
        
          
          {/* Warning Message */}
          <p className="text-gray-600 mb-6"  >
            Are you sure all the information you provided is correct? This action cannot be undone.
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleCloseSubmitModal}
              variant="outline"
              className="flex-1"
              disabled={enrolling}
               
            >
Cancel
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={enrolling || countdown > 0}
              className={`flex-1 ${
                enrolling || countdown > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-900'
              }`}
               
            >
{countdown > 0 ? `Confirm & Submit (${countdown})` : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

