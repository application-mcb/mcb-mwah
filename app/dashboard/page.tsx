"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ProfileForm } from "@/components/profile-form";
import EnrollmentForm from "@/components/enrollment-form";
import DocumentsManager from "@/components/documents-manager";
import MySubjectsView from "../../components/my-subjects-view";
import AcademicRecords from "@/components/academic-records";
import AccountSetupProgress from "@/components/account-setup-progress";
import {
  User,
  Calendar,
  BookOpen,
  GraduationCap,
  Gear,
  Bell,
  SignOut,
  House,
  Phone,
  MapPin,
  Shield,
  IdentificationCard,
  Pencil,
  ChartBar,
  FileText
} from "@phosphor-icons/react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { UserProfile } from "@/lib/user-sync";
import { getProfileAction } from "@/app/actions/profile";

type ViewType = 'dashboard' | 'enrollment' | 'documents' | 'subjects' | 'schedule' | 'performance' | 'records';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { onAuthStateChanged } = await import("firebase/auth");
        
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUser(user);
            
            // Get user profile from database through server action
            try {
              const profileResult = await getProfileAction({ uid: user.uid });
              const profile = profileResult.success ? profileResult.user : null;
              if (profile && profile.firstName && profile.lastName) {
                setUserProfile(profile);
              } else {
                console.log('No complete profile found, redirecting to setup');
                router.push('/setup');
                return;
              }
            } catch (error) {
              console.log('Error getting profile, redirecting to setup:', error);
              router.push('/setup');
              return;
            }

            // Fetch enrollment data and sections after profile is loaded
            try {
              const enrollmentResponse = await fetch(`/api/enrollment?userId=${user.uid}`);
              const enrollmentResult = await enrollmentResponse.json();

              // Handle 404 (no enrollment found) as valid case
              if (enrollmentResponse.status === 404) {
                console.log('No enrollment found, student may not be enrolled yet');
                setEnrollmentData(null);
              } else if (enrollmentResponse.ok && enrollmentResult.success) {
                setEnrollmentData(enrollmentResult.data);
              } else {
                console.log('Error fetching enrollment data');
                setEnrollmentData(null);
              }
            } catch (error) {
              console.log('Error fetching enrollment data:', error);
              setEnrollmentData(null);
            }

            // Fetch sections data
            try {
              const sectionsResponse = await fetch('/api/sections');
              const sectionsResult = await sectionsResponse.json();

              if (sectionsResponse.ok && sectionsResult.sections) {
                setSections(sectionsResult.sections);
              } else {
                console.log('No sections data found');
                setSections([]);
              }
            } catch (error) {
              console.log('Error fetching sections data:', error);
              setSections([]);
            }

            // Fetch grades data
            try {
              const gradesResponse = await fetch('/api/grades');
              const gradesResult = await gradesResponse.json();

              if (gradesResponse.ok && gradesResult.grades) {
                setGrades(gradesResult.grades);
              } else {
                console.log('No grades data found');
                setGrades([]);
              }
            } catch (error) {
              console.log('Error fetching grades data:', error);
              setGrades([]);
            }

            // Fetch documents data
            try {
              const documentsResponse = await fetch(`/api/documents?userId=${user.uid}`);
              const documentsResult = await documentsResponse.json();

              if (documentsResponse.ok && documentsResult.success) {
                setDocuments(documentsResult.documents || []);
              } else {
                console.log('No documents data found');
                setDocuments([]);
              }
            } catch (error) {
              console.log('Error fetching documents data:', error);
              setDocuments([]);
            }

          } else {
            router.push('/');
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    // Refresh user profile data through server action
    if (user) {
      try {
        const profileResult = await getProfileAction({ uid: user.uid });
        const profile = profileResult.success ? profileResult.user : null;
        if (profile) {
          setUserProfile(profile);
        }

        // Also refresh enrollment data
        try {
          const enrollmentResponse = await fetch(`/api/enrollment?userId=${user.uid}`);
          const enrollmentResult = await enrollmentResponse.json();

          // Handle 404 (no enrollment found) as valid case
          if (enrollmentResponse.status === 404) {
            setEnrollmentData(null);
          } else if (enrollmentResponse.ok && enrollmentResult.success) {
            setEnrollmentData(enrollmentResult.data);
          } else {
            setEnrollmentData(null);
          }
        } catch (error) {
          console.error('Error refreshing enrollment data:', error);
          setEnrollmentData(null);
        }

        // Also refresh sections data
        try {
          const sectionsResponse = await fetch('/api/sections');
          const sectionsResult = await sectionsResponse.json();

          if (sectionsResponse.ok && sectionsResult.sections) {
            setSections(sectionsResult.sections);
          } else {
            setSections([]);
          }
        } catch (error) {
          console.error('Error refreshing sections data:', error);
          setSections([]);
        }

        // Also refresh grades data
        try {
          const gradesResponse = await fetch('/api/grades');
          const gradesResult = await gradesResponse.json();

          if (gradesResponse.ok && gradesResult.grades) {
            setGrades(gradesResult.grades);
          } else {
            setGrades([]);
          }
        } catch (error) {
          console.error('Error refreshing grades data:', error);
          setGrades([]);
        }

        // Also refresh documents data
        try {
          const documentsResponse = await fetch(`/api/documents?userId=${user.uid}`);
          const documentsResult = await documentsResponse.json();

          if (documentsResponse.ok && documentsResult.success) {
            setDocuments(documentsResult.documents || []);
          } else {
            setDocuments([]);
          }
        } catch (error) {
          console.error('Error refreshing documents data:', error);
          setDocuments([]);
        }

      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
    setIsEditModalOpen(false);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
  };

  const handleProgressUpdate = async () => {
    // Refresh enrollment data
    try {
      const enrollmentResponse = await fetch(`/api/enrollment?userId=${user.uid}`);
      const enrollmentResult = await enrollmentResponse.json();

      // Handle 404 (no enrollment found) as valid case
      if (enrollmentResponse.status === 404) {
        setEnrollmentData(null);
      } else if (enrollmentResponse.ok && enrollmentResult.success) {
        setEnrollmentData(enrollmentResult.data);
      } else {
        setEnrollmentData(null);
      }
    } catch (error) {
      console.error('Error refreshing enrollment data:', error);
      setEnrollmentData(null);
    }

    // Refresh documents data
    try {
      const documentsResponse = await fetch(`/api/documents?userId=${user.uid}`);
      const documentsResult = await documentsResponse.json();

      if (documentsResponse.ok && documentsResult.success) {
        setDocuments(documentsResult.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error refreshing documents data:', error);
      setDocuments([]);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'Not provided';
    return phone.startsWith('+63') ? phone : `+63${phone}`;
  };

  const getFullName = () => {
    if (!userProfile) return 'Student';
    const { firstName, middleName, lastName, nameExtension } = userProfile;
    let fullName = firstName || '';
    
    if (middleName) {
      // Add middle name initial (first letter only)
      fullName += ` ${middleName.charAt(0).toUpperCase()}.`;
    }
    
    if (lastName) {
      fullName += ` ${lastName}`;
    }
    
    if (nameExtension) {
      fullName += ` ${nameExtension}`;
    }
    
    return fullName || 'Student';
  };

  const getAddress = () => {
    if (!userProfile) return 'Not provided';
    const { streetName, province, municipality, barangay, zipCode } = userProfile;
    const parts = [streetName, municipality, province, zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  const getSectionDisplay = (sectionId: string) => {
    if (!sectionId) return 'Not Assigned';

    const section = sections.find(s => s.id === sectionId);
    if (!section) return sectionId;

    // Find the grade information for this section
    const grade = grades.find(g => g.id === section.gradeId);
    if (!grade) return section.sectionName;

    return {
      sectionName: section.sectionName,
      gradeLevel: grade.gradeLevel,
      gradeColor: grade.color
    };
  };

  const getGradeColor = (color: string): string => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Please sign in to access your dashboard.</p>
            <Button 
              onClick={() => router.push('/')}
              className="mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Account Setup Progress Bar */}
      {user && (
        <AccountSetupProgress
          userId={user.uid}
          userProfile={userProfile}
          documents={documents}
        />
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-80 bg-white/50 shadow-lg flex flex-col animate-in slide-in-from-left-4 duration-500">
        {/* Sidebar Header */}
        <div className="p-6 border-blue-100">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center mb-2">
              <img 
                src="/logo.png" 
                alt="Marian College Logo" 
                className="w-12 h-12 object-contain aspect-square"
              />
              <div className="flex flex-col ml-2">
              <h1 className="text-xl font-light text-gray-900 text-left">Student Portal</h1>
              <p className="text-xs text-gray-600 font-bold uppercase font-mono ">Marian College of Baliuag, Inc.</p>
            </div>
            </div>
            
          </div>
        </div>

        {/* Student Profile Section */}
        <div className="p-6 border-gray-200 bg-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center" >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full aspect-square border-2 border-black"
                />
              ) : (
                <User size={32} className="text-blue-900" weight="duotone" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {userProfile ? getFullName() : user.displayName || user.email?.split('@')[0] || 'Student'}
              </h3>
              <div className="text-xs text-gray-900 font-mono font-medium">
                {(() => {
                  const sectionDisplay = getSectionDisplay(enrollmentData?.enrollmentInfo?.sectionId);
                  if (typeof sectionDisplay === 'string') {
                    return <span>Section: {sectionDisplay}</span>;
                  }
                  return (
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 mr-2 flex-shrink-0"
                        style={{ backgroundColor: getGradeColor(sectionDisplay.gradeColor) }}
                      ></div>
                      <span>{sectionDisplay.gradeLevel} - {sectionDisplay.sectionName}</span>
                    </div>
                  );
                })()}
              </div>
              <p className="text-xs text-gray-900 font-mono font-medium">ID: {enrollmentData?.enrollmentInfo?.studentId || 'Not Enrolled'}</p>
            </div>

            
          </div>
          <Button 
              variant="ghost"
              className="border-1 border-blue-900 rounded-none w-full text-white bg-blue-900"
              onClick={userProfile ? handleEditProfile : () => router.push('/setup')}
            >
              <Gear size={20} weight="fill" className="mr-1 transition-transform duration-200 hover:text-blue-900" />
              {userProfile ? 'Edit Profile' : 'Complete Profile'}
            </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">

            <h4 className="text-sm font-medium text-blue-900 tracking-wider mb-[-2]">Hey {userProfile?.firstName}!</h4>
            <h4 className="text-sm font-light text-blue-900 tracking-wider mb-4">What would you like to do?</h4>
            
            <Button 
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${currentView === 'dashboard' ? 'bg-blue-50 border-blue-900' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
                <div className="flex items-center justify-center bg-blue-900 aspect-square  w-6 h-6 " >
              <User className="text-white" weight="fill" />
            </div>
           
              Dashboard
            </Button>

            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${currentView === 'enrollment' ? 'bg-blue-50 border-blue-900' : ''}`}
              onClick={() => setCurrentView('enrollment')}
            >
                <div className="flex items-center justify-center bg-blue-900 aspect-square  w-6 h-6 " >
              <GraduationCap className="text-white" weight="fill" />
            </div>

              Enrollment
            </Button>

            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${currentView === 'documents' ? 'bg-blue-50 border-blue-900' : ''}`}
              onClick={() => setCurrentView('documents')}
            >
                <div className="flex items-center justify-center bg-blue-900 aspect-square  w-6 h-6 " >
              <FileText className="text-white" weight="fill" />
            </div>

              Documents
            </Button>


            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 ${
                !enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled'
                  ? 'opacity-50 text-red-800 hover:bg-red-50 hover:text-red-900 border-red-800 cursor-not-allowed relative group'
                  : 'hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900'
              } border-l-5 ${currentView === 'subjects' ? (!enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled' ? 'bg-red-50 border-red-800' : 'bg-blue-50 border-blue-900') : ''}`}
              onClick={() => {
                if (!enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled') {
                  // Show enrollment required message
                  toast.info('You need to enroll first to access this feature.', {
                    autoClose: 3000,
                    position: 'top-right'
                  });
                  return;
                }
                setCurrentView('subjects');
              }}
            >
                <div className={`flex items-center justify-center aspect-square w-6 h-6 ${
                  !enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled'
                    ? 'bg-red-800'
                    : 'bg-blue-900'
                }`}>
              <BookOpen className="text-white" weight="fill" />
            </div>

              My Subjects
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 ${
                !enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled'
                  ? 'opacity-50 text-red-800 hover:bg-red-50 hover:text-red-900 border-red-800 cursor-not-allowed relative group'
                  : 'hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900'
              } border-l-5 ${currentView === 'schedule' ? (!enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled' ? 'bg-red-50 border-red-800' : 'bg-blue-50 border-blue-900') : ''}`}
              onClick={() => {
                if (!enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled') {
                  // Show enrollment required message
                  toast.info('You need to enroll first to access this feature.', {
                    autoClose: 3000,
                    position: 'top-right'
                  });
                  return;
                }
                setCurrentView('schedule');
              }}
            >
              <div className={`flex items-center justify-center aspect-square w-6 h-6 ${
                !enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled'
                  ? 'bg-red-800'
                  : 'bg-blue-900'
              }`}>
              <Calendar className="text-white" weight="fill" />
            </div>

              Schedule
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 ${
                !enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled'
                  ? 'opacity-50 text-red-800 hover:bg-red-50 hover:text-red-900 border-red-800 cursor-not-allowed relative group'
                  : 'hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900'
              } border-l-5 ${currentView === 'performance' ? (!enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled' ? 'bg-red-50 border-red-800' : 'bg-blue-50 border-blue-900') : ''}`}
              onClick={() => {
                if (!enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled') {
                  // Show enrollment required message
                  toast.info('You need to enroll first to access this feature.', {
                    autoClose: 3000,
                    position: 'top-right'
                  });
                  return;
                }
                setCurrentView('performance');
              }}
            >
              <div className={`flex items-center justify-center aspect-square w-6 h-6 ${
                !enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled'
                  ? 'bg-red-800'
                  : 'bg-blue-900'
              }`}>
              <ChartBar className="text-white" weight="fill" />
            </div>

              Performance
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 ${
                !enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled'
                  ? 'opacity-50 text-red-800 hover:bg-red-50 hover:text-red-900 border-red-800 cursor-not-allowed relative group'
                  : 'hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900'
              } border-l-5 ${currentView === 'records' ? (!enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled' ? 'bg-red-50 border-red-800' : 'bg-blue-50 border-blue-900') : ''}`}
              onClick={() => {
                if (!enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled') {
                  // Show enrollment required message
                  toast.info('You need to enroll first to access this feature.', {
                    autoClose: 3000,
                    position: 'top-right'
                  });
                  return;
                }
                setCurrentView('records');
              }}
            >
              <div className={`flex items-center justify-center aspect-square w-6 h-6 ${
                !enrollmentData || enrollmentData.enrollmentInfo?.status !== 'enrolled'
                  ? 'bg-red-800'
                  : 'bg-blue-900'
              }`}>
              <IdentificationCard className="text-white" weight="fill" />
            </div>

              Academic Records
            </Button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200">
       
          <Button 
            className="bg-red-800 text-white"
            onClick={handleSignOut}
          >
            <div className="flex justify-center items-center bg-white aspect-square w-5 h-5 " >
              <SignOut className="text-red-800" weight="fill" />
            </div>

            Sign Out  {userProfile?.firstName} {userProfile?.lastName}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-6">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-white p-6 border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-900 flex items-center justify-center">
                    <User size={32} className="text-white" weight="fill" />
                  </div>
                  <div>
                    <h1
                      className="text-2xl font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Welcome back, {userProfile?.firstName}!
                    </h1>
                    <p
                      className="text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Here's your academic dashboard overview
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-900 flex items-center justify-center">
                      <GraduationCap size={24} className="text-white" weight="fill" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        Current Grade
                      </p>
                      <p className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Not Enrolled
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-900 flex items-center justify-center">
                      <BookOpen size={24} className="text-white" weight="fill" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        Subjects
                      </p>
                      <p className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        0
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-900 flex items-center justify-center">
                      <Calendar size={24} className="text-white" weight="fill" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        Schedule
                      </p>
                      <p className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Not Set
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-none bg-gray-50 border-l-5 border-blue-900">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-900 flex items-center justify-center">
                      <ChartBar size={24} className="text-white" weight="fill" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        Performance
                      </p>
                      <p className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        N/A
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 border border-gray-200">
                <h2
                  className="text-xl font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => setCurrentView('enrollment')}
                    className="bg-blue-900 hover:bg-blue-800 justify-start h-12"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <GraduationCap size={20} className="mr-2" />
                    Start Enrollment Process
                  </Button>
                  <Button
                    variant="outline"
                    className="border-blue-900 text-blue-900 hover:bg-blue-50 justify-start h-12"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <BookOpen size={20} className="mr-2" />
                    View My Subjects
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentView === 'enrollment' && user && userProfile && (
            <EnrollmentForm
              userId={user.uid}
              userProfile={userProfile}
              onProgressUpdate={handleProgressUpdate}
            />
          )}

          {currentView === 'documents' && user && (
            <DocumentsManager
              userId={user.uid}
              userProfile={userProfile}
              onProgressUpdate={handleProgressUpdate}
            />
          )}

          {currentView === 'subjects' && user && (
            <MySubjectsView
              userId={user.uid}
              onNavigateToEnrollment={() => setCurrentView('enrollment')}
            />
          )}

          {currentView === 'schedule' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <Calendar size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <h1
                    className="text-2xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Class Schedule
                  </h1>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    View your weekly class schedule
                  </p>
                </div>
              </div>

              <Card className="p-12 text-center border-none bg-gray-50 border-l-5 border-blue-900">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
                <h3
                  className="text-lg font-medium text-gray-900 mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Schedule not available
                </h3>
                <p
                  className="text-gray-600 text-justify border-l-5 border-blue-900 p-3 bg-blue-50"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Your class schedule will be available once you're enrolled and your subjects are assigned.
                </p>
              </Card>
            </div>
          )}

          {currentView === 'performance' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <ChartBar size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <h1
                    className="text-2xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Academic Performance
                  </h1>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Track your grades and academic progress
                  </p>
                </div>
              </div>

              <Card className="p-12 text-center border-none bg-gray-50 border-l-5 border-blue-900">
                <ChartBar size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
                <h3
                  className="text-lg font-medium text-gray-900 mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Performance data not available
                </h3>
                <p
                  className="text-gray-600 text-justify border-l-5 border-blue-900 p-3 bg-blue-50"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Your academic performance data will be available once you have completed assessments and grades have been recorded.
                </p>
              </Card>
            </div>
          )}

          {currentView === 'records' && (
            <AcademicRecords
              userId={user?.uid || ''}
              studentName={`${userProfile?.firstName} ${userProfile?.lastName}`}
              onNavigateToEnrollment={() => setCurrentView('enrollment')}
            />
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditCancel}
        title="Edit Profile"
        size="2xl"
      >
        <ProfileForm
          user={user}
          userProfile={userProfile}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          isModal={true}
        />
      </Modal>
      </div>
    </div>
  );
}
