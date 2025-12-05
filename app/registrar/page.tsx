'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import CourseManagement from '@/components/course-management'
import GradeSectionManagement from '@/components/grade-section-management'
import SubjectManagement from '@/components/subject-management'
import EnrollmentManagement from '@/components/enrollment-management'
import StudentManagement from '@/components/student-management'
import TeacherManagement from '@/components/teacher-management'
import RegistrarOverview from '@/components/registrar-overview'
import EventsManagement from '@/components/events-management'
import ChatInterface from '@/components/chat/chat-interface'
import TaskManager from '@/components/task-manager'
import EventsSidebar from '@/components/events-sidebar'
import RegistrarAnalytics from '@/components/registrar-analytics'
import RegistrarProfileModal from '@/components/registrar-profile-modal'
import RegistrarAuditLogs from '@/components/registrar-audit-logs'
import { ContactData } from '@/lib/chat-database'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Users,
  ChartBar,
  Gear,
  SignOut,
  House,
  GraduationCap,
  Bell,
  MemberOfIcon,
  Shield,
  BookOpen,
  ChatCircleDots,
  CaretLeft,
  CaretRight,
  List,
  Users as UsersIcon,
  PaperPlaneTilt,
  ListChecks,
  BookmarkSimple,
  FunnelSimple,
  X,
  ArrowBendLeftUp,
} from '@phosphor-icons/react'
import resourcesData from '@/data/registrar-resources.json' assert { type: 'json' }

interface RegistrarData {
  uid: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  nameExtension?: string
  birthday?: string
  photoURL?: string
  role: string
  permissions?: string[] // For teachers accessing registrar dashboard
}

type ViewType =
  | 'overview'
  | 'student-enrollments'
  | 'student-management'
  | 'course-management'
  | 'grade-section-management'
  | 'subject-management'
  | 'teacher-management'
  | 'events-management'
  | 'analytics'
  | 'audit-logs'

type ResourceItem = {
  id: string
  title: string
  tags: string[]
  color: string
  summary: string
  pages: {
    heading: string
    content: string[]
  }[]
}

