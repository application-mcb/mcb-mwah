'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import TeacherClassesView from '@/components/teacher-classes-view'
import TeacherStudentsView from '@/components/teacher-students-view'
import TeacherGradesView from '@/components/teacher-grades-view'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'
import {
  User,
  Users,
  ChartBar,
  Gear,
  SignOut,
  House,
  GraduationCap,
  Bell,
  Shield,
  BookOpen,
  UserList,
  ClipboardText,
} from '@phosphor-icons/react'

interface TeacherData {
  id: string
  uid: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  extension?: string
  phone: string
  status?: 'active' | 'inactive'
}

type ViewType = 'overview' | 'my-classes' | 'students' | 'grades'

export default function TeacherPage() {
  const [teacher, setTeacher] = useState<TeacherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()

  useEffect(() => {
    if (authLoading) {
      return // Wait for auth to load
    }

    if (!user) {
      router.push('/')
      return
    }

    const checkTeacherAccess = async () => {
      try {
        // Check teacher role using UID and email
        const response = await fetch('/api/teachers/check-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setTeacher(data.teacher)
        } else {
          setError(data.error || 'Access denied')
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }
      } catch (error: any) {
        setError('Failed to verify access: ' + error.message)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    checkTeacherAccess()
  }, [user, authLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleNavigation = (view: ViewType) => {
    setCurrentView(view)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-900 animate-pulse"></div>
            <div
              className="w-3 h-3 bg-blue-900 animate-pulse"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-900 animate-pulse"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
          <p
            className="text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Verifying access...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <h1
            className="text-xl font-light text-red-600 mb-4"
            style={{ fontFamily: 'Poppins' }}
          >
            Access Denied
          </h1>
          <p
            className="text-gray-600 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {error}
          </p>
          <div className="space-y-2 mb-4">
            <p
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Make sure you're logged in with the correct teacher account.
            </p>
            <p
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Check the console for detailed error information.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => (window.location.href = '/auth-debug')}
              variant="outline"
              className="w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Debug Authentication
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Go to Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const getFullName = () => {
    if (!teacher) return 'Teacher'
    const { firstName, middleName, lastName, extension } = teacher
    let fullName = firstName || ''

    if (middleName) {
      // Add middle name initial (first letter only)
      fullName += ` ${middleName.charAt(0).toUpperCase()}.`
    }

    if (lastName) {
      fullName += ` ${lastName}`
    }

    if (extension) {
      fullName += ` ${extension}`
    }

    return fullName || 'Teacher'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white/50 shadow-lg flex flex-col animate-in slide-in-from-left-4 duration-500 max-h-screen sticky top-0 overflow-hidden">
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
                <h1 className="text-xl font-light text-gray-900 text-left">
                  Teacher Portal
                </h1>
                <p className="text-xs text-gray-600 font-bold uppercase font-mono">
                  {SCHOOL_NAME_FORMAL}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Profile Section */}
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
                <GraduationCap
                  size={32}
                  className="text-white"
                  weight="duotone"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {getFullName()}
              </h3>
              <p className="text-xs text-gray-900 font-mono font-medium">
                {teacher?.email}
              </p>
              <p className="text-xs text-gray-600 font-mono font-medium">
                Teacher
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="border-1 shadow-sm border-blue-900 rounded-none w-full text-white bg-blue-900"
            onClick={() => {
              /* Add profile edit functionality */
            }}
          >
            <Gear
              size={20}
              weight="fill"
              className="mr-1 transition-transform duration-200 hover:text-blue-900"
            />
            Settings
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-900 tracking-wider mb-[-2]">
              Hello {teacher?.firstName}!
            </h4>
            <h4 className="text-sm font-light text-blue-900 tracking-wider mb-4">
              What would you like to do?
            </h4>

            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-1 shadow-sm ${
                currentView === 'overview'
                  ? 'bg-blue-50 text-blue-900 border-blue-900'
                  : ''
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
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-1 shadow-sm ${
                currentView === 'my-classes'
                  ? 'bg-blue-50 text-blue-900 border-blue-900'
                  : ''
              }`}
              onClick={() => handleNavigation('my-classes')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <BookOpen className="text-white" weight="fill" />
              </div>
              My Classes
            </Button>

            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-1 shadow-sm ${
                currentView === 'students'
                  ? 'bg-blue-50 text-blue-900 border-blue-900'
                  : ''
              }`}
              onClick={() => handleNavigation('students')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <Users className="text-white" weight="fill" />
              </div>
              My Students
            </Button>

            <Button
              variant="ghost"
              className={`rounded-none font-light w-full justify-start h-12 text-left transition-all duration-200 hover:bg-blue-50 hover:text-blue-900 hover:scale-[1.02] transform hover:border-blue-900 border-1 shadow-sm ${
                currentView === 'grades'
                  ? 'bg-blue-50 text-blue-900 border-blue-900'
                  : ''
              }`}
              onClick={() => handleNavigation('grades')}
            >
              <div className="flex items-center justify-center bg-blue-900 aspect-square w-6 h-6">
                <ClipboardText className="text-white" weight="fill" />
              </div>
              Student Grades
            </Button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200">
          <Button
            variant="outline"
            className="rounded-none border-r-0 border-b-0 font-light border-t-0 w-full justify-start border-1 shadow-sm border-red-900 bg-red-50 text-red-900 hover:text-red-900 hover:border-red-900"
            onClick={handleSignOut}
          >
            <div className="flex justify-center items-center bg-red-800 aspect-square w-6 h-6">
              <SignOut className="text-white" />
            </div>
            Sign Out {teacher?.firstName || 'Teacher'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentView === 'overview' && (
          <div className="p-6">
            <Card className="p-8 text-center">
              <h2
                className="text-2xl font-light text-gray-900 mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Welcome to the Teacher Dashboard
              </h2>
              <p
                className="text-gray-600 mb-6"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Select an option from the sidebar to manage your classes, view
                students, and track grades.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Button
                  onClick={() => handleNavigation('my-classes')}
                  className="h-24 flex flex-col items-center justify-center bg-blue-900 hover:bg-blue-900 text-white rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <BookOpen size={32} className="mb-2" />
                  My Classes
                </Button>
                <Button
                  onClick={() => handleNavigation('students')}
                  className="h-24 flex flex-col items-center justify-center bg-blue-900 hover:bg-blue-900 text-white rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Users size={32} className="mb-2" />
                  My Students
                </Button>
                <Button
                  onClick={() => handleNavigation('grades')}
                  className="h-24 flex flex-col items-center justify-center bg-blue-900 hover:bg-blue-900 text-white rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <ClipboardText size={32} className="mb-2" />
                  Student Grades
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Placeholder content for other views - will be implemented with components */}
        {currentView === 'my-classes' && teacher && (
          <div className="p-6">
            <TeacherClassesView teacherId={teacher.id} />
          </div>
        )}

        {currentView === 'students' && teacher && (
          <div className="p-6">
            <TeacherStudentsView teacherId={teacher.id} />
          </div>
        )}

        {currentView === 'grades' && teacher && (
          <div className="p-6">
            <TeacherGradesView teacherId={teacher.id} />
          </div>
        )}
      </div>
    </div>
  )
}
