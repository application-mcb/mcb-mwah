'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CourseManagement from '@/components/course-management';
import GradeSectionManagement from '@/components/grade-section-management';
import SubjectManagement from '@/components/subject-management';
import EnrollmentManagement from '@/components/enrollment-management';
import TeacherManagement from '@/components/teacher-management';
import {
  User,
  Users,
  ChartBar,
  Gear,
  SignOut,
  House,
  IdentificationCard,
  GraduationCap,
  Calendar,
  Bell,
  MemberOfIcon,
  Shield,
  BookOpen,
  UserList
} from "@phosphor-icons/react";

interface RegistrarData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

type ViewType = 'overview' | 'student-enrollments' | 'course-management' | 'grade-section-management' | 'subject-management' | 'teacher-management';

export default function RegistrarPage() {
  const [registrar, setRegistrar] = useState<RegistrarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to load
    }

    if (!user) {
      router.push('/');
      return;
    }

    const checkRegistrarAccess = async () => {
      try {
        // Check registrar role using UID and email
        const response = await fetch('/api/registrar/check-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setRegistrar(data.registrar);
        } else {
          setError(data.error || 'Access denied');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (error: any) {
        setError('Failed to verify access: ' + error.message);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    checkRegistrarAccess();
  }, [user, authLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleNavigation = (view: ViewType) => {
    setCurrentView(view);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-900 animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-900 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-blue-900 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-light text-red-600 mb-4" style={{ fontFamily: 'Poppins' }}>
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            {error}
          </p>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              Make sure you're logged in with the correct registrar account.
            </p>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              Check the console for detailed error information.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/auth-debug'}
              variant="outline"
              className="w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Debug Authentication
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const getFullName = () => {
    if (!registrar) return 'Registrar';
    const { firstName, lastName } = registrar;
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Registrar';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white/50 shadow-lg flex flex-col animate-in slide-in-from-left-4 duration-500 max-h-screen sticky top-0">
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
                <h1 className="text-xl font-light text-gray-900 text-left">Registrar System</h1>
                <p className="text-xs text-gray-600 font-bold uppercase font-mono">Marian College of Baliuag, Inc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registrar Profile Section */}
        <div className="p-6 border-gray-200 bg-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full aspect-square border-2 border-black"
                />
              ) : (
                <Shield size={32} className="text-white" weight="duotone" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {getFullName()}
              </h3>
              <p className="text-xs text-gray-900 font-mono font-medium">{registrar?.email}</p>
              <p className="text-xs text-gray-600 font-mono font-medium">Registrar</p>
            </div>
          </div>
          <Button 
            variant="ghost"
            className="border-1 border-blue-900 rounded-none w-full text-white bg-blue-900"
            onClick={() => {/* Add profile edit functionality */}}
          >
            <Gear size={20} weight="fill" className="mr-1 transition-transform duration-200 hover:text-blue-900" />
            Settings
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-900 tracking-wider mb-[-2]">Hey {registrar?.firstName}!</h4>
            <h4 className="text-sm font-light text-blue-900 tracking-wider mb-4">What would you like to do?</h4>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'overview' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('overview')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <House className="text-white" weight="fill" />
              </div>
              Overview
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'student-enrollments' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('student-enrollments')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <Users className="text-white" weight="fill" />
              </div>
              Student Enrollments
            </Button>
            
            <Button 
              variant="ghost"
              className="rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5"
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <GraduationCap className="text-white" weight="fill" />
              </div>
              Student Management  
            </Button>

            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'teacher-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('teacher-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <GraduationCap className="text-white" weight="fill" />
              </div>
              Teacher Management
            </Button>
            
            <Button 
              variant="ghost"
              className="rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5"
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <ChartBar className="text-white" weight="fill" />
              </div>
              Reports & Analytics
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'subject-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('subject-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <BookOpen className="text-white" weight="fill" />
              </div>
              Subject Management
            </Button>


            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-10 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.01] transform hover:border-blue-900 border-l-5 ${
                currentView === 'course-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('course-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-5 h-5">
              <BookOpen className="text-white" weight="fill" />
              </div>
              Course Management
            </Button>
            
            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-l-5 ${
                currentView === 'grade-section-management' ? 'bg-blue-50 text-blue-900 border-blue-900' : ''
              }`}
              onClick={() => handleNavigation('grade-section-management')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <MemberOfIcon className="text-white" weight="fill" />
              </div>
              Grades & Sections
            </Button>

            

           

        
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200">
          <Button 
            variant="outline"
            className="rounded-none border-r-0 border-b-0 font-light border-t-0 w-full justify-start border-l-5 border-red-900 bg-red-50 text-red-900 hover:text-red-900 hover:border-red-900"
            onClick={handleSignOut}
          >
            <div className="flex justify-center items-center bg-red-800 aspect-square w-6 h-6">
              <SignOut className="text-white" />
            </div>
            Sign Out {registrar?.firstName || 'Registrar'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentView === 'overview' && (
          <div className="p-6">
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Welcome to the Registrar Dashboard
              </h2>
              <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Select an option from the sidebar to manage student enrollments, courses, grades, and subjects.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Button
                  onClick={() => handleNavigation('student-enrollments')}
                  className="h-24 flex flex-col items-center justify-center bg-blue-900 hover:bg-blue-800 text-white rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Users size={32} className="mb-2" />
                  Student Enrollments
                </Button>
                <Button
                  onClick={() => handleNavigation('course-management')}
                  className="h-24 flex flex-col items-center justify-center bg-blue-900 hover:bg-blue-800 text-white rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <GraduationCap size={32} className="mb-2" />
                  Course Management
                </Button>
                <Button
                  onClick={() => handleNavigation('grade-section-management')}
                  className="h-24 flex flex-col items-center justify-center bg-blue-900 hover:bg-blue-800 text-white rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <MemberOfIcon size={32} className="mb-2" />
                  Grades & Sections
                </Button>
                <Button
                  onClick={() => handleNavigation('subject-management')}
                  className="h-24 flex flex-col items-center justify-center bg-blue-900 hover:bg-blue-800 text-white rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <BookOpen size={32} className="mb-2" />
                  Subject Management
                </Button>
              </div>
            </Card>
          </div>
        )}

        {currentView === 'student-enrollments' && registrar && (
          <EnrollmentManagement 
            registrarUid={registrar.uid} 
            registrarName={`${registrar.firstName} ${registrar.lastName}`}
          />
        )}

        {currentView === 'course-management' && registrar && (
          <CourseManagement registrarUid={registrar.uid} />
        )}

        {currentView === 'grade-section-management' && registrar && (
          <GradeSectionManagement registrarUid={registrar.uid} />
        )}

        {currentView === 'subject-management' && registrar && (
          <SubjectManagement registrarUid={registrar.uid} />
        )}

        {currentView === 'teacher-management' && registrar && (
          <TeacherManagement registrarUid={registrar.uid} />
        )}

      </div>
    </div>
  );
}