export default function RegistrarPage() {
  const [registrar, setRegistrar] = useState<RegistrarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  const [isArrangeView, setIsArrangeView] = useState(false)
  const [sidebarView, setSidebarView] = useState<
    'chat' | 'tasks' | 'events' | 'resources'
  >('resources')
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(
    null
  )
  const [contactsLoading, setContactsLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [resourceSearch, setResourceSearch] = useState('')
  const [activeResourceTag, setActiveResourceTag] = useState<string | null>(
    null
  )
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(
    null
  )
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [resourcePage, setResourcePage] = useState(0)
  const [showResourceFilterDropdown, setShowResourceFilterDropdown] =
    useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [sidebarCounts, setSidebarCounts] = useState<{
    enrollments: { pending: number; regular: number; irregular: number }
    teachers: { faculty: number }
    subjects: { subjects: number; subjectSets: number }
    courses: { courses: number }
    gradesAndSections: { grades: number; sections: number }
    events: { due: number; upcoming: number; expired: number }
  } | null>(null)
  const previousContacts = useRef<ContactData[]>([])
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

    const checkRegistrarAccess = async () => {
      try {
        // First check if user is a registrar
        const registrarResponse = await fetch('/api/registrar/check-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
          }),
        })

        if (registrarResponse.ok) {
          const registrarData = await registrarResponse.json()
          setRegistrar(registrarData.registrar)
          setLoading(false)
          return
        }

        // If not registrar, check if user is a teacher with permissions
        const teacherResponse = await fetch('/api/teachers/check-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
          }),
        })

        if (teacherResponse.ok) {
          const teacherData = await teacherResponse.json()
          // Convert teacher data to registrar format for compatibility
          setRegistrar({
            uid: teacherData.teacher.uid,
            email: teacherData.teacher.email,
            firstName: teacherData.teacher.firstName,
            lastName: teacherData.teacher.lastName,
            middleName: teacherData.teacher.middleName,
            role: 'teacher',
            permissions: teacherData.teacher.permissions || [],
          })
          setLoading(false)
          return
        }

        // Neither registrar nor teacher
        setError('Access denied')
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } catch (error: any) {
        setError('Failed to verify access: ' + error.message)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    checkRegistrarAccess()
  }, [user, authLoading, router])

  // Set default view for teachers based on permissions
  useEffect(() => {
    if (registrar?.role === 'teacher' && registrar?.permissions) {
      // If current view is not in permissions, redirect to first allowed view
      if (!registrar.permissions.includes(currentView)) {
        const firstAllowedView = registrar.permissions[0] as ViewType
        if (firstAllowedView) {
          setCurrentView(firstAllowedView)
        }
      }
    }
  }, [registrar, currentView])

  // Fetch sidebar counts
  useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        const response = await fetch('/api/registrar/sidebar-counts')
        const data = await response.json()
        if (data.success && data.counts) {
          setSidebarCounts(data.counts)
        }
      } catch (error) {
        console.error('Error fetching sidebar counts:', error)
      }
    }

    if (registrar) {
      fetchSidebarCounts()
      // Refresh counts every 30 seconds
      const interval = setInterval(fetchSidebarCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [registrar])

  useEffect(() => {
    if (sidebarView === 'chat' && user?.uid) {
      const fetchContacts = async () => {
        try {
          setContactsLoading(true)
          const response = await fetch(
            `/api/chat/contacts?userId=${user.uid}&role=registrar`
          )
          const data = await response.json()

          if (data.success) {
            // Update previous contacts before setting new ones
            setContacts((prevContacts) => {
              previousContacts.current = [...prevContacts]
              return data.contacts
            })
          }
        } catch (error) {
          console.error('Error fetching contacts:', error)
        } finally {
          setContactsLoading(false)
        }
      }

      fetchContacts()

      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid),
        orderBy('lastMessageAt', 'desc'),
        limit(5)
      )

      const unsubscribe = onSnapshot(chatsQuery, async () => {
        await fetchContacts()
      })

      return () => unsubscribe()
    }
  }, [sidebarView, user?.uid])

  const handleContactClick = async (contact: ContactData) => {
    if (!contact.chatId) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: contact.uid,
            registrarId: user?.uid,
          }),
        })

        const data = await response.json()

        if (data.success && data.chatId) {
          setSelectedContact({
            ...contact,
            chatId: data.chatId,
          })
        } else {
          toast.error(data.error || 'Failed to create chat')
        }
      } catch (error) {
        console.error('Error creating chat:', error)
        toast.error('Failed to create chat')
      }
    } else {
      setSelectedContact(contact)
    }
  }

  // Mouse movement effect for background glow
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleNavigation = (view: ViewType) => {
    // If user is a teacher, check if they have permission for this view
    if (registrar?.role === 'teacher' && registrar?.permissions) {
      if (!registrar.permissions.includes(view)) {
        // Redirect to first allowed view
        const firstAllowedView = registrar.permissions[0] as ViewType
        if (firstAllowedView) {
          setCurrentView(firstAllowedView)
          toast.error('You do not have permission to access this section')
          return
        }
      }
    }
    setCurrentView(view)
  }

  const handleSettingsClick = () => {
    setShowProfileModal(true)
  }

  const handleProfileUpdate = async () => {
    // Reload registrar data after profile update
    if (user) {
      try {
        const response = await fetch('/api/registrar/check-role', {
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
          setRegistrar(data.registrar)
        }

        // Refresh contacts if chat sidebar is open
        if (sidebarView === 'chat' && user.uid) {
          try {
            const contactsResponse = await fetch(
              `/api/chat/contacts?userId=${user.uid}&role=registrar`
            )
            const contactsData = await contactsResponse.json()

            if (contactsData.success) {
              setContacts((prevContacts) => {
                previousContacts.current = [...prevContacts]
                return contactsData.contacts
              })
            }
          } catch (error) {
            console.error('Error refreshing contacts:', error)
          }
        }
      } catch (error) {
        console.error('Error reloading registrar data:', error)
      }
    }
  }

  const handleToggleLeftSidebar = () => {
    setIsLeftCollapsed((prev) => !prev)
  }

  const handleToggleRightSidebar = () => {
    setIsRightCollapsed((prev) => !prev)
  }

  const handleToggleArrangeView = () => {
    setIsArrangeView((prev) => !prev)
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

  const getFullName = () => {
    if (!registrar) return 'Registrar'
    const { firstName, lastName } = registrar
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Registrar'
  }

  const getInitials = () => {
    if (!registrar) return 'R'
    const { firstName, lastName } = registrar
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}`.slice(0, 2) || 'R'
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
        widthClass: 'w-[6.5rem]',
        marginClass: 'mr-[6.5rem]',
        contentAlignment: 'items-center',
      }
    }

    return {
      widthClass: 'w-96',
      marginClass: 'mr-96',
      contentAlignment: 'items-start',
    }
  }, [isRightCollapsed])

  const mainContentSpacing = useMemo(() => {
    return `${leftSidebarLayout.marginClass} ${rightSidebarLayout.marginClass}`
  }, [leftSidebarLayout.marginClass, rightSidebarLayout.marginClass])

  const isArrangeViewActive = isArrangeView && !isLeftCollapsed

  const resourceItems = useMemo<ResourceItem[]>(() => {
    return resourcesData as ResourceItem[]
  }, [])

  const resourceTags = useMemo(() => {
    return Array.from(
      new Set(resourceItems.flatMap((item) => item.tags))
    ).sort()
  }, [resourceItems])

  const filteredResources = useMemo(() => {
    return resourceItems.filter((item) => {
      const matchesTag = activeResourceTag
        ? item.tags.includes(activeResourceTag)
        : true
      const query = resourceSearch.trim().toLowerCase()
      const matchesSearch =
        query.length === 0 ||
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      return matchesTag && matchesSearch
    })
  }, [activeResourceTag, resourceItems, resourceSearch])

  const handleSelectResource = (resource: ResourceItem) => {
    setSelectedResource(resource)
    setIsResourceModalOpen(true)
    setResourcePage(0)
  }

  const handleCloseResourceModal = () => {
    setIsResourceModalOpen(false)
    setSelectedResource(null)
    setResourcePage(0)
  }

  const navigationItems = useMemo(() => {
    const allItems = [
      {
        view: 'overview' as ViewType,
        label: 'Overview',
        description: 'Dashboard summary',
        icon: House,
        counts: null,
      },
      {
        view: 'student-enrollments' as ViewType,
        label: 'Student Enrollments',
        description: 'Enrollment pipeline',
        icon: Users,
        counts: sidebarCounts?.enrollments
          ? [
              { label: 'pending', value: sidebarCounts.enrollments.pending },
              { label: 'regular', value: sidebarCounts.enrollments.regular },
              {
                label: 'irregular',
                value: sidebarCounts.enrollments.irregular,
              },
            ]
          : null,
      },
      {
        view: 'student-management' as ViewType,
        label: 'Student Management',
        description: 'Academic records',
        icon: GraduationCap,
        counts: null,
      },
      {
        view: 'teacher-management' as ViewType,
        label: 'Teacher Management',
        description: 'Faculty overview',
        icon: GraduationCap,
        counts: sidebarCounts?.teachers
          ? [{ label: 'faculty', value: sidebarCounts.teachers.faculty }]
          : null,
      },
      {
        view: 'subject-management' as ViewType,
        label: 'Subject Management',
        description: 'Curriculum tools',
        icon: BookOpen,
        counts: sidebarCounts?.subjects
          ? [
              { label: 'subjects', value: sidebarCounts.subjects.subjects },
              {
                label: 'subject sets',
                value: sidebarCounts.subjects.subjectSets,
              },
            ]
          : null,
      },
      {
        view: 'course-management' as ViewType,
        label: 'Course Management',
        description: 'Programs catalog',
        icon: BookOpen,
        counts: sidebarCounts?.courses
          ? [{ label: 'courses', value: sidebarCounts.courses.courses }]
          : null,
      },
      {
        view: 'grade-section-management' as ViewType,
        label: 'Grades & Sections',
        description: 'Section builder',
        icon: MemberOfIcon,
        counts: sidebarCounts?.gradesAndSections
          ? [
              {
                label: 'grades',
                value: sidebarCounts.gradesAndSections.grades,
              },
              {
                label: 'sections',
                value: sidebarCounts.gradesAndSections.sections,
              },
            ]
          : null,
      },
      {
        view: 'events-management' as ViewType,
        label: 'Events & Announcements',
        description: 'Content management',
        icon: Bell,
        counts: sidebarCounts?.events
          ? [
              { label: 'due', value: sidebarCounts.events.due },
              { label: 'upcoming', value: sidebarCounts.events.upcoming },
              { label: 'expired', value: sidebarCounts.events.expired },
            ]
          : null,
      },
      {
        view: 'analytics' as ViewType,
        label: 'Analytics & Reports',
        description: 'Student insights',
        icon: ChartBar,
        counts: null,
      },
      {
        view: 'audit-logs' as ViewType,
        label: 'Audit Logs',
        description: 'System activity trail',
        icon: Shield,
        counts: null,
      },
    ]

    // If user is a teacher with permissions, filter navigation items
    if (registrar?.role === 'teacher' && registrar?.permissions) {
      const allowedViews = registrar.permissions
      return allItems.filter((item) => allowedViews.includes(item.view))
    }

    // Registrar sees all items
    return allItems
  }, [sidebarCounts, registrar])

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
              Make sure you're logged in with the correct registrar account.
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

  return (
    <div className="min-h-screen bg-blue-50   bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] flex min-w-[1200px]">
      {/* Mouse-following glow effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle 240px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`,
          transition: 'background 0.3s ease-out',
        }}
      />
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
                  aria-label="Open registrar settings"
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
              <div className="group relative w-[28px] h-[28px] rounded-md bg-white shadow-md transition-all duration-300 hover:w-[135px] overflow-hidden">
                <button
                  type="button"
                  onClick={handleToggleArrangeView}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, handleToggleArrangeView)
                  }
                  aria-label="Toggle compact navigation view"
                  aria-pressed={isArrangeViewActive}
                  className={`absolute inset-0 flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all duration-300 justify-center group-hover:justify-start ${
                    isArrangeViewActive
                      ? 'bg-white border border-blue-900'
                      : 'bg-white'
                  }`}
                  tabIndex={0}
                >
                  <div className="w-6 h-6 ml-[6.5px] aspect-square rounded-full flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-[2px]">
                      <span className="w-1 h-1 rounded-sm bg-blue-900"></span>
                      <span className="w-1 h-1 rounded-sm bg-blue-900"></span>
                      <span className="w-1 h-1 rounded-sm bg-blue-900"></span>
                      <span className="w-1 h-1 rounded-sm bg-blue-900"></span>
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-blue-900 text-[11px] font-medium opacity-0 max-w-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-200 overflow-hidden">
                    {isArrangeViewActive ? 'Normal view' : 'Simplified view'}
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
                {user?.photoURL || registrar?.photoURL ? (
                  <img
                    src={user?.photoURL || registrar?.photoURL || ''}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full aspect-square"
                  />
                ) : (
                  <Shield size={32} className="text-white" weight="duotone" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {getFullName()}
                </h3>
                <p className="text-xs text-gray-900 font-mono font-medium">
                  {registrar?.email}
                </p>
                <p className="text-xs text-gray-600 font-mono font-medium">
                  {registrar?.role === 'teacher' ? 'Teacher' : 'Registrar'}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 overflow-y-auto transition-all duration-300">
          {!isLeftCollapsed && (
            <div className="px-1 mb-3">
              <h4 className="text-sm font-medium text-blue-900 tracking-wide">
                Hey{' '}
                {registrar?.firstName ||
                  (registrar?.role === 'teacher' ? 'Teacher' : 'Registrar')}
                !
              </h4>
              <p className="text-xs text-blue-900/70">
                {registrar?.role === 'teacher'
                  ? 'Access granted sections'
                  : 'What would you like to manage today?'}
              </p>
            </div>
          )}

          <div
            className={
              isLeftCollapsed
                ? 'flex flex-col space-y-4'
                : isArrangeViewActive
                ? 'grid grid-cols-3 gap-3'
                : 'flex flex-col space-y-3'
            }
          >
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = currentView === item.view

              if (isArrangeViewActive) {
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
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl aspect-square border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-800 to-blue-900 border-blue-900 shadow-lg'
                        : 'bg-white/95 border-transparent hover:border-blue-300 hover:shadow-lg'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-white' : 'bg-blue-900'
                      }`}
                    >
                      <IconComponent
                        size={18}
                        weight="fill"
                        className={isActive ? 'text-blue-900' : 'text-white'}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium text-center leading-tight ${
                        isActive ? 'text-white' : 'text-blue-900'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              }

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
                              if (label === 'pending') {
                                return 'bg-yellow-500'
                              } else if (label === 'regular') {
                                return 'bg-green-500'
                              } else if (label === 'irregular') {
                                return 'bg-orange-500'
                              } else if (label === 'faculty') {
                                return 'bg-blue-500'
                              } else if (label === 'subjects') {
                                return 'bg-purple-500'
                              } else if (label === 'subject sets') {
                                return 'bg-indigo-500'
                              } else if (label === 'courses') {
                                return 'bg-teal-500'
                              } else if (label === 'grades') {
                                return 'bg-pink-500'
                              } else if (label === 'sections') {
                                return 'bg-cyan-500'
                              } else if (label === 'due') {
                                return 'bg-green-500'
                              } else if (label === 'upcoming') {
                                return 'bg-blue-500'
                              } else if (label === 'expired') {
                                return 'bg-red-500'
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

          {!isArrangeViewActive && registrar?.role === 'teacher' && (
            <div className="pt-4 mt-4 border-t border-blue-100">
              <div
                className={`border border-dashed border-blue-200 text-blue-900/70 rounded-xl transition-all duration-200 ${
                  isLeftCollapsed
                    ? 'flex flex-col items-center gap-2 px-3 py-4'
                    : 'px-4 py-3 text-left'
                }`}
              >
                <div className="flex items-center justify-center bg-blue-900 rounded-lg w-8 h-8 mb-2">
                  <ArrowBendLeftUp
                    size={16}
                    className="text-white"
                    weight="fill"
                  />
                </div>
                {isLeftCollapsed ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-blue-900">
                    Return
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/teacher')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        router.push('/teacher')
                      }
                    }}
                    className="w-full text-left space-y-1"
                    aria-label="Return to teacher dashboard"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      Return to Teacher's Dashboard
                    </p>
                    <p className="text-xs text-blue-900/70">
                      Go back to your teacher dashboard.
                    </p>
                  </button>
                )}
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
                  Sign Out{' '}
                  {registrar?.firstName ||
                    (registrar?.role === 'teacher' ? 'Teacher' : 'Registrar')}
                </span>
                <span className="text-[11px] text-red-800/70">Log out</span>
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${mainContentSpacing}`}
      >
        {currentView === 'overview' && registrar && (
          <RegistrarOverview registrarUid={registrar.uid} />
        )}

        {currentView === 'student-enrollments' && registrar && (
          <EnrollmentManagement
            registrarUid={registrar.uid}
            registrarName={`${registrar.firstName} ${registrar.lastName}`}
          />
        )}

        {currentView === 'student-management' && registrar && (
          <StudentManagement
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

        {currentView === 'events-management' && registrar && (
          <EventsManagement registrarUid={registrar.uid} />
        )}

        {currentView === 'analytics' && registrar && (
          <RegistrarAnalytics
            registrarUid={registrar.uid}
            registrarName={`${registrar.firstName} ${registrar.lastName}`}
          />
        )}

        {currentView === 'audit-logs' && registrar && (
          <RegistrarAuditLogs
            registrarName={`${registrar.firstName} ${registrar.lastName}`}
            registrarEmail={registrar.email}
            registrarAvatarUrl={registrar.photoURL}
          />
        )}
      </div>

      {/* Right Sidebar - AI Chatbot / Chat */}
      {selectedContact && sidebarView === 'chat' ? (
        <aside
          className={`${rightSidebarLayout.widthClass} bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed right-0 top-0 z-10 border-l border-blue-100`}
        >
          <ChatInterface
            chatId={selectedContact.chatId!}
            userId={user?.uid || ''}
            contact={selectedContact}
            onBack={() => setSelectedContact(null)}
            onToggleCollapse={handleToggleRightSidebar}
          />
        </aside>
      ) : (
        <aside
          className={`${rightSidebarLayout.widthClass} bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed right-0 top-0 z-10 border-l border-blue-100`}
        >
          <div
            className={`px-4 py-4 border-b border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900 text-white flex ${
              isRightCollapsed
                ? 'flex-col items-center gap-3'
                : 'items-center justify-between'
            }`}
          >
            {isRightCollapsed ? (
              <>
                <div className="w-10 h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl">
                  {sidebarView === 'chat' ? (
                    <ChatCircleDots size={20} weight="fill" />
                  ) : sidebarView === 'tasks' ? (
                    <ListChecks size={20} weight="fill" />
                  ) : sidebarView === 'resources' ? (
                    <BookmarkSimple size={20} weight="fill" />
                  ) : (
                    <Bell size={20} weight="fill" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarView('chat')
                    handleToggleRightSidebar()
                  }}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, () => {
                      setSidebarView('chat')
                      handleToggleRightSidebar()
                    })
                  }
                  aria-label="Chat Student"
                  className="w-10 h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white"
                  tabIndex={0}
                >
                  <ChatCircleDots size={20} weight="fill" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarView('tasks')
                    handleToggleRightSidebar()
                  }}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, () => {
                      setSidebarView('tasks')
                      handleToggleRightSidebar()
                    })
                  }
                  aria-label="Task Manager"
                  className="w-10 h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white"
                  tabIndex={0}
                >
                  <ListChecks size={20} weight="fill" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarView('resources')
                    handleToggleRightSidebar()
                  }}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, () => {
                      setSidebarView('resources')
                      handleToggleRightSidebar()
                    })
                  }
                  aria-label="Resources"
                  className="w-10 h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white"
                  tabIndex={0}
                >
                  <BookmarkSimple size={20} weight="fill" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarView('events')
                    handleToggleRightSidebar()
                  }}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, () => {
                      setSidebarView('events')
                      handleToggleRightSidebar()
                    })
                  }
                  aria-label="Events & Announcements"
                  className="w-10 h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white"
                  tabIndex={0}
                >
                  <Bell size={20} weight="fill" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleRightSidebar}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, handleToggleRightSidebar)
                  }
                  aria-label="Expand sidebar"
                  className="w-10 h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white"
                  tabIndex={0}
                >
                  <CaretRight size={20} weight="bold" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white text-blue-900 flex items-center justify-center rounded-lg">
                    {sidebarView === 'chat' ? (
                      <ChatCircleDots size={20} weight="fill" />
                    ) : sidebarView === 'tasks' ? (
                      <ListChecks size={20} weight="fill" />
                    ) : sidebarView === 'resources' ? (
                      <BookmarkSimple size={20} weight="fill" />
                    ) : (
                      <Bell size={20} weight="fill" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSidebarView('chat')}
                    onKeyDown={(event) =>
                      handleToggleKeyDown(event, () => setSidebarView('chat'))
                    }
                    aria-label="Chat Student"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white ${
                      sidebarView === 'chat'
                        ? 'border-white/40 text-white hover:bg-white/20 bg-white/20'
                        : 'border-white/20 text-white/60 hover:bg-white/10'
                    }`}
                    tabIndex={0}
                  >
                    <ChatCircleDots size={18} weight="fill" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarView('tasks')}
                    onKeyDown={(event) =>
                      handleToggleKeyDown(event, () => setSidebarView('tasks'))
                    }
                    aria-label="Task Manager"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white ${
                      sidebarView === 'tasks'
                        ? 'border-white/40 text-white hover:bg-white/20 bg-white/20'
                        : 'border-white/20 text-white/60 hover:bg-white/10'
                    }`}
                    tabIndex={0}
                  >
                    <ListChecks size={18} weight="fill" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarView('resources')}
                    onKeyDown={(event) =>
                      handleToggleKeyDown(event, () =>
                        setSidebarView('resources')
                      )
                    }
                    aria-label="Resources"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white ${
                      sidebarView === 'resources'
                        ? 'border-white/40 text-white hover:bg-white/20 bg-white/20'
                        : 'border-white/20 text-white/60 hover:bg-white/10'
                    }`}
                    tabIndex={0}
                  >
                    <BookmarkSimple size={18} weight="fill" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarView('events')}
                    onKeyDown={(event) =>
                      handleToggleKeyDown(event, () => setSidebarView('events'))
                    }
                    aria-label="Events & Announcements"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white ${
                      sidebarView === 'events'
                        ? 'border-white/40 text-white hover:bg-white/20 bg-white/20'
                        : 'border-white/20 text-white/60 hover:bg-white/10'
                    }`}
                    tabIndex={0}
                  >
                    <Bell size={18} weight="fill" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleRightSidebar}
                    onKeyDown={(event) =>
                      handleToggleKeyDown(event, handleToggleRightSidebar)
                    }
                    aria-label="Collapse sidebar"
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/40 text-white transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                    tabIndex={0}
                  >
                    <CaretRight size={18} weight="bold" />
                  </button>
                </div>
              </>
            )}
          </div>

          {isRightCollapsed ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-3">
              {(sidebarView === 'chat' ||
                sidebarView === 'tasks' ||
                sidebarView === 'events' ||
                sidebarView === 'resources') && (
                <button
                  type="button"
                  onClick={handleToggleRightSidebar}
                  className="w-12 h-12 bg-white text-blue-900 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
                  aria-label={
                    sidebarView === 'chat'
                      ? 'Expand chat'
                      : sidebarView === 'tasks'
                      ? 'Expand tasks'
                      : sidebarView === 'resources'
                      ? 'Expand resources'
                      : 'Expand events'
                  }
                  tabIndex={0}
                >
                  {sidebarView === 'chat' ? (
                    <ChatCircleDots size={24} weight="fill" />
                  ) : sidebarView === 'tasks' ? (
                    <ListChecks size={24} weight="fill" />
                  ) : sidebarView === 'resources' ? (
                    <BookmarkSimple size={24} weight="fill" />
                  ) : (
                    <Bell size={24} weight="fill" />
                  )}
                </button>
              )}
            </div>
          ) : sidebarView === 'tasks' ? (
            registrar && <TaskManager registrarUid={registrar.uid} />
          ) : sidebarView === 'events' ? (
            registrar && (
              <EventsSidebar
                level={null}
                userId={registrar.uid}
                isCollapsed={isRightCollapsed}
                onToggleCollapse={handleToggleRightSidebar}
                hideHeader={true}
              />
            )
          ) : sidebarView === 'resources' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 space-y-3 relative">
                <input
                  type="text"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  aria-label="Search resources"
                />
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="text-xs text-blue-900/70"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {activeResourceTag
                      ? `Filter: ${activeResourceTag}`
                      : 'Filter: All resources'}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setShowResourceFilterDropdown((prev) => !prev)
                      }
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                        activeResourceTag
                          ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                          : 'bg-white text-blue-900 border border-blue-200 hover:border-blue-400'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      aria-expanded={showResourceFilterDropdown}
                    >
                      <FunnelSimple size={14} weight="bold" />
                      Filter
                      {activeResourceTag && (
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                      )}
                    </button>

                    {showResourceFilterDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setShowResourceFilterDropdown(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-blue-100 shadow-lg rounded-xl z-30 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4
                              className="text-sm font-medium text-blue-900"
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: 500,
                              }}
                            >
                              Filter by tag
                            </h4>
                            <button
                              type="button"
                              onClick={() =>
                                setShowResourceFilterDropdown(false)
                              }
                              className="text-blue-900/60 hover:text-blue-900"
                              aria-label="Close filters"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveResourceTag(null)
                                setShowResourceFilterDropdown(false)
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${
                                activeResourceTag === null
                                  ? 'bg-blue-900 text-white border-blue-900'
                                  : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              All
                            </button>
                            {resourceTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  setActiveResourceTag(tag)
                                  setShowResourceFilterDropdown(false)
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs border transition-all duration-200 ${
                                  activeResourceTag === tag
                                    ? 'bg-blue-900 text-white border-blue-900'
                                    : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400'
                                }`}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                                aria-pressed={activeResourceTag === tag}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-5 space-y-3">
                {filteredResources.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-blue-100 rounded-xl">
                    <p
                      className="text-sm text-blue-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      No resources match your search.
                    </p>
                  </div>
                ) : (
                  filteredResources.map((resource) => (
                    <button
                      key={resource.id}
                      type="button"
                      onClick={() => handleSelectResource(resource)}
                      className="w-full text-left rounded-xl border border-blue-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 aspect-square rounded-full"
                                style={{ backgroundColor: resource.color }}
                                aria-hidden="true"
                              ></span>
                              <h3
                                className="text-sm font-medium text-blue-900"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {resource.title}
                              </h3>
                            </div>
                            <BookmarkSimple
                              size={16}
                              weight="fill"
                              className="text-blue-900"
                              aria-hidden="true"
                            />
                          </div>
                          <p
                            className="text-xs text-blue-900/80"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {resource.summary}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {resource.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-100"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : sidebarView === 'chat' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm"
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 300,
                  }}
                />
              </div>
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
                {contactsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm animate-pulse"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-blue-100"></div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-100 border-2 border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="h-4 bg-blue-100 rounded w-32"></div>
                              <div className="h-5 w-5 bg-blue-100 rounded-lg"></div>
                            </div>
                            <div className="h-3 bg-blue-50 rounded w-3/4"></div>
                            <div className="h-3 bg-blue-50 rounded w-2/3"></div>
                            <div className="h-2 bg-blue-50 rounded w-20"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  (() => {
                    // Filter contacts based on search query
                    const filteredContacts = contacts.filter((contact) => {
                      if (!searchQuery.trim()) return true

                      const query = searchQuery.toLowerCase().trim()
                      const name = contact.name.toLowerCase()
                      const email = contact.email.toLowerCase()
                      const gradeLevel = contact.gradeLevel?.toString() || ''
                      const courseCode = contact.courseCode?.toLowerCase() || ''
                      const courseName = contact.courseName?.toLowerCase() || ''
                      const strand = contact.strand?.toLowerCase() || ''
                      const department = contact.department?.toLowerCase() || ''

                      return (
                        name.includes(query) ||
                        email.includes(query) ||
                        gradeLevel.includes(query) ||
                        courseCode.includes(query) ||
                        courseName.includes(query) ||
                        strand.includes(query) ||
                        department.includes(query) ||
                        (contact.gradeLevel &&
                          `grade ${contact.gradeLevel}`.includes(query)) ||
                        (contact.courseCode &&
                          contact.courseCode.toLowerCase().includes(query))
                      )
                    })

                    if (filteredContacts.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <UsersIcon
                              size={32}
                              className="text-white"
                              weight="duotone"
                            />
                          </div>
                          <p
                            className="text-sm text-black"
                            style={{ fontFamily: 'monospace', fontWeight: 300 }}
                          >
                            {searchQuery.trim()
                              ? 'No students found'
                              : 'No enrolled students'}
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-3">
                        {filteredContacts.map((contact, index) => {
                          const isNew =
                            previousContacts.current.length > 0 &&
                            !previousContacts.current.find(
                              (c) => c.uid === contact.uid
                            )
                          const animationDelay = isNew ? 0 : index * 50

                          return (
                            <div
                              key={contact.uid}
                              className={`bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${
                                isNew ? 'animate-slide-up' : ''
                              }`}
                              style={{
                                animationDelay: `${animationDelay}ms`,
                                fontFamily: 'Poppins',
                              }}
                              onClick={() => handleContactClick(contact)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleContactClick(contact)
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              aria-label={`Chat with ${contact.name}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative flex-shrink-0">
                                  {(() => {
                                    const getColorClass = (color?: string) => {
                                      const colorMap: Record<string, string> = {
                                        'blue-900': 'bg-blue-900',
                                        'red-800': 'bg-red-800',
                                        'emerald-800': 'bg-emerald-800',
                                        'yellow-800': 'bg-yellow-800',
                                        'orange-800': 'bg-orange-800',
                                        'violet-800': 'bg-violet-800',
                                        'purple-800': 'bg-purple-800',
                                      }
                                      return color && colorMap[color]
                                        ? colorMap[color]
                                        : 'bg-gradient-to-br from-blue-800 to-blue-900'
                                    }
                                    return (
                                      <>
                                        <div
                                          className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${getColorClass(
                                            contact.color
                                          )}`}
                                        >
                                          {contact.photoURL ? (
                                            <img
                                              src={contact.photoURL}
                                              alt={contact.name}
                                              className="w-12 h-12 rounded-full object-cover"
                                            />
                                          ) : (
                                            <span className="text-white text-lg font-medium">
                                              {contact.name
                                                .charAt(0)
                                                .toUpperCase()}
                                            </span>
                                          )}
                                        </div>
                                        {contact.color && (
                                          <div
                                            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${getColorClass(
                                              contact.color
                                            )}`}
                                          />
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3
                                      className="text-sm font-medium text-black truncate"
                                      style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 500,
                                      }}
                                    >
                                      {contact.name}
                                    </h3>
                                    {contact.unreadCount > 0 && (
                                      <span
                                        className="bg-blue-900 text-white text-xs font-medium px-2 py-0.5 rounded-lg flex-shrink-0"
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {contact.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className="text-xs text-black truncate mb-1"
                                    style={{
                                      fontFamily: 'monospace',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {contact.department === 'college' &&
                                    contact.courseCode
                                      ? contact.courseCode
                                      : contact.gradeLevel
                                      ? `Grade ${contact.gradeLevel}${
                                          contact.department === 'SHS' &&
                                          contact.strand
                                            ? ` - ${contact.strand}`
                                            : ''
                                        }`
                                      : 'Not enrolled'}
                                  </p>
                                  {contact.lastMessage && (
                                    <p
                                      className="text-xs text-black truncate mb-1"
                                      style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 300,
                                      }}
                                    >
                                      {contact.lastMessage}
                                    </p>
                                  )}
                                  {contact.lastMessageAt && (
                                    <p
                                      className="text-[10px] text-black"
                                      style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 300,
                                      }}
                                    >
                                      {(() => {
                                        try {
                                          const date = new Date(
                                            contact.lastMessageAt
                                          )
                                          if (isNaN(date.getTime())) {
                                            return ''
                                          }
                                          return date.toLocaleDateString(
                                            'en-US',
                                            {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            }
                                          )
                                        } catch {
                                          return ''
                                        }
                                      })()}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0 flex items-center">
                                  <PaperPlaneTilt
                                    size={18}
                                    className="text-blue-900"
                                    weight="fill"
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()
                )}
              </div>
            </div>
          ) : null}
        </aside>
      )}

      {/* Profile Modal */}
      {registrar && (
        <RegistrarProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          registrar={registrar}
          onUpdate={handleProfileUpdate}
        />
      )}

      {isResourceModalOpen && selectedResource && (
        <div className="fixed inset-0 z-30 flex items-center justify-center px-4 sm:px-6">
          <div
            className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"
            onClick={handleCloseResourceModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-10 rounded-full"
                  style={{ backgroundColor: selectedResource.color }}
                />
                <div>
                  <p
                    className="text-xs uppercase tracking-wide opacity-80"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Resource
                  </p>
                  <h3
                    className="text-lg font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {selectedResource.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseResourceModal}
                className="px-3 py-1.5 rounded-lg border border-white/30 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Close
              </button>
            </div>
            <div className="px-6 pt-4 pb-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedResource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-100"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p
                className="text-sm text-blue-900/80"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {selectedResource.summary}
              </p>
              {selectedResource.pages && selectedResource.pages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-900/70 font-medium">
                        Page {resourcePage + 1} of{' '}
                        {selectedResource.pages.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setResourcePage((prev) => Math.max(prev - 1, 0))
                        }
                        disabled={resourcePage === 0}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-200 ${
                          resourcePage === 0
                            ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400'
                        }`}
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setResourcePage((prev) =>
                            Math.min(
                              prev + 1,
                              selectedResource.pages.length - 1
                            )
                          )
                        }
                        disabled={
                          resourcePage === selectedResource.pages.length - 1
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-200 ${
                          resourcePage === selectedResource.pages.length - 1
                            ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400'
                        }`}
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4
                      className="text-sm font-medium text-blue-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {selectedResource.pages[resourcePage]?.heading}
                    </h4>
                    <div className="space-y-2">
                      {selectedResource.pages[resourcePage]?.content.map(
                        (detail, index) => (
                          <div
                            key={`${selectedResource.id}-page-${resourcePage}-detail-${index}`}
                            className="flex items-start gap-3"
                          >
                            <span className="w-6 h-6 aspect-square rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <p
                              className="text-sm text-blue-900"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {detail}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
