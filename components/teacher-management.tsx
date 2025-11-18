'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from '@phosphor-icons/react'
import TeacherAssignmentModal from './teacher-assignment-modal'

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
  const [assignmentCounts, setAssignmentCounts] = useState<
    Record<string, { subjects: number; sections: number }>
  >({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [passwordTeacher, setPasswordTeacher] = useState<Teacher | null>(null)
  const [assignmentTeacher, setAssignmentTeacher] = useState<Teacher | null>(
    null
  )
  const [permissionsTeacher, setPermissionsTeacher] = useState<Teacher | null>(
    null
  )
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

  // Load assignment counts per teacher when teachers list updates
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const entries = await Promise.all(
          teachers.map(async (t) => {
            try {
              const res = await fetch(
                `/api/teacher-assignments?teacherId=${encodeURIComponent(t.id)}`
              )
              if (!res.ok) return [t.id, { subjects: 0, sections: 0 }] as const
              const data = await res.json()
              const assignments: Record<string, string[]> =
                data.assignments || {}
              const subjects = Object.keys(assignments).length
              const sectionSet = new Set<string>()
              Object.values(assignments).forEach((arr: string[]) => {
                if (Array.isArray(arr)) arr.forEach((id) => sectionSet.add(id))
              })
              const sections = sectionSet.size
              return [t.id, { subjects, sections }] as const
            } catch {
              return [t.id, { subjects: 0, sections: 0 }] as const
            }
          })
        )
        const map: Record<string, { subjects: number; sections: number }> = {}
        for (const [id, counts] of entries) map[id] = counts
        setAssignmentCounts(map)
      } catch {
        // ignore
      }
    }
    if (teachers.length > 0) loadCounts()
    else setAssignmentCounts({})
  }, [teachers])

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

  const handlePermissionsTeacher = (teacher: Teacher) => {
    setPermissionsTeacher(teacher)
    setShowPermissionsModal(true)
  }

  const handleCancel = () => {
    setShowCreateModal(false)
    setEditingTeacher(null)
  }

  const handleAssignmentModalClose = () => {
    setShowAssignmentModal(false)
    setAssignmentTeacher(null)
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
              <GraduationCap size={20} weight="fill" className="text-blue-900" />
            </div>
            <div>
              <h1 className="text-2xl font-light text-white flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
        <div className="text-xs text-gray-600 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          <div className="w-3 h-3 aspect-square rounded-md bg-gradient-to-br from-blue-800 to-blue-900"></div>
          Showing {filteredAndSortedTeachers.length} of {teachers.length}{' '}
          teachers
        </div>
      </div>

      {/* Teachers Table */}
      <Card className="overflow-hidden pb-0 pt-0 mt-0 mb-0 border border-gray-200 shadow-lg rounded-xl">
        <div className="overflow-x-auto">
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
                      <Users size={12} weight="bold" className="text-blue-900" />
                    </div>
                    Assignments
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
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square bg-white rounded-md flex items-center justify-center">
                      <Calendar
                        size={12}
                        weight="bold"
                        className="text-blue-900"
                      />
                    </div>
                    Created
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
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 w-48"></div>
                        <div className="h-3 bg-gray-200 w-32"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="h-4 bg-gray-200 w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="h-4 bg-gray-200 w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredAndSortedTeachers.length === 0 &&
                teachers.length > 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    No teachers match your search.
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
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
                      <div
                        className="text-xs text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {assignmentCounts[teacher.id]?.subjects || 0} Subject
                        {(assignmentCounts[teacher.id]?.subjects || 0) !== 1
                          ? 's'
                          : ''}
                      </div>
                      <div
                        className="text-xs text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {assignmentCounts[teacher.id]?.sections || 0} Section
                        {(assignmentCounts[teacher.id]?.sections || 0) !== 1
                          ? 's'
                          : ''}
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
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 text-xs text-gray-500 font-mono">
                      {new Date(teacher.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                          onClick={() => handleEditTeacher(teacher)}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <Pencil size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                          onClick={() => handleAssignTeacher(teacher)}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <UserPlus size={14} className="mr-1" />
                          Assign
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                          onClick={() => handlePermissionsTeacher(teacher)}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <Lock size={14} className="mr-1" />
                          Permissions
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-lg bg-red-600 hover:bg-red-700 text-white border"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <Trash size={14} className="mr-1" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
          <p className="text-xs text-blue-900 font-light text-justify border-1 shadow-sm border-blue-900 p-3 bg-white rounded-xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
          <p className="text-xs text-blue-900 font-light text-justify border-1 shadow-sm border-blue-900 p-3 bg-white rounded-xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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
              <div className="relative">
                <Envelope
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  weight="duotone"
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="teacher@mcb.edu.ph"
                  className="w-full pl-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="relative">
                <Phone
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  weight="duotone"
                />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value)
                    setFormData((prev) => ({ ...prev, phone: formatted }))
                  }}
                  placeholder="+63962 781 1434"
                  className="w-full pl-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

function PermissionsForm({
  teacher,
  onCancel,
  onSave,
}: PermissionsFormProps) {
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
