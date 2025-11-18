'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import TeacherOverview from '@/components/teacher-overview'
import TeacherClassesView from '@/components/teacher-classes-view'
import TeacherStudentsView from '@/components/teacher-students-view'
import TeacherGradesView from '@/components/teacher-grades-view'
import TeacherAnalytics from '@/components/teacher-analytics'
import EventsSidebar from '@/components/events-sidebar'
import TeacherProfileModal from '@/components/teacher-profile-modal'
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
  Terminal,
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

type ViewType = 'overview' | 'my-classes' | 'students' | 'grades' | 'analytics'

export default function TeacherPage() {
  const [teacher, setTeacher] = useState<TeacherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  const [sidebarCounts, setSidebarCounts] = useState<{
    classes: { subjects: number; sections: number }
    students: { total: number }
    grades: { entries: number }
  } | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
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

  // Fetch sidebar counts
  useEffect(() => {
    const fetchSidebarCounts = async () => {
      if (!teacher?.id) return

      try {
        const response = await fetch(
          `/api/teachers/sidebar-counts?teacherId=${teacher.id}`
        )
        const data = await response.json()
        if (data.success && data.counts) {
          setSidebarCounts(data.counts)
        }
      } catch (error) {
        console.error('Error fetching sidebar counts:', error)
      }
    }

    if (teacher) {
      fetchSidebarCounts()
      // Refresh counts every 30 seconds
      const interval = setInterval(fetchSidebarCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [teacher])

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

  const handleToggleRightSidebar = () => {
    setIsRightCollapsed((prev) => !prev)
  }

  const handleSettingsClick = () => {
    setShowProfileModal(true)
  }

  const handleProfileUpdate = async () => {
    // Reload teacher data after profile update
    if (user) {
      try {
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
        }
      } catch (error) {
        console.error('Error reloading teacher data:', error)
      }
    }
  }

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

  const rightSidebarLayout = useMemo(() => {
    if (isRightCollapsed) {
      return {
        marginClass: 'mr-16 sm:mr-20',
      }
    }

    return {
      marginClass: 'sm:mr-80 md:mr-96',
    }
  }, [isRightCollapsed])

  const navigationItems = useMemo(
    () => [
      {
        view: 'overview' as ViewType,
        label: 'Overview',
        description: 'Dashboard summary',
        icon: House,
        counts: null,
      },
      {
        view: 'my-classes' as ViewType,
        label: 'My Classes',
        description: 'Your subjects',
        icon: BookOpen,
        counts: sidebarCounts?.classes
          ? [
              { label: 'subjects', value: sidebarCounts.classes.subjects },
              { label: 'sections', value: sidebarCounts.classes.sections },
            ]
          : null,
      },
      {
        view: 'students' as ViewType,
        label: 'My Students',
        description: 'Student roster',
        icon: Users,
        counts: sidebarCounts?.students
          ? [{ label: 'total', value: sidebarCounts.students.total }]
          : null,
      },
      {
        view: 'grades' as ViewType,
        label: 'Student Grades',
        description: 'Grade management',
        icon: ClipboardText,
        counts: sidebarCounts?.grades
          ? [{ label: 'entries', value: sidebarCounts.grades.entries }]
          : null,
      },
      {
        view: 'analytics' as ViewType,
        label: 'Analytics',
        description: 'Performance insights',
        icon: ChartBar,
        counts: null,
      },
    ],
    [sidebarCounts]
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
                    <span className="flex flex-col items-start flex-1">
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
                      {item.counts && item.counts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {item.counts.map((count, idx) => {
                            // Color mapping for different count types
                            const getBadgeColor = (label: string) => {
                              if (label === 'subjects') {
                                return 'bg-purple-500'
                              } else if (label === 'sections') {
                                return 'bg-cyan-500'
                              } else if (label === 'total') {
                                return 'bg-green-500'
                              } else if (label === 'entries') {
                                return 'bg-blue-500'
                              }
                              return 'bg-blue-900'
                            }

                            return (
                              <span
                                key={idx}
                                className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white ${
                                  isActive ? 'text-blue-900' : 'text-blue-900'
                                }`}
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 500,
                                }}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${getBadgeColor(
                                    count.label
                                  )}`}
                                />
                                {count.value} {count.label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {!isLeftCollapsed && (
            <div className="pt-4 mt-4 border-t border-blue-100">
              <div className="border border-dashed border-blue-200 text-blue-900/70 rounded-xl transition-all duration-200 px-4 py-3 text-left">
                <div className="flex items-center justify-center bg-blue-900 rounded-lg w-8 h-8 mb-2">
                  <Terminal size={16} className="text-white" weight="fill" />
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/registrar')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      router.push('/registrar')
                    }
                  }}
                  className="w-full text-left space-y-1"
                  aria-label="Access registrar dashboard"
                >
                  <p className="text-sm font-medium text-gray-900">
                    Special Console Permission
                  </p>
                  <p className="text-xs text-blue-900/70">
                    Access registrar dashboard with granted permissions.
                  </p>
                </button>
              </div>
            </div>
          )}
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
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${leftSidebarLayout.marginClass} ${rightSidebarLayout.marginClass}`}
      >
        {currentView === 'overview' && teacher && (
          <div className="p-0">
            <TeacherOverview teacherId={teacher.id} />
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

        {currentView === 'analytics' && teacher && (
          <div className="p-0">
            <TeacherAnalytics
              teacherId={teacher.id}
              teacherName={teacher.firstName}
            />
          </div>
        )}
      </div>

      {/* Right Sidebar - Events & Chat */}
      {teacher && (
        <EventsSidebar
          level={null}
          userId={teacher.uid}
          isCollapsed={isRightCollapsed}
          onToggleCollapse={handleToggleRightSidebar}
        />
      )}

      {/* Profile Modal */}
      {teacher && (
        <TeacherProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          teacher={{
            id: teacher.id,
            uid: teacher.uid,
            email: teacher.email,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            middleName: teacher.middleName,
            extension: teacher.extension,
            phone: teacher.phone,
            photoURL: user?.photoURL || undefined,
          }}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  )
}
