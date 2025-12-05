'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { toast } from 'react-toastify'
import {
  GraduationCap,
  Plus,
  User,
  Envelope,
  Phone,
  MapPin,
  BookOpen,
  Users,
  Eye,
  EyeSlash,
  Calendar,
  Gear,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash,
  Circle,
  UserPlus,
  Lock,
  X,
  Printer,
} from '@phosphor-icons/react'
import TeacherAssignmentModal from './teacher-assignment-modal'
import TeacherSchedulePrintModal from './teacher-schedule-print'

const TeacherManagementSkeleton = () => {
  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/40" />
            <div className="space-y-2">
              <div className="h-5 bg-white/60 rounded w-40" />
              <div className="h-3 bg-white/40 rounded w-56" />
            </div>
          </div>
          <div className="h-10 w-36 rounded-lg bg-white/30" />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center animate-pulse">
        <div className="h-10 bg-gray-100 rounded-lg flex-1" />
        <div className="flex gap-2 w-full sm:w-auto">
          {[1, 2].map((chip) => (
            <div
              key={`chip-${chip}`}
              className="h-9 w-20 rounded-lg bg-gray-100"
            />
          ))}
        </div>
        <div className="h-4 w-48 rounded bg-gray-100" />
      </div>

      <div className="border border-blue-100 rounded-xl shadow-sm">
        <div className="p-4 bg-gradient-to-br from-blue-900 to-blue-800 animate-pulse" />
        <div className="divide-y divide-blue-50">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={`teacher-row-${row}`}
              className="grid grid-cols-5 gap-4 p-4 animate-pulse"
            >
              {[1, 2, 3, 4, 5].map((col) => (
                <div
                  key={`teacher-col-${row}-${col}`}
                  className="h-4 bg-gray-100 rounded"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface TeacherManagementProps {
  registrarUid: string
}

interface Teacher {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  extension?: string
  email: string
  phone: string
  createdAt: string
  updatedAt: string
  uid?: string // Firebase user ID
  status?: 'active' | 'inactive' // Account status
  permissions?: string[] // Allowed dashboard tabs/sections
}

// Teacher Action Menu Component
interface TeacherActionMenuProps {
  teacher: Teacher
  loading: boolean
  onEdit: () => void
  onAssign: () => void
  onShowAssignments: () => void
  onPermissions: () => void
  onPrintSchedule: () => void
  onRemove: () => void
}

const TeacherActionMenu = ({
  teacher,
  loading,
  onEdit,
  onAssign,
  onShowAssignments,
  onPermissions,
  onPrintSchedule,
  onRemove,
}: TeacherActionMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsMenuOpen(false)
        }
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Calculate position for dropdown
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setMenuPosition({
          top: rect.bottom + window.scrollY + 4,
          right: window.innerWidth - rect.right - window.scrollX,
        })
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleMenuAction = (action: () => void) => {
    action()
    setIsMenuOpen(false)
  }

  const dropdownContent = isMenuOpen ? (
    <div
      ref={menuRef}
      className="fixed w-48 bg-white border border-gray-200 shadow-lg rounded-lg z-[100]"
      style={{
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
      }}
    >
      <div className="py-1">
        <button
          onClick={() => handleMenuAction(onEdit)}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Pencil size={14} className="text-blue-900" />
          <span className="text-gray-900">Edit</span>
        </button>
        <button
          onClick={() => handleMenuAction(onAssign)}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <UserPlus size={14} className="text-blue-900" />
          <span className="text-gray-900">Assign</span>
        </button>
        <button
          onClick={() => handleMenuAction(onShowAssignments)}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <BookOpen size={14} className="text-blue-900" />
          <span className="text-gray-900">Show Assignments</span>
        </button>
        <button
          onClick={() => handleMenuAction(onPrintSchedule)}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Printer size={14} className="text-blue-900" />
          <span className="text-gray-900">Print Schedule</span>
        </button>
        <button
          onClick={() => handleMenuAction(onPermissions)}
          className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Lock size={14} className="text-blue-900" />
          <span className="text-gray-900">Permissions</span>
        </button>
        <div className="border-t border-gray-200 my-1"></div>
        <button
          onClick={() => handleMenuAction(onRemove)}
          className="w-full px-4 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 rounded-lg transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Trash size={14} className="text-red-600" />
          <span className="text-red-600">Remove</span>
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      <div className="relative flex justify-end">
        <Button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          size="sm"
          variant="ghost"
          className="rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center gap-2 justify-center"
          disabled={loading}
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Gear size={16} weight="fill" className="text-blue-900" />
          <span className="text-xs text-blue-900">Settings</span>
        </Button>
      </div>
      {typeof window !== 'undefined' && dropdownContent
        ? createPortal(dropdownContent, document.body)
        : null}
    </>
  )
}

// Helper functions defined outside component for better scoping
const sendPasswordResetEmail = async (teacher: Teacher): Promise<void> => {
  if (!teacher.uid) {
    toast.error('Teacher UID not found')
    return
  }

  try {
    const response = await fetch('/api/teachers/send-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid: teacher.uid }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to send password reset email')
    }

    toast.success('Password reset email sent successfully!')
  } catch (error: any) {
    console.error('Error sending password reset email:', error)
    toast.error(error.message)
  }
}

const changePassword = (teacher: Teacher): void => {
  if (!teacher.uid) {
    toast.error('Teacher UID not found')
    return
  }

  // This function is now handled by the onClick in the component
  // The actual modal opening is done in the component
}

export default function TeacherManagement({
  registrarUid,
}: TeacherManagementProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showAssignmentsViewModal, setShowAssignmentsViewModal] =
    useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [passwordTeacher, setPasswordTeacher] = useState<Teacher | null>(null)
  const [assignmentTeacher, setAssignmentTeacher] = useState<Teacher | null>(
    null
  )
  const [assignmentsViewTeacher, setAssignmentsViewTeacher] =
    useState<Teacher | null>(null)
  const [permissionsTeacher, setPermissionsTeacher] = useState<Teacher | null>(
    null
  )
  const [printTeacher, setPrintTeacher] = useState<Teacher | null>(null)
  const [showPrintScheduleModal, setShowPrintScheduleModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<string>('a-z')

  // Filtered and sorted teachers
  const filteredAndSortedTeachers = (() => {
    // Filter teachers
    let filtered = teachers

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((teacher) => {
        const fullName = `${teacher.firstName} ${teacher.middleName || ''} ${
          teacher.lastName
        } ${teacher.extension || ''}`
          .trim()
          .toLowerCase()
        const email = teacher.email.toLowerCase()
        const phone = teacher.phone.toLowerCase()

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query)
        )
      })
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'a-z':
          const nameA = `${a.firstName} ${a.middleName || ''} ${a.lastName} ${
            a.extension || ''
          }`
            .trim()
            .toLowerCase()
          const nameB = `${b.firstName} ${b.middleName || ''} ${b.lastName} ${
            b.extension || ''
          }`
            .trim()
            .toLowerCase()
          return nameA.localeCompare(nameB)

        case 'z-a':
          const nameARev = `${a.firstName} ${a.middleName || ''} ${
            a.lastName
          } ${a.extension || ''}`
            .trim()
            .toLowerCase()
          const nameBRev = `${b.firstName} ${b.middleName || ''} ${
            b.lastName
          } ${b.extension || ''}`
            .trim()
            .toLowerCase()
          return nameBRev.localeCompare(nameARev)

        default:
          return 0
      }
    })

    return sorted
  })()

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teachers')
      if (!response.ok) {
        throw new Error('Failed to load teachers')
      }
      const data = await response.json()
      const teachersData = data.teachers || []

      // Check Firebase account status for each teacher
      const teachersWithStatus = await Promise.all(
        teachersData.map(async (teacher: Teacher) => {
          if (teacher.uid) {
            try {
              const statusResponse = await fetch(
                `/api/teachers/status?uid=${teacher.uid}`
              )
              if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                return {
                  ...teacher,
                  status: statusData.disabled ? 'inactive' : 'active',
                }
              }
            } catch (error) {
              console.warn(
                `Failed to get status for teacher ${teacher.uid}:`,
                error
              )
            }
          }
          // Default to active if we can't determine status
          return {
            ...teacher,
            status: 'active' as const,
          }
        })
      )

      setTeachers(teachersWithStatus)
    } catch (error) {
      console.error('Error loading teachers:', error)
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeacher = () => {
    setEditingTeacher(null)
    setShowCreateModal(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setShowCreateModal(true)
  }

  const handleAssignTeacher = (teacher: Teacher) => {
    setAssignmentTeacher(teacher)
    setShowAssignmentModal(true)
  }

  const handleShowAssignments = (teacher: Teacher) => {
    setAssignmentsViewTeacher(teacher)
    setShowAssignmentsViewModal(true)
  }

  const handlePermissionsTeacher = (teacher: Teacher) => {
    setPermissionsTeacher(teacher)
    setShowPermissionsModal(true)
  }

  const handlePrintScheduleTeacher = (teacher: Teacher) => {
    setPrintTeacher(teacher)
    setShowPrintScheduleModal(true)
  }

  const handleCancel = () => {
    setShowCreateModal(false)
    setEditingTeacher(null)
  }

  const handleAssignmentModalClose = () => {
    setShowAssignmentModal(false)
    setAssignmentTeacher(null)
  }

  const handleAssignmentsViewModalClose = () => {
    setShowAssignmentsViewModal(false)
    setAssignmentsViewTeacher(null)
  }

  const handlePermissionsModalClose = () => {
    setShowPermissionsModal(false)
    setPermissionsTeacher(null)
  }

  const handlePasswordModalCancel = () => {
    setShowPasswordModal(false)
    setPasswordTeacher(null)
  }

  const handlePasswordChange = async (formData: any) => {
    if (!passwordTeacher?.uid) {
      toast.error('Teacher UID not found')
      return
    }

    try {
      const response = await fetch('/api/teachers/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: passwordTeacher.uid,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('Password changed successfully!')
      setShowPasswordModal(false)
      setPasswordTeacher(null)
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message)
    }
  }

  const handleCreateTeacherSubmit = async (teacherData: any) => {
    try {
      // First create Firebase user account
      const authResponse = await fetch('/api/auth/teacher-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: teacherData.email,
          password: teacherData.password,
          firstName: teacherData.firstName,
          middleName: teacherData.middleName,
          lastName: teacherData.lastName,
          extension: teacherData.extension,
          phone: teacherData.phone,
          registrarUid,
        }),
      })

      if (!authResponse.ok) {
        const authData = await authResponse.json()
        throw new Error(authData.error || 'Failed to create teacher account')
      }

      const authData = await authResponse.json()

      // Refresh teachers list
      await loadTeachers()
      setShowCreateModal(false)
    } catch (error: any) {
      console.error('Error creating teacher:', error)
      toast.error(error.message)
    }
  }

  const handleEditTeacherSubmit = async (teacherData: any) => {
    if (!editingTeacher) return

    try {
      // Update teacher data via API
      const response = await fetch(`/api/teachers/${editingTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: teacherData.firstName,
          middleName: teacherData.middleName,
          lastName: teacherData.lastName,
          extension: teacherData.extension,
          phone: teacherData.phone,
          // Note: Email and password updates would require special handling
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update teacher account')
      }

      // Refresh teachers list
      await loadTeachers()
      setShowCreateModal(false)
      setEditingTeacher(null)
    } catch (error: any) {
      console.error('Error updating teacher:', error)
      toast.error(error.message)
    }
  }

  // Function to handle password modal opening
  const openPasswordModal = (teacher: Teacher) => {
    if (teacher.uid) {
      setPasswordTeacher(teacher)
      setShowPasswordModal(true)
    } else {
      toast.error('Teacher UID not found')
    }
  }

  if (loading) {
    return <TeacherManagementSkeleton />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
              <GraduationCap
                size={20}
                weight="fill"
                className="text-blue-900"
              />
            </div>
            <div>
              <h1
                className="text-2xl font-light text-white flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Teacher Management
              </h1>
              <p
                className="text-xs text-blue-100 mt-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Manage teachers and their subject assignments
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateTeacher}
            disabled={loading}
            className="rounded-lg bg-white hover:bg-blue-50 text-blue-900 border border-blue-200"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Plus size={16} className="mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-4 py-2 border border-blue-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'a-z', label: 'A-Z', icon: ArrowUp },
            { key: 'z-a', label: 'Z-A', icon: ArrowDown },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortOption(option.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                sortOption === option.key
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <option.icon size={12} weight="bold" />
              {option.label}
            </button>
          ))}
        </div>
        <div
          className="text-xs text-gray-600 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-3 h-3 aspect-square rounded-md bg-gradient-to-br from-blue-800 to-blue-900"></div>
          Showing {filteredAndSortedTeachers.length} of {teachers.length}{' '}
          teachers
        </div>
      </div>

      {/* Teachers Table */}
      <div className="pb-0 pt-0 mt-0 mb-0 border border-gray-200 shadow-lg rounded-xl">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg border-b border-blue-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square bg-white rounded-md flex items-center justify-center">
                      <User size={12} weight="bold" className="text-blue-900" />
                    </div>
                    Teacher
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square bg-white rounded-md flex items-center justify-center">
                      <Envelope
                        size={12}
                        weight="bold"
                        className="text-blue-900"
                      />
                    </div>
                    Contact
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square bg-white rounded-md flex items-center justify-center">
                      <Gear size={12} weight="bold" className="text-blue-900" />
                    </div>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 rounded-b-xl">
              {loading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200"></div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 bg-gray-200 w-32"></div>
                          <div className="h-3 bg-gray-200 w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="h-4 bg-gray-200 w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-end">
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredAndSortedTeachers.length === 0 &&
                teachers.length > 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    No teachers match your search.
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center border-t border-gray-200"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <GraduationCap
                          size={32}
                          className="text-white"
                          weight="fill"
                        />
                      </div>
                      <h3
                        className="text-lg font-medium text-gray-900 mb-2"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        No teachers found
                      </h3>
                      <p
                        className="text-xs text-gray-600 mb-6"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Get started by creating teacher accounts for your school
                        staff
                      </p>
                      <Button
                        onClick={handleCreateTeacher}
                        className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        <Plus size={16} className="mr-2" />
                        Add First Teacher
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedTeachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        <div className="relative flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                            <span
                              className="text-white text-xs font-medium"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {teacher.firstName.charAt(0)}
                              {teacher.lastName.charAt(0)}
                            </span>
                          </div>
                          <span
                            className={`absolute -bottom-0 -right-0 w-3 h-3 border-2 border-white ${
                              teacher.status === 'active'
                                ? 'bg-emerald-700'
                                : 'bg-red-600'
                            }`}
                            aria-label={
                              teacher.status === 'active'
                                ? 'Enabled'
                                : 'Disabled'
                            }
                          ></span>
                        </div>
                        <div className="ml-4">
                          <div
                            className="text-xs font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {teacher.firstName}{' '}
                            {teacher.middleName && `${teacher.middleName} `}
                            {teacher.lastName}
                            {teacher.extension && ` ${teacher.extension}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="space-y-1">
                        <div
                          className="text-xs text-gray-900 font-mono"
                          style={{ fontWeight: 400 }}
                        >
                          {teacher.email}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {teacher.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium relative">
                      <TeacherActionMenu
                        teacher={teacher}
                        loading={loading}
                        onEdit={() => handleEditTeacher(teacher)}
                        onAssign={() => handleAssignTeacher(teacher)}
                        onShowAssignments={() => handleShowAssignments(teacher)}
                        onPermissions={() => handlePermissionsTeacher(teacher)}
                        onPrintSchedule={() =>
                          handlePrintScheduleTeacher(teacher)
                        }
                        onRemove={() => {
                          // TODO: Implement remove functionality
                          toast.info('Remove functionality coming soon')
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Teacher Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCancel}
        title={editingTeacher ? 'Edit Teacher Account' : 'Add New Teacher'}
        size="2xl"
      >
        <TeacherForm
          onSubmit={
            editingTeacher ? handleEditTeacherSubmit : handleCreateTeacherSubmit
          }
          onCancel={handleCancel}
          loading={loading}
          teacher={editingTeacher}
          onSendPasswordResetEmail={
            editingTeacher ? sendPasswordResetEmail : undefined
          }
          onOpenPasswordModal={editingTeacher ? openPasswordModal : undefined}
        />
      </Modal>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalCancel}
        title="Change Password"
        size="md"
      >
        <PasswordChangeForm
          onSubmit={handlePasswordChange}
          onCancel={handlePasswordModalCancel}
          loading={loading}
          teacher={passwordTeacher}
        />
      </Modal>

      {/* Teacher Assignment Modal */}
      <TeacherAssignmentModal
        isOpen={showAssignmentModal}
        onClose={handleAssignmentModalClose}
        teacher={assignmentTeacher}
        registrarUid={registrarUid}
      />

      {/* Teacher Assignments View Modal */}
      <TeacherAssignmentsViewModal
        isOpen={showAssignmentsViewModal}
        onClose={handleAssignmentsViewModalClose}
        teacher={assignmentsViewTeacher}
        registrarUid={registrarUid}
      />

      {/* Permissions Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={handlePermissionsModalClose}
        title="Manage Teacher Permissions"
        size="lg"
      >
        <PermissionsForm
          teacher={permissionsTeacher}
          onCancel={handlePermissionsModalClose}
          onSave={async (permissions) => {
            if (!permissionsTeacher) return

            try {
              const response = await fetch('/api/teachers/update-permissions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  teacherId: permissionsTeacher.id,
                  permissions,
                  actorId: registrarUid,
                  actorRole: 'registrar',
                }),
              })

              if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update permissions')
              }

              toast.success('Permissions updated successfully!')
              await loadTeachers()
              handlePermissionsModalClose()
            } catch (error: any) {
              console.error('Error updating permissions:', error)
              toast.error(error.message)
            }
          }}
        />
      </Modal>

      {/* Teacher Schedule Print Modal */}
      <TeacherSchedulePrintModal
        isOpen={showPrintScheduleModal}
        onClose={() => {
          setShowPrintScheduleModal(false)
          setPrintTeacher(null)
        }}
        teacher={printTeacher}
        registrarUid={registrarUid}
      />
    </div>
  )
}

// Password Change Form Component
interface PasswordChangeFormProps {
  onSubmit: (formData: any) => void
  onCancel: () => void
  loading: boolean
  teacher: Teacher | null
}

function PasswordChangeForm({
  onSubmit,
  onCancel,
  loading,
  teacher,
}: PasswordChangeFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h4
          className="text-sm font-medium text-gray-900 mb-2"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          Change Password for {teacher?.firstName} {teacher?.lastName}
        </h4>
        <p
          className="text-xs text-gray-600"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          Enter your current password and choose a new secure password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Current Password *
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              placeholder="Enter current password"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showCurrentPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-600 mt-1">
              {errors.currentPassword}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            New Password *
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              placeholder="Enter new password"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showNewPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
          )}
        </div>

        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Confirm New Password *
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              placeholder="Confirm new password"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white text-xs font-medium transition-colors"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            disabled={loading}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Teacher Form Component
interface TeacherFormProps {
  onSubmit: (teacherData: any) => void
  onCancel: () => void
  loading: boolean
  teacher?: Teacher | null
  onSendPasswordResetEmail?: (teacher: Teacher) => void
  onOpenPasswordModal?: (teacher: Teacher) => void
}

function TeacherForm({
  onSubmit,
  onCancel,
  loading,
  teacher,
  onSendPasswordResetEmail,
  onOpenPasswordModal,
}: TeacherFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    extension: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Reset or pre-fill form when modal opens or teacher changes
  useEffect(() => {
    if (teacher) {
      // Pre-fill form for editing
      setFormData({
        firstName: teacher.firstName || '',
        middleName: teacher.middleName || '',
        lastName: teacher.lastName || '',
        extension: teacher.extension || '',
        email: teacher.email || '',
        password: '', // Don't pre-fill password for security
        confirmPassword: '',
        phone: teacher.phone || '',
      })
    } else {
      // Reset form for creating new teacher
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        extension: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
      })
    }
    setErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [teacher])

  // Phone number formatter
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')

    // If empty, return empty
    if (!digits) return ''

    // If starts with 63, keep it
    if (digits.startsWith('63')) {
      const withoutCountryCode = digits.substring(2)
      if (withoutCountryCode.length <= 10) {
        // Format as +63 XXX XXX XXXX
        const formatted = withoutCountryCode.replace(
          /(\d{3})(\d{3})(\d{4})/,
          '$1 $2 $3'
        )
        return `+63${formatted}`
      }
    }

    // If starts with 0, remove it and add +63
    if (digits.startsWith('0')) {
      const withoutZero = digits.substring(1)
      if (withoutZero.length <= 10) {
        const formatted = withoutZero.replace(
          /(\d{3})(\d{3})(\d{4})/,
          '$1 $2 $3'
        )
        return `+63${formatted}`
      }
    }

    // If doesn't start with 63 or 0, treat as local number
    if (digits.length <= 10) {
      const formatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
      return `+63${formatted}`
    }

    // If too long, truncate to 10 digits
    const truncated = digits.substring(0, 10)
    const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    return `+63${formatted}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password.trim()) newErrors.password = 'Password is required'
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData)
    }
  }

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div>
          <h4
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Personal Information
          </h4>
          <p
            className="text-xs text-blue-900 font-light text-justify border-1 shadow-sm border-blue-900 p-3 bg-white rounded-xl mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Provide the teacher's complete personal details for identification
            and contact purposes. This information helps establish their
            professional profile and enables effective communication within the
            school system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <div>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="Enter first name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  disabled={loading}
                />
              </div>
              {errors.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <div>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      middleName: e.target.value,
                    }))
                  }
                  placeholder="Enter middle name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <div>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Enter last name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  disabled={loading}
                />
              </div>
              {errors.lastName && (
                <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Extension
              </label>
              <div>
                <input
                  type="text"
                  value={formData.extension}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      extension: e.target.value,
                    }))
                  }
                  placeholder="e.g., Jr., Sr., III"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div>
          <h4
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Account Information
          </h4>
          <p
            className="text-xs text-blue-900 font-light text-justify border-1 shadow-sm border-blue-900 p-3 bg-white rounded-xl mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Set up secure login credentials for the teacher account. This
            includes email verification and password creation to ensure
            authorized access to the system and protect sensitive educational
            data.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="teacher@mcb.edu.ph"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value)
                    setFormData((prev) => ({ ...prev, phone: formatted }))
                  }}
                  placeholder="+63962 781 1434"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  disabled={loading}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Account Actions - Show for editing existing teachers */}
          {teacher && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h5
                className="text-sm font-medium text-gray-900 mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Account Management
              </h5>
            </div>
          )}

          {/* Password Fields - Only show for creating new teachers */}
          {!teacher && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter secure password"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeSlash size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={loading}
            className="px-6 py-2 rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Cancel
          </Button>

          {teacher && (
            <Button
              type="button"
              onClick={() => teacher && sendPasswordResetEmail(teacher)}
              className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
              disabled={loading}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Send Password Reset
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {teacher ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {teacher ? (
                  <Pencil size={16} className="mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                {teacher ? 'Edit Teacher' : 'Create Teacher Account'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Permissions Form Component
interface PermissionsFormProps {
  teacher: Teacher | null
  onCancel: () => void
  onSave: (permissions: string[]) => void
}

const PERMISSION_OPTIONS = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Dashboard summary',
  },
  {
    key: 'student-enrollments',
    label: 'Student Enrollments',
    description: 'Enrollment pipeline',
  },
  {
    key: 'student-management',
    label: 'Student Management',
    description: 'Academic records',
  },
  {
    key: 'course-management',
    label: 'Course Management',
    description: 'Programs catalog',
  },
  {
    key: 'grade-section-management',
    label: 'Grades & Sections',
    description: 'Section builder',
  },
  {
    key: 'subject-management',
    label: 'Subject Management',
    description: 'Curriculum tools',
  },
  {
    key: 'teacher-management',
    label: 'Teacher Management',
    description: 'Faculty overview',
  },
  {
    key: 'events-management',
    label: 'Events & Announcements',
    description: 'Content management',
  },
  {
    key: 'analytics',
    label: 'Analytics & Reports',
    description: 'Student insights',
  },
]

function PermissionsForm({ teacher, onCancel, onSave }: PermissionsFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  useEffect(() => {
    if (teacher) {
      setSelectedPermissions(teacher.permissions || [])
    } else {
      setSelectedPermissions([])
    }
  }, [teacher])

  const handleTogglePermission = (permissionKey: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionKey)) {
        return prev.filter((p) => p !== permissionKey)
      } else {
        return [...prev, permissionKey]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedPermissions.length === PERMISSION_OPTIONS.length) {
      setSelectedPermissions([])
    } else {
      setSelectedPermissions(PERMISSION_OPTIONS.map((p) => p.key))
    }
  }

  const handleSave = () => {
    onSave(selectedPermissions)
  }

  if (!teacher) {
    return (
      <div className="p-6 text-center">
        <p
          className="text-gray-600"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          No teacher selected
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h4
          className="text-sm font-medium text-gray-900 mb-2"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          Access Permissions for {teacher.firstName} {teacher.lastName}
        </h4>
        <p
          className="text-xs text-gray-600"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          Select which sections of the registrar dashboard this teacher can
          access. Only selected sections will be visible when they log in.
        </p>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-blue-900 hover:text-blue-700 font-medium"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          {selectedPermissions.length === PERMISSION_OPTIONS.length
            ? 'Deselect All'
            : 'Select All'}
        </button>
      </div>

      <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
        {PERMISSION_OPTIONS.map((option) => {
          const isSelected = selectedPermissions.includes(option.key)
          return (
            <div
              key={option.key}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-blue-900 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
              onClick={() => handleTogglePermission(option.key)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-900 bg-blue-900'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h5
                    className={`text-sm font-medium mb-1 ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {option.label}
                  </h5>
                  <p
                    className={`text-xs ${
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {option.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white text-xs font-medium transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Save Permissions
        </button>
      </div>
    </div>
  )
}

// Helper function to generate time slots in 15-minute intervals from 7:00 AM to 6:00 PM
const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  const startHour = 7 // 7 AM
  const endHour = 18 // 6 PM (18:00 in 24-hour format)
  const minutes = [0, 15, 30, 45]

  for (let hour = startHour; hour <= endHour; hour++) {
    for (const minute of minutes) {
      // Skip 6:15 PM, 6:30 PM, 6:45 PM (only go up to 6:00 PM)
      if (hour === endHour && minute > 0) break

      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const minuteStr = minute.toString().padStart(2, '0')
      slots.push(`${hour12}:${minuteStr} ${ampm}`)
    }
  }

  return slots
}

// Helper function to convert time string to minutes for comparison
const convertToMinutes = (timeStr: string): number => {
  const [time, period] = timeStr.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  let totalMinutes = hours * 60 + minutes
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60
  }
  return totalMinutes
}

// Teacher Assignments View Modal Component
interface TeacherAssignmentsViewModalProps {
  isOpen: boolean
  onClose: () => void
  teacher: Teacher | null
  registrarUid: string
}

interface AssignmentData {
  subjectId: string
  subjectCode: string
  subjectName: string
  subjectColor: string
  gradeLevel?: number
  courseCode?: string
  courseName?: string
  sections: {
    sectionId: string
    sectionName: string
    rank: string
    department: string
    startTime?: string // Format: "HH:MM AM/PM" (e.g., "8:00 AM")
    endTime?: string // Format: "HH:MM AM/PM" (e.g., "9:30 AM")
    room?: string
    deliveryMode?: 'Face to Face' | 'Modular' | 'Hybrid' | 'Online'
    dayOfWeek?:
      | (
          | 'Monday'
          | 'Tuesday'
          | 'Wednesday'
          | 'Thursday'
          | 'Friday'
          | 'Saturday'
          | 'Sunday'
        )[]
      | 'Monday'
      | 'Tuesday'
      | 'Wednesday'
      | 'Thursday'
      | 'Friday'
      | 'Saturday'
      | 'Sunday' // Support both array and single value for backward compatibility
  }[]
}

const TeacherAssignmentsViewModal = ({
  isOpen,
  onClose,
  teacher,
  registrarUid,
}: TeacherAssignmentsViewModalProps) => {
  const [assignments, setAssignments] = useState<AssignmentData[]>([])
  const [loading, setLoading] = useState(false)
  const [removingAssignments, setRemovingAssignments] = useState<
    Record<string, boolean>
  >({})
  const [editingSchedule, setEditingSchedule] = useState<{
    subjectId: string
    sectionId: string
    sectionName: string
  } | null>(null)
  const [scheduleForm, setScheduleForm] = useState<{
    dayOfWeek: (
      | 'Monday'
      | 'Tuesday'
      | 'Wednesday'
      | 'Thursday'
      | 'Friday'
      | 'Saturday'
      | 'Sunday'
    )[]
    startTime: string
    endTime: string
    room: string
    deliveryMode: 'Face to Face' | 'Modular' | 'Hybrid' | 'Online' | ''
  }>({
    dayOfWeek: [],
    startTime: '',
    endTime: '',
    room: '',
    deliveryMode: '',
  })
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([])
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [dayConflicts, setDayConflicts] = useState<Record<string, boolean>>({})
  const [resetTarget, setResetTarget] = useState<{
    subjectId: string
    sectionId: string
    sectionName: string
  } | null>(null)
  const [resetting, setResetting] = useState(false)

  // Check room conflicts for each day in real-time
  useEffect(() => {
    const checkDayConflicts = async () => {
      if (
        !editingSchedule ||
        !scheduleForm.startTime ||
        !scheduleForm.endTime ||
        scheduleForm.deliveryMode === 'Online' ||
        !scheduleForm.room ||
        !teacher?.id
      ) {
        setDayConflicts({})
        return
      }

      const conflicts: Record<string, boolean> = {}
      const allDays = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ]

      // Check conflicts for each day
      const promises = allDays.map(async (day) => {
        try {
          const conflictResponse = await fetch(
            '/api/teacher-assignments/check-conflicts',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subjectId: editingSchedule.subjectId,
                sectionId: editingSchedule.sectionId,
                teacherId: teacher.id,
                dayOfWeek: day,
                startTime: scheduleForm.startTime,
                endTime: scheduleForm.endTime,
                room: scheduleForm.room,
                deliveryMode: scheduleForm.deliveryMode,
              }),
            }
          )

          const conflictData = await conflictResponse.json()
          if (
            conflictData.conflicts &&
            conflictData.conflicts.some((c: string) =>
              c.toLowerCase().includes('room')
            )
          ) {
            conflicts[day] = true
          }
        } catch (error) {
          console.error('Error checking conflict for day:', day, error)
        }
      })

      await Promise.all(promises)
      setDayConflicts(conflicts)
    }

    // Debounce conflict checking
    const timeoutId = setTimeout(() => {
      if (
        editingSchedule &&
        scheduleForm.startTime &&
        scheduleForm.endTime &&
        scheduleForm.room &&
        scheduleForm.deliveryMode !== 'Online'
      ) {
        checkDayConflicts()
      } else {
        setDayConflicts({})
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [
    editingSchedule?.subjectId,
    editingSchedule?.sectionId,
    scheduleForm.startTime,
    scheduleForm.endTime,
    scheduleForm.room,
    scheduleForm.deliveryMode,
    teacher?.id,
  ])

  useEffect(() => {
    if (isOpen && teacher) {
      loadAssignments()
    } else {
      setAssignments([])
    }
  }, [isOpen, teacher])

  const loadAssignments = async () => {
    if (!teacher) return

    try {
      setLoading(true)
      // Fetch teacher assignments
      const assignmentsResponse = await fetch(
        `/api/teacher-assignments?teacherId=${encodeURIComponent(teacher.id)}`
      )
      if (!assignmentsResponse.ok) {
        throw new Error('Failed to load assignments')
      }
      const assignmentsData = await assignmentsResponse.json()
      const teacherAssignments: Record<string, any> =
        assignmentsData.assignments || {}

      // Fetch all subjects to get details
      const subjectsResponse = await fetch('/api/subjects')
      if (!subjectsResponse.ok) {
        throw new Error('Failed to load subjects')
      }
      const subjectsData = await subjectsResponse.json()
      const subjects = subjectsData.subjects || []

      // Fetch all sections to get details
      const sectionsResponse = await fetch('/api/sections')
      if (!sectionsResponse.ok) {
        throw new Error('Failed to load sections')
      }
      const sectionsData = await sectionsResponse.json()
      const sections = sectionsData.sections || []

      // Fetch all courses to get course names
      const coursesResponse = await fetch('/api/courses')
      const coursesData = coursesResponse.ok
        ? await coursesResponse.json()
        : { courses: [] }
      const courses = coursesData.courses || []

      // Organize assignments by subject
      const organizedAssignments: AssignmentData[] = []

      for (const [subjectId, sectionIds] of Object.entries(
        teacherAssignments
      )) {
        const subject = subjects.find((s: any) => s.id === subjectId)
        if (!subject) continue

        const sectionDetails = (Array.isArray(sectionIds) ? sectionIds : [])
          .map((sectionId: string) => {
            const section = sections.find((s: any) => s.id === sectionId)
            if (!section) return null

            // Get schedule data from assignment
            let scheduleData: {
              startTime?: string
              endTime?: string
              room?: string
              deliveryMode?: 'Face to Face' | 'Modular' | 'Hybrid' | 'Online'
              dayOfWeek?: (
                | 'Monday'
                | 'Tuesday'
                | 'Wednesday'
                | 'Thursday'
                | 'Friday'
                | 'Saturday'
                | 'Sunday'
              )[]
            } = {}

            // Get assignment data from subject's teacherAssignments
            const assignmentData = (subject.teacherAssignments as any)?.[
              sectionId
            ]
            if (assignmentData) {
              if (Array.isArray(assignmentData)) {
                // Old format: just teacher IDs, no schedule
              } else if (
                typeof assignmentData === 'object' &&
                'schedule' in assignmentData
              ) {
                const dayOfWeek = assignmentData.schedule?.dayOfWeek
                scheduleData = {
                  startTime: assignmentData.schedule?.startTime,
                  endTime: assignmentData.schedule?.endTime,
                  room: assignmentData.schedule?.room,
                  deliveryMode: assignmentData.schedule?.deliveryMode,
                  dayOfWeek: Array.isArray(dayOfWeek)
                    ? dayOfWeek
                    : dayOfWeek
                    ? [dayOfWeek]
                    : undefined,
                }
              }
            }

            return {
              sectionId: section.id,
              sectionName: section.sectionName,
              rank: section.rank || '',
              department: section.department || '',
              ...scheduleData,
            }
          })
          .filter((s): s is NonNullable<typeof s> => s !== null)

        if (sectionDetails.length > 0) {
          // Find course name if it's a college subject
          let courseName: string | undefined
          if (subject.courseCodes && subject.courseCodes.length > 0) {
            const course = courses.find(
              (c: any) => c.code === subject.courseCodes[0]
            )
            courseName = course?.name
          }

          organizedAssignments.push({
            subjectId: subject.id,
            subjectCode: subject.code || '',
            subjectName: subject.name || '',
            subjectColor: subject.color || 'blue-900',
            gradeLevel: subject.gradeLevel,
            courseCode: subject.courseCodes?.[0],
            courseName,
            sections: sectionDetails,
          })
        }
      }

      // Sort by subject code
      organizedAssignments.sort((a, b) =>
        a.subjectCode.localeCompare(b.subjectCode)
      )

      setAssignments(organizedAssignments)
    } catch (error) {
      console.error('Error loading assignments:', error)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  if (!teacher) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assignments - ${teacher.firstName} ${teacher.lastName}`}
      size="2xl"
    >
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen
              size={48}
              className="mx-auto text-gray-400 mb-4"
              weight="duotone"
            />
            <h3
              className="text-lg font-medium text-gray-900 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              No Assignments
            </h3>
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              This teacher has no subject assignments yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.subjectId}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white"
              >
                {/* Subject Header */}
                <div className="flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-block h-3 w-3 rounded"
                        style={{
                          backgroundColor: getColorValue(
                            assignment.subjectColor
                          ),
                        }}
                        aria-hidden="true"
                      />
                      <BookOpen
                        size={16}
                        style={{
                          color: getColorValue(assignment.subjectColor),
                        }}
                        weight="fill"
                      />
                      <h4
                        className="text-sm font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {assignment.subjectCode} - {assignment.subjectName}
                      </h4>
                    </div>
                    {assignment.gradeLevel && (
                      <p
                        className="text-xs text-gray-600 ml-5"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Grade {assignment.gradeLevel}
                      </p>
                    )}
                    {assignment.courseCode && (
                      <p
                        className="text-xs text-gray-600 ml-5"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {assignment.courseCode}
                        {assignment.courseName && ` - ${assignment.courseName}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {assignment.sections.length} section
                      {assignment.sections.length !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={async () => {
                        if (!teacher) return
                        const assignmentKey = `${assignment.subjectId}-all`
                        setRemovingAssignments((prev) => ({
                          ...prev,
                          [assignmentKey]: true,
                        }))

                        try {
                          let removed = 0
                          const errors: string[] = []

                          for (const section of assignment.sections) {
                            const url = `/api/teacher-assignments?subjectId=${encodeURIComponent(
                              assignment.subjectId
                            )}&sectionId=${encodeURIComponent(
                              section.sectionId
                            )}&registrarUid=${encodeURIComponent(
                              registrarUid
                            )}&teacherId=${encodeURIComponent(teacher.id)}`
                            const res = await fetch(url, { method: 'DELETE' })
                            const data = await res.json().catch(() => ({}))
                            if (res.ok) {
                              removed++
                            } else {
                              errors.push(
                                `${section.sectionName}: ${
                                  data.error || 'Failed to remove'
                                }`
                              )
                            }
                          }

                          if (removed > 0) {
                            toast.success(
                              `Removed ${removed} assignment(s) for ${assignment.subjectName}`
                            )
                            // Reload assignments
                            await loadAssignments()
                          }
                          if (errors.length > 0) {
                            toast.warning(
                              `Some removals failed: ${errors.join(', ')}`
                            )
                          }
                        } catch (error) {
                          console.error('Error removing assignments:', error)
                          toast.error('Failed to remove assignments')
                        } finally {
                          setRemovingAssignments((prev) => {
                            const copy = { ...prev }
                            delete copy[assignmentKey]
                            return copy
                          })
                        }
                      }}
                      disabled={
                        removingAssignments[`${assignment.subjectId}-all`]
                      }
                      className="px-2 py-1 border-2 text-xs rounded-lg flex items-center gap-1 border-red-600 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {removingAssignments[`${assignment.subjectId}-all`] ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash size={14} />
                          Remove All
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sections Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-r border-gray-300"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-gray-600" />
                            Sections
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-r border-gray-300"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-600" />
                            Start
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-r border-gray-300"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-600" />
                            End
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-r border-gray-300"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-600" />
                            Days
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-r border-gray-300"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-600" />
                            Room
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-r border-gray-300"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          <div className="flex items-center gap-2">
                            Delivery Mode
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-300"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <Gear size={14} className="text-gray-600" />
                            Actions
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {assignment.sections.map((section) => (
                        <tr
                          key={section.sectionId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 border-b border-r border-gray-200 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <Users
                                size={16}
                                style={{
                                  color: getColorValue(assignment.subjectColor),
                                }}
                                weight="fill"
                              />
                              <div>
                                <p
                                  className="text-xs font-medium text-gray-900"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 500,
                                  }}
                                >
                                  {section.sectionName}
                                </p>
                                <p
                                  className="text-xs text-gray-600"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 300,
                                  }}
                                >
                                  {section.rank} • {section.department}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-r border-gray-200 min-w-[120px]">
                            {section.startTime ? (
                              <p
                                className="text-xs text-gray-900"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {section.startTime}
                              </p>
                            ) : (
                              <p
                                className="text-xs text-gray-400 italic"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Not set
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b border-r border-gray-200 min-w-[120px]">
                            {section.endTime ? (
                              <p
                                className="text-xs text-gray-900"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {section.endTime}
                              </p>
                            ) : (
                              <p
                                className="text-xs text-gray-400 italic"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Not set
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b border-r border-gray-200 min-w-[120px]">
                            {(() => {
                              const days = (section as any).dayOfWeek
                              if (
                                !days ||
                                (Array.isArray(days) && days.length === 0)
                              ) {
                                return (
                                  <p
                                    className="text-xs text-gray-400 italic"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 300,
                                    }}
                                  >
                                    Not set
                                  </p>
                                )
                              }

                              const dayArray: string[] = Array.isArray(days)
                                ? days
                                : [days]

                              const abbrevMap: Record<string, string> = {
                                Monday: 'Mon',
                                Tuesday: 'Tue',
                                Wednesday: 'Wed',
                                Thursday: 'Thu',
                                Friday: 'Fri',
                                Saturday: 'Sat',
                                Sunday: 'Sun',
                              }

                              const label = dayArray
                                .map((d) => abbrevMap[d] || d.slice(0, 3))
                                .join(', ')

                              return (
                                <p
                                  className="text-xs text-gray-900"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  {label}
                                </p>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-3 border-b border-r border-gray-200 min-w-[120px]">
                            {section.room ? (
                              <p
                                className="text-xs text-gray-900"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {section.room}
                              </p>
                            ) : (
                              <p
                                className="text-xs text-gray-400 italic"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                {(section as any).deliveryMode === 'Online'
                                  ? 'Online'
                                  : 'No room assigned'}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b border-r border-gray-200 min-w-[120px]">
                            {(section as any).deliveryMode ? (
                              <p
                                className="text-xs text-gray-900"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {(section as any).deliveryMode}
                              </p>
                            ) : (
                              <p
                                className="text-xs text-gray-400 italic"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Not set
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200 text-right min-w-[180px]">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingSchedule({
                                    subjectId: assignment.subjectId,
                                    sectionId: section.sectionId,
                                    sectionName: section.sectionName,
                                  })
                                  setScheduleForm({
                                    dayOfWeek: section.dayOfWeek
                                      ? Array.isArray(section.dayOfWeek)
                                        ? section.dayOfWeek
                                        : [section.dayOfWeek]
                                      : [],
                                    startTime: section.startTime || '',
                                    endTime: section.endTime || '',
                                    room: section.room || '',
                                    deliveryMode:
                                      (section as any).deliveryMode || '',
                                  })
                                  setScheduleErrors([])
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                                title="Edit schedule"
                              >
                                <Pencil size={14} weight="bold" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (!teacher) return
                                  setResetTarget({
                                    subjectId: assignment.subjectId,
                                    sectionId: section.sectionId,
                                    sectionName: section.sectionName,
                                  })
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                                title="Reset schedule (clear days, time, room, mode)"
                              >
                                <X size={14} />
                                Reset
                              </button>
                              <button
                                onClick={async () => {
                                  if (!teacher) return
                                  const sectionKey = `${assignment.subjectId}-${section.sectionId}`
                                  setRemovingAssignments((prev) => ({
                                    ...prev,
                                    [sectionKey]: true,
                                  }))

                                  try {
                                    const url = `/api/teacher-assignments?subjectId=${encodeURIComponent(
                                      assignment.subjectId
                                    )}&sectionId=${encodeURIComponent(
                                      section.sectionId
                                    )}&registrarUid=${encodeURIComponent(
                                      registrarUid
                                    )}&teacherId=${encodeURIComponent(
                                      teacher.id
                                    )}`
                                    const res = await fetch(url, {
                                      method: 'DELETE',
                                    })
                                    const data = await res
                                      .json()
                                      .catch(() => ({}))

                                    if (res.ok) {
                                      toast.success(
                                        `Removed ${section.sectionName} from ${assignment.subjectName}`
                                      )
                                      // Reload assignments
                                      await loadAssignments()
                                    } else {
                                      toast.error(
                                        data.error ||
                                          'Failed to remove assignment'
                                      )
                                    }
                                  } catch (error) {
                                    console.error(
                                      'Error removing assignment:',
                                      error
                                    )
                                    toast.error('Failed to remove assignment')
                                  } finally {
                                    setRemovingAssignments((prev) => {
                                      const copy = { ...prev }
                                      delete copy[sectionKey]
                                      return copy
                                    })
                                  }
                                }}
                                disabled={
                                  removingAssignments[
                                    `${assignment.subjectId}-${section.sectionId}`
                                  ]
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                                title="Remove this section assignment"
                              >
                                {removingAssignments[
                                  `${assignment.subjectId}-${section.sectionId}`
                                ] ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    Removing...
                                  </>
                                ) : (
                                  <>
                                    <X size={14} weight="bold" />
                                    Remove
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Edit Modal */}
      {editingSchedule && (
        <Modal
          isOpen={!!editingSchedule}
          onClose={() => {
            setEditingSchedule(null)
            setScheduleForm({
              dayOfWeek: [],
              startTime: '',
              endTime: '',
              room: '',
              deliveryMode: '',
            })
            setScheduleErrors([])
            setDayConflicts({})
          }}
          title={`Edit Schedule - ${editingSchedule.sectionName}`}
          size="md"
        >
          <div className="p-6 space-y-4">
            {/* Subject and Section Indicator */}
            {(() => {
              const assignment = assignments.find(
                (a) => a.subjectId === editingSchedule.subjectId
              )
              return (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: assignment
                          ? getColorValue(assignment.subjectColor)
                          : '#1e40af',
                      }}
                    />
                    <div>
                      <p
                        className="text-xs font-medium text-blue-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {assignment?.subjectName || 'Subject'}
                      </p>
                      <p
                        className="text-xs text-blue-700"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {editingSchedule.sectionName}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Days of Week */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-xs font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Days of Week
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const allDays: (
                      | 'Monday'
                      | 'Tuesday'
                      | 'Wednesday'
                      | 'Thursday'
                      | 'Friday'
                      | 'Saturday'
                      | 'Sunday'
                    )[] = [
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                      'Sunday',
                    ]
                    if (scheduleForm.dayOfWeek.length === allDays.length) {
                      // Deselect all
                      setScheduleForm({
                        ...scheduleForm,
                        dayOfWeek: [],
                      })
                    } else {
                      // Select all
                      setScheduleForm({
                        ...scheduleForm,
                        dayOfWeek: allDays,
                      })
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {scheduleForm.dayOfWeek.length === 7
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ].map((day) => {
                  const hasConflict = dayConflicts[day] || false
                  return (
                    <label
                      key={day}
                      className={`flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        hasConflict
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={scheduleForm.dayOfWeek.includes(day as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScheduleForm({
                              ...scheduleForm,
                              dayOfWeek: [
                                ...scheduleForm.dayOfWeek,
                                day as any,
                              ],
                            })
                          } else {
                            setScheduleForm({
                              ...scheduleForm,
                              dayOfWeek: scheduleForm.dayOfWeek.filter(
                                (d) => d !== day
                              ),
                            })
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span
                        className={`text-xs ${
                          hasConflict
                            ? 'text-red-700 font-medium'
                            : 'text-gray-700'
                        }`}
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {day}
                        {hasConflict && (
                          <span className="ml-1 text-red-600">
                            (Room taken)
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Start Time and End Time */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Start Time
                  </label>
                  <select
                    value={scheduleForm.startTime}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        startTime: e.target.value,
                        endTime: '', // Clear end time when start time changes
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <option value="">Select start time</option>
                    {generateTimeSlots().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    End Time
                  </label>
                  <select
                    value={scheduleForm.endTime}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <option value="">Select end time</option>
                    {generateTimeSlots().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Duration Buttons */}
              {scheduleForm.startTime && (
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Quick Duration
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '30 mins', minutes: 30 },
                      { label: '45 mins', minutes: 45 },
                      { label: '1 hour', minutes: 60 },
                      { label: '2 hours', minutes: 120 },
                      { label: '3 hours', minutes: 180 },
                    ].map((duration) => (
                      <button
                        key={duration.minutes}
                        type="button"
                        onClick={() => {
                          try {
                            const startMinutes = convertToMinutes(
                              scheduleForm.startTime
                            )
                            const endMinutes = startMinutes + duration.minutes
                            const endHour24 = Math.floor(endMinutes / 60)
                            const endMinute = endMinutes % 60

                            // Convert to 12-hour format
                            let hour12 =
                              endHour24 > 12 ? endHour24 - 12 : endHour24
                            if (hour12 === 0) hour12 = 12
                            const ampm = endHour24 >= 12 ? 'PM' : 'AM'
                            const minuteStr = endMinute
                              .toString()
                              .padStart(2, '0')

                            const endTimeStr = `${hour12}:${minuteStr} ${ampm}`
                            setScheduleForm({
                              ...scheduleForm,
                              endTime: endTimeStr,
                            })
                          } catch (error) {
                            console.error('Error calculating end time:', error)
                          }
                        }}
                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Duration Display */}
              {scheduleForm.startTime && scheduleForm.endTime && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p
                    className="text-xs text-blue-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <span className="font-medium">Duration:</span>{' '}
                    {(() => {
                      try {
                        const start = convertToMinutes(scheduleForm.startTime)
                        const end = convertToMinutes(scheduleForm.endTime)
                        if (end <= start) {
                          return 'Invalid (end time must be after start time)'
                        }
                        const duration = end - start
                        const hours = Math.floor(duration / 60)
                        const minutes = duration % 60
                        if (hours > 0 && minutes > 0) {
                          return `${hours} hour${
                            hours > 1 ? 's' : ''
                          } and ${minutes} minute${minutes > 1 ? 's' : ''}`
                        } else if (hours > 0) {
                          return `${hours} hour${hours > 1 ? 's' : ''}`
                        } else {
                          return `${minutes} minute${minutes > 1 ? 's' : ''}`
                        }
                      } catch {
                        return 'Invalid time format'
                      }
                    })()}
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Mode */}
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Delivery Mode
              </label>
              <select
                value={scheduleForm.deliveryMode}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    deliveryMode: e.target.value as any,
                    room: e.target.value === 'Online' ? '' : scheduleForm.room, // Clear room if Online
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <option value="">Select delivery mode</option>
                <option value="Face to Face">Face to Face</option>
                <option value="Modular">Modular</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Online">Online</option>
              </select>
            </div>

            {/* Room */}
            {scheduleForm.deliveryMode !== 'Online' && (
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Room
                </label>
                <input
                  type="text"
                  value={scheduleForm.room}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      room: e.target.value,
                    })
                  }
                  placeholder="103A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                />
              </div>
            )}

            {/* Error Messages */}
            {scheduleErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                {scheduleErrors.map((error, index) => (
                  <p
                    key={index}
                    className="text-xs text-red-600 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {error}
                  </p>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setEditingSchedule(null)
                  setScheduleForm({
                    dayOfWeek: [],
                    startTime: '',
                    endTime: '',
                    room: '',
                    deliveryMode: '',
                  })
                  setScheduleErrors([])
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Validation
                  const errors: string[] = []
                  if (scheduleForm.dayOfWeek.length === 0) {
                    errors.push('At least one day of week is required')
                  }
                  if (!scheduleForm.startTime) {
                    errors.push('Start time is required')
                  }
                  if (!scheduleForm.endTime) {
                    errors.push('End time is required')
                  }
                  if (!scheduleForm.deliveryMode) {
                    errors.push('Delivery mode is required')
                  }
                  if (
                    scheduleForm.deliveryMode !== 'Online' &&
                    !scheduleForm.room
                  ) {
                    errors.push(
                      'Room is required for non-online delivery modes'
                    )
                  }

                  // Check if end time is after start time
                  if (scheduleForm.startTime && scheduleForm.endTime) {
                    const start = convertToMinutes(scheduleForm.startTime)
                    const end = convertToMinutes(scheduleForm.endTime)
                    if (end <= start) {
                      errors.push('End time must be after start time')
                    }
                  }

                  if (errors.length > 0) {
                    setScheduleErrors(errors)
                    return
                  }

                  setSavingSchedule(true)
                  setScheduleErrors([])

                  try {
                    // Check for conflicts first - check each day
                    const allConflicts: string[] = []
                    for (const day of scheduleForm.dayOfWeek) {
                      const conflictResponse = await fetch(
                        '/api/teacher-assignments/check-conflicts',
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            subjectId: editingSchedule.subjectId,
                            sectionId: editingSchedule.sectionId,
                            teacherId: teacher?.id,
                            dayOfWeek: day,
                            startTime: scheduleForm.startTime,
                            endTime: scheduleForm.endTime,
                            room:
                              scheduleForm.deliveryMode === 'Online'
                                ? ''
                                : scheduleForm.room,
                            deliveryMode: scheduleForm.deliveryMode,
                          }),
                        }
                      )

                      const conflictData = await conflictResponse.json()
                      if (
                        conflictData.conflicts &&
                        conflictData.conflicts.length > 0
                      ) {
                        allConflicts.push(...conflictData.conflicts)
                      }
                    }

                    if (allConflicts.length > 0) {
                      setScheduleErrors(allConflicts)
                      setSavingSchedule(false)
                      return
                    }

                    // Save schedule
                    const saveResponse = await fetch(
                      '/api/teacher-assignments/update-schedule',
                      {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          subjectId: editingSchedule.subjectId,
                          sectionId: editingSchedule.sectionId,
                          teacherId: teacher?.id,
                          registrarUid,
                          dayOfWeek: scheduleForm.dayOfWeek,
                          startTime: scheduleForm.startTime,
                          endTime: scheduleForm.endTime,
                          room: scheduleForm.room,
                        }),
                      }
                    )

                    const saveData = await saveResponse.json()

                    if (saveResponse.ok) {
                      toast.success('Schedule updated successfully')
                      setEditingSchedule(null)
                      setScheduleForm({
                        dayOfWeek: [],
                        startTime: '',
                        endTime: '',
                        room: '',
                        deliveryMode: '',
                      })
                      await loadAssignments()
                    } else {
                      setScheduleErrors([
                        saveData.error || 'Failed to update schedule',
                      ])
                    }
                  } catch (error) {
                    console.error('Error updating schedule:', error)
                    setScheduleErrors(['Failed to update schedule'])
                  } finally {
                    setSavingSchedule(false)
                  }
                }}
                disabled={savingSchedule}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {savingSchedule ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Schedule'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Schedule Confirmation Modal */}
      {resetTarget && (
        <Modal
          isOpen={!!resetTarget}
          onClose={() => {
            if (resetting) return
            setResetTarget(null)
          }}
          title="Reset Schedule"
          size="sm"
        >
          <div className="p-6 space-y-4">
            <p
              className="text-sm text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              You are about to reset the schedule for{' '}
              <span className="font-semibold">{resetTarget.sectionName}</span>.
              This will clear all days, start time, end time, room, and delivery
              mode for this section, but will keep the teacher assigned.
            </p>
            <p
              className="text-xs text-gray-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              You can set a new schedule anytime using the Edit button.
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (resetting) return
                  setResetTarget(null)
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!teacher || !resetTarget) return
                  try {
                    setResetting(true)
                    const res = await fetch(
                      '/api/teacher-assignments/reset-schedule',
                      {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          subjectId: resetTarget.subjectId,
                          sectionId: resetTarget.sectionId,
                          teacherId: teacher.id,
                          registrarUid,
                        }),
                      }
                    )

                    const data = await res.json().catch(() => ({}))

                    if (res.ok) {
                      toast.success(
                        `Reset schedule for ${resetTarget.sectionName}`
                      )
                      setResetTarget(null)
                      await loadAssignments()
                    } else {
                      toast.error(data.error || 'Failed to reset schedule')
                    }
                  } catch (error) {
                    console.error('Error resetting schedule:', error)
                    toast.error('Failed to reset schedule')
                  } finally {
                    setResetting(false)
                  }
                }}
                disabled={resetting}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {resetting ? 'Resetting…' : 'Reset Schedule'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}

// Helper function to get color value
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
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
    'purple-700': '#8b5cf6',
    'purple-800': '#6b21a8',
    'indigo-700': '#4338ca',
    'indigo-800': '#312e81',
  }
  return colorMap[color] || '#1e40af'
}
