'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { initializeApp } from 'firebase/app';
import { GraduationCap, BookOpen, Check, Warning, Calendar, IdentificationCard, Heart, User, Envelope, Phone, MapPin, Users, UserCircle, File, FileText, X, ArrowRight, ArrowLeft, Medal, Certificate } from '@phosphor-icons/react';
import { GradeData } from '@/lib/grade-section-database';

interface EnrollmentFormProps {
  userId: string;
  userProfile: any;
}

export default function EnrollmentForm({ userId, userProfile }: EnrollmentFormProps) {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<GradeData | null>(null);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [currentStep, setCurrentStep] = useState<'compliance' | 'grade-selection' | 'personal-info' | 'confirmation'>('compliance');
  const [animatingStep, setAnimatingStep] = useState(false);
  const [selectingGrade, setSelectingGrade] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [showDataPreserved, setShowDataPreserved] = useState(false);

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
  }, []);

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

  const handleComplianceCheck = () => {
    setComplianceChecked(!complianceChecked);
  };

  const changeStep = (newStep: 'compliance' | 'grade-selection' | 'personal-info' | 'confirmation') => {
    setAnimatingStep(true);
    setTimeout(() => {
      setCurrentStep(newStep);
      setAnimatingStep(false);
    }, 300);
  };

  // Helper function to check if personal info is completed
  const isPersonalInfoCompleted = () => {
    return selectedGrade !== null && 
           personalInfo.firstName?.trim() && 
           personalInfo.lastName?.trim() && 
           personalInfo.email?.trim() && 
           personalInfo.phone?.trim() &&
           personalInfo.gender && 
           personalInfo.civilStatus;
  };


  const handleProgressStepClick = (step: 'compliance' | 'grade-selection' | 'personal-info' | 'confirmation') => {
    const stepOrder = ['compliance', 'grade-selection', 'personal-info', 'confirmation'];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const targetStepIndex = stepOrder.indexOf(step);
    
    // Check if the target step has been completed
    const isStepCompleted = (targetStep: string) => {
      switch (targetStep) {
        case 'compliance':
          return complianceChecked;
        case 'grade-selection':
          return selectedGrade !== null;
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
    try {
      setEnrolling(true);

      // Submit enrollment without documents (they'll be referenced from the Documents section)
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          gradeId: selectedGrade?.id,
          gradeLevel: selectedGrade?.gradeLevel,
          department: selectedGrade?.department,
          personalInfo,
          documents: {} // Empty documents object - documents will be referenced separately
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit enrollment');
      }

      // Close modal
      setSubmitModalOpen(false);
      setCountdown(5);

      toast.success('Enrollment submitted successfully!');

      // Reset form after successful submission
      setSelectedGrade(null);
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

  const handleProceedToGradeSelection = () => {
    if (!complianceChecked) {
      toast.error('Please check the compliance box to proceed');
      return;
    }
    changeStep('grade-selection');
  };

  const handleGradeSelect = (grade: GradeData) => {
    setSelectingGrade(grade.id);
    // Add a delay to show the selection animation
    setTimeout(() => {
      setSelectedGrade(grade);
      setSelectingGrade(null);
      changeStep('personal-info');
    }, 600);
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

 

   const handleBackToGradeSelection = () => {
    setSelectedGrade(null);
    changeStep('grade-selection');
  };

  const handleBackToPersonalInfo = () => {
    changeStep('personal-info');
  };


  const handleBackToCompliance = () => {
    setSelectedGrade(null);
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit enrollment');
      }

      toast.success('Enrollment submitted successfully! You will be notified once it\'s processed.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
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

  return (
    <div className="space-y-6">
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
            Student Enrollment
          </h1>
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Select your grade level and complete your enrollment process
          </p>
        </div>
      </div>

       
      </div>

      {/* Data Preserved Notification */}
      {showDataPreserved && (
        <div className="bg-green-50 border border-green-200 p-3 mb-4">
          <div className="flex items-center space-x-2">
            <Check size={16} className="text-green-600" weight="bold" />
            <p className="text-sm text-green-800" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              Your information has been saved. You can safely navigate between steps to review and edit your details.
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Progress Indicator */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm">
        <div className="relative">
          {/* Progress Steps Container */}
          <div className="flex justify-between items-start relative">
            {/* Progress Line Background - positioned behind circles */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 z-0"></div>
            
            {/* Animated Progress Line - positioned behind circles */}
            <div 
              className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-blue-600 to-blue-800 transition-all duration-1000 ease-out z-10"
              style={{
                width: currentStep === 'compliance' ? '0%' :
                       currentStep === 'grade-selection' ? '33%' :
                       currentStep === 'personal-info' ? '66%' :
                       currentStep === 'confirmation' ? 'calc(100% - 48px)' : '0%'
              }}
            ></div>
            {/* Step 1: Compliance */}
            <div 
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'compliance' ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick('compliance')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full ${
                currentStep === 'compliance' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                complianceChecked ? 'bg-blue-800 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <Check size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {currentStep === 'compliance' && (
                  <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                currentStep === 'compliance' ? 'text-blue-900 font-semibold' :
                complianceChecked ? 'text-blue-800' : 'text-gray-400 group-hover:text-gray-600'
              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Compliance
            </span>
          </div>

            {/* Step 2: Grade Selection */}
            <div 
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'grade-selection' ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick('grade-selection')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full ${
                currentStep === 'grade-selection' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                selectedGrade !== null ? 'bg-blue-800 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <GraduationCap size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {currentStep === 'grade-selection' && (
                  <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                currentStep === 'grade-selection' ? 'text-blue-900 font-semibold' :
                selectedGrade !== null ? 'text-blue-800' : 'text-gray-400 group-hover:text-gray-600'
              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Grade Selection
            </span>
          </div>

            {/* Step 3: Personal Info */}
            <div 
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'personal-info' ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick('personal-info')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full ${
                currentStep === 'personal-info' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                isPersonalInfoCompleted() ? 'bg-blue-800 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <User size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {currentStep === 'personal-info' && (
                  <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                currentStep === 'personal-info' ? 'text-blue-900 font-semibold' :
                isPersonalInfoCompleted() ? 'text-blue-800' : 'text-gray-400 group-hover:text-gray-600'
              }`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Personal Info
            </span>
          </div>

            {/* Step 4: Confirmation */}
            <div 
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'confirmation' ? 'scale-110' : 'hover:scale-105'
              }`}
              onClick={() => handleProgressStepClick('confirmation')}
            >
              <div className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full ${
                currentStep === 'confirmation' ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30' :
                isPersonalInfoCompleted() ? 'bg-blue-800 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}>
                <Check size={18} weight="bold" className="transition-all duration-300" />
                {/* Pulse animation for current step */}
                {currentStep === 'confirmation' && (
                  <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
                )}
            </div>
              <span className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                currentStep === 'confirmation' ? 'text-blue-900 font-semibold' :
                isPersonalInfoCompleted() ? 'text-blue-800' : 'text-gray-400 group-hover:text-gray-600'
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
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900 mx-auto"></div>
            <p className="text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
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
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  I acknowledge and agree to comply with all school policies and requirements
                </label>
              </div>
            </div>

            <div className="space-y-4">
             
            </div>

            <Button
              onClick={handleProceedToGradeSelection}
              disabled={!complianceChecked}
              className={`bg-blue-900 hover:bg-blue-800 transition-all duration-300 hover:shadow-lg ${!complianceChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Proceed to Grade Selection
            </Button>
          </div>
        </Card>
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
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Choose the grade level you wish to enroll in
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToCompliance}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {grade.department} Department
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p
                      className="text-xs text-white line-clamp-3"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {grade.description}
                    </p>

                    {/* Action */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs text-white"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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

      {userProfile && currentStep === 'personal-info' && selectedGrade && (
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
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Review and update your personal details for enrollment
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToGradeSelection}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                      <div className="relative">
                        <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" weight="duotone" />
                        <select
                          value={personalInfo.birthMonth || ''}
                          onChange={(e) => handlePersonalInfoChange('birthMonth', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 h-10 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        placeholder="Enter religion"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={handleProceedToConfirmation}
                  className="bg-blue-900 hover:bg-blue-800 transition-all duration-300  hover:shadow-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Proceed to Confirmation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}



      {userProfile && currentStep === 'confirmation' && selectedGrade && (
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
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Review all information and submit your enrollment
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleBackToPersonalInfo}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                        <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          {personalInfo.firstName} {personalInfo.middleName} {personalInfo.lastName} {personalInfo.extension}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          Email Address
                        </label>
                          <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {personalInfo.email || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Phone Number
                          </label>
                          <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {personalInfo.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Date of Birth
                          </label>
                          <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {personalInfo.birthMonth && personalInfo.birthDay && personalInfo.birthYear
                              ? `${personalInfo.birthMonth}/${personalInfo.birthDay}/${personalInfo.birthYear}${calculatedAge ? ` (Age: ${calculatedAge} Years Old)` : ''}`
                              : 'Not provided'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Place of Birth
                          </label>
                          <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {personalInfo.placeOfBirth || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Gender
                          </label>
                          <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {personalInfo.gender || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Civil Status
                          </label>
                          <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {personalInfo.civilStatus || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Citizenship
                          </label>
                          <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {personalInfo.citizenship || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Religion
                          </label>
                          <p className="text-sm text-gray-900 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
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
                  
                  {/* Selected Grade Card */}
                  <div className="mb-4">
                    <div
                      className="p-4 border border-gray-200 bg-white shadow-inner"
                      style={{
                        backgroundColor: getColorValue(selectedGrade.color)
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <GraduationCap size={16} weight="fill" style={{ color: getColorValue(selectedGrade.color) }} />
                  </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-white text-sm" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Grade {selectedGrade.gradeLevel} {selectedGrade.strand}
                          </h5>
                          <p className="text-xs text-white" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            {selectedGrade.department} Department
                          </p>
                  </div>
                        <div className="flex items-center space-x-2">
                          <Check size={14} className="text-white" weight="bold" />
                          <span className="text-xs text-white" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                            Selected
                    </span>
                  </div>
                  </div>
                  </div>
                  </div>

                  <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
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
                      <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
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
                  <div className="bg-blue-50 border border-blue-200 p-4">
                      <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 flex items-center justify-center">
                        <FileText size={16} className="text-white" weight="bold" />
                        </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-blue-900 text-sm mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Documents Managed Separately
                          </h5>
                        <p className="text-xs text-blue-700 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          Your academic documents are now managed in the Documents section of your dashboard. You can upload and manage all your documents once and reuse them across multiple enrollments.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-700 hover:bg-blue-100"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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

                  <div className="text-xs text-gray-600 bg-gray-100 p-3" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
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
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleOpenSubmitModal}
                  disabled={enrolling}
                  className={`bg-blue-900 hover:bg-blue-800 transition-all duration-300  hover:shadow-lg transform ${
                    enrolling ? 'animate-pulse scale-110' : ''
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {enrolling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block animate-pulse"></div>
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


      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={handleCloseSubmitModal}
        title="Final Confirmation"
        size="sm"
      >
        <div className="p-6 text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <Warning size={32} className="text-blue-600" weight="bold" />
          </div>
          
          {/* Warning Message */}
          <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Are you sure all the information you provided is correct? This action cannot be undone.
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleCloseSubmitModal}
              variant="outline"
              className="flex-1"
              disabled={enrolling}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
Cancel
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={enrolling || countdown > 0}
              className={`flex-1 ${
                enrolling || countdown > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-800'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
{countdown > 0 ? `Confirm & Submit (${countdown})` : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Helper function to get color value
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-800': '#1e40af',
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
