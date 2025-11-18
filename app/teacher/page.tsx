'use client'

import { useEffect, useState, useMemo } from 'react'
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
  CaretLeft,
  List,
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
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
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

  const handleToggleLeftSidebar = () => {
    setIsLeftCollapsed((prev) => !prev)
  }

  const handleSettingsClick = () => {}

  const handleToggleKeyDown = (
    event: React.KeyboardEvent,
    onToggle: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }

  const leftSidebarLayout = useMemo(() => {
    if (isLeftCollapsed) {
      return {
        widthClass: 'w-[5.5rem]',
        marginClass: 'ml-[5.5rem]',
        contentAlignment: 'items-center',
      }
    }

    return {
      widthClass: 'w-80',
      marginClass: 'ml-80',
      contentAlignment: 'items-start',
    }
  }, [isLeftCollapsed])

  const navigationItems = useMemo(
    () => [
      {
        view: 'overview' as ViewType,
        label: 'Overview',
        description: 'Dashboard summary',
        icon: House,
      },
      {
        view: 'my-classes' as ViewType,
        label: 'My Classes',
        description: 'Your subjects',
        icon: BookOpen,
      },
      {
        view: 'students' as ViewType,
        label: 'My Students',
        description: 'Student roster',
        icon: Users,
      },
      {
        view: 'grades' as ViewType,
        label: 'Student Grades',
        description: 'Grade management',
        icon: ClipboardText,
      },
    ],
    []
  )

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
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-100 flex min-w-[1200px]">
      {/* Left Sidebar */}
      <aside
        className={`${leftSidebarLayout.widthClass} bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed left-0 top-0 z-10 border-r border-blue-100`}
      >
        <div
          className={`px-4 py-4 border-b bg-gradient-to-br from-blue-800 to-blue-900 flex items-center gap-3 w-full ${
            isLeftCollapsed ? 'justify-center shadow-xl' : ''
          }`}
        >
          {!isLeftCollapsed && (
            <div className="flex items-center gap-2">
              <div className="group relative w-[28px] h-[28px] rounded-md bg-white shadow-md transition-all duration-300 hover:w-[120px] overflow-hidden">
                <button
                  type="button"
                  onClick={handleSettingsClick}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, handleSettingsClick)
                  }
                  aria-label="Open teacher settings"
                  className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all duration-300 group-hover:justify-start"
                  tabIndex={0}
                >
                  <span className="w-6 h-6 ml-[6.5px] aspect-square rounded-full bg-white flex items-center justify-center">
                    <Gear size={18} weight="fill" className="text-blue-900" />
                  </span>
                  <span className="whitespace-nowrap text-blue-900 text-[11px] font-medium opacity-0 max-w-0 group-hover:max-w-[80px] group-hover:opacity-100 transition-all duration-200 overflow-hidden">
                    Settings
                  </span>
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleToggleLeftSidebar}
            onKeyDown={(event) =>
              handleToggleKeyDown(event, handleToggleLeftSidebar)
            }
            aria-label={isLeftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`${
              isLeftCollapsed ? '' : 'ml-auto'
            } w-6 h-6 flex items-center aspect-square justify-center rounded-md bg-white shadow-md transition-all duration-200 hover:from-blue-900 hover:to-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900`}
            tabIndex={0}
          >
            <span className="w-6 h-6 aspect-square rounded-full bg-white flex items-center justify-center">
              {isLeftCollapsed ? (
                <List size={18} weight="bold" className="text-blue-900" />
              ) : (
                <CaretLeft size={18} weight="bold" className="text-blue-900" />
              )}
            </span>
          </button>
        </div>

        {!isLeftCollapsed && (
          <div className="px-4 py-5 border-b border-blue-100 bg-gray-50/70 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center border-2 border-blue-900">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full aspect-square"
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
          </div>
        )}

        <nav className="flex-1 px-3 py-4 overflow-y-auto transition-all duration-300">
          {!isLeftCollapsed && (
            <div className="px-1 mb-3">
              <h4 className="text-sm font-medium text-blue-900 tracking-wide">
                Hey {teacher?.firstName || 'Teacher'}!
              </h4>
              <p className="text-xs text-blue-900/70">
                What would you like to manage today?
              </p>
            </div>
          )}

          <div
            className={
              isLeftCollapsed
                ? 'flex flex-col space-y-4'
                : 'flex flex-col space-y-3'
            }
          >
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = currentView === item.view

              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavigation(item.view)}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, () =>
                      handleNavigation(item.view)
                    )
                  }
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  tabIndex={0}
                  className={`w-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-800 to-blue-900 border-blue-900 shadow-md shadow-[0_0_18px_rgba(30,64,175,0.45)] text-white'
                      : 'bg-transparent border-transparent text-blue-900 hover:border-blue-300 hover:bg-blue-50'
                  } ${
                    isLeftCollapsed
                      ? 'rounded-xl flex flex-col items-center gap-2 px-3 py-4'
                      : 'rounded-xl flex items-center gap-3 px-4 py-3 justify-start text-left'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center rounded-lg w-8 h-8 ${
                      isActive ? 'bg-white' : 'bg-blue-900'
                    }`}
                  >
                    <IconComponent
                      size={16}
                      weight="fill"
                      className={isActive ? 'text-blue-900' : 'text-white'}
                    />
                  </span>
                  {isLeftCollapsed ? (
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wide ${
                        isActive ? 'text-white' : 'text-blue-900'
                      }`}
                    >
                      {item.label.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="flex flex-col items-start">
                      <span
                        className={`text-sm font-medium ${
                          isActive ? 'text-white' : 'text-blue-900'
                        }`}
                      >
                        {item.label}
                      </span>
                      <span
                        className={`text-[11px] ${
                          isActive ? 'text-white/70' : 'text-blue-900/70'
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {!isLeftCollapsed && (
          <div className="p-4 border-t border-blue-100">
            <button
              onClick={handleSignOut}
              onKeyDown={(event) => handleToggleKeyDown(event, handleSignOut)}
              className="w-full rounded-xl flex items-center gap-3 px-4 py-3 justify-start text-left bg-transparent border border-transparent text-red-800 hover:border-red-300 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-800"
              aria-label="Sign out"
            >
              <span className="flex items-center justify-center rounded-lg w-8 h-8 bg-red-800">
                <SignOut size={16} weight="fill" className="text-white" />
              </span>
              <span className="flex flex-col items-start">
                <span className="text-sm font-medium text-red-800">
                  Sign Out {teacher?.firstName || 'Teacher'}
                </span>
                <span className="text-[11px] text-red-800/70">Log out</span>
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${leftSidebarLayout.marginClass}`}
      >
        {currentView === 'overview' && (
          <div className="p-6">
            <div className="mb-6">
              <h1
                className="text-3xl font-medium text-gray-900 mb-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Welcome back, {teacher?.firstName || 'Teacher'}!
              </h1>
              <p
                className="text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Here's an overview of your teaching dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <button
                onClick={() => handleNavigation('my-classes')}
                className="bg-white/95 border border-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                    <BookOpen size={24} className="text-white" weight="fill" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3
                      className="text-lg font-medium text-gray-900 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      My Classes
                    </h3>
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      View your assigned subjects
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleNavigation('students')}
                className="bg-white/95 border border-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                    <Users size={24} className="text-white" weight="fill" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3
                      className="text-lg font-medium text-gray-900 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      My Students
                    </h3>
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Manage your student roster
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleNavigation('grades')}
                className="bg-white/95 border border-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                    <ClipboardText
                      size={24}
                      className="text-white"
                      weight="fill"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h3
                      className="text-lg font-medium text-gray-900 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Student Grades
                    </h3>
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Track and manage grades
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

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
