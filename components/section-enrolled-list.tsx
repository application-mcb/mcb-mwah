'use client'

import React, { useState, useEffect } from 'react'
import Print from '@/components/print'
import { SectionData } from '@/lib/types/grade-section'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'
import { useAuth } from '@/lib/auth-context'

interface SectionEnrolledListProps {
  section: SectionData | null
  registrarName?: string
  isOpen: boolean
  onClose: () => void
}

interface EnrolledStudent {
  userId: string
  studentId?: string
  studentName: string
  studentSection: string
  studentLevel: string
  studentSemester: string
}

export const SectionEnrolledList: React.FC<SectionEnrolledListProps> = ({
  section,
  registrarName: propRegistrarName,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth()
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [currentAY, setCurrentAY] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [registrarName, setRegistrarName] = useState<string | undefined>(
    propRegistrarName
  )

  useEffect(() => {
    if (isOpen && section) {
      loadData()
      loadRegistrarName()
    } else {
      // Reset state when modal closes
      setEnrolledStudents([])
      setCurrentAY('')
      setError(null)
    }
  }, [isOpen, section, user])

  const loadRegistrarName = async () => {
    // If registrarName was passed as prop, use it
    if (propRegistrarName) {
      setRegistrarName(propRegistrarName)
      return
    }

    // Otherwise, fetch from current logged-in user
    if (!user) {
      return
    }

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

      if (response.ok) {
        const data = await response.json()
        if (data.registrar) {
          const fullName = `${data.registrar.firstName || ''} ${
            data.registrar.lastName || ''
          }`.trim()
          if (fullName) {
            setRegistrarName(fullName)
          }
        }
      }
    } catch (err) {
      console.error('Error loading registrar name:', err)
    }
  }

  const loadData = async () => {
    if (!section) return

    try {
      setLoading(true)
      setError(null)

      // Get current AY
      const configResponse = await fetch('/api/enrollment?getConfig=true')
      const configData = await configResponse.json()

      if (configResponse.ok && configData.ayCode) {
        setCurrentAY(configData.ayCode)
      }

      // Fetch from API to get fresh data with studentId
      const response = await fetch(`/api/sections/${section.id}/students`)
      const data = await response.json()

      if (response.ok && data.success) {
        setEnrolledStudents(data.students || [])
        if (data.ayCode && !currentAY) {
          setCurrentAY(data.ayCode)
        }
      } else {
        setError(data.error || 'Failed to load enrolled students')
      }
    } catch (err) {
      console.error('Error loading enrolled students:', err)
      setError('Failed to load enrolled students')
    } finally {
      setLoading(false)
    }
  }

  const formatGradeCourseAndSection = (student: EnrolledStudent): string => {
    const { studentLevel, studentSection } = student

    if (!studentLevel) {
      return studentSection || 'Unassigned'
    }

    // For high school, studentLevel might be like "Grade 7", "Grade 11", etc.
    if (studentLevel.includes('Grade') || /^Grade\s+\d+/.test(studentLevel)) {
      const sectionPart = studentSection ? ` - ${studentSection}` : ''
      return `${studentLevel}${sectionPart}`
    }

    // For college, studentLevel might be like "BSIT Year 1", "BSIT", etc.
    // Or it might be formatted differently
    const sectionPart = studentSection ? ` - ${studentSection}` : ''
    return `${studentLevel}${sectionPart}`
  }

  const capitalizeName = (name: string): string => {
    if (!name || name === 'N/A' || name === 'unassigned') {
      return 'unassigned'
    }
    return name
      .split(' ')
      .map((word) => {
        if (!word) return word
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }

  if (!isOpen || !section) {
    return null
  }

  return (
    <Print onClose={onClose} title={`Enrolled Students - ${section.sectionName}`}>
      <div className="print-document p-3">
        {/* Header with Logo and School Info */}
        <div className="print-header mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Marian College Logo"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1
                  className="text-md font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {SCHOOL_NAME_FORMAL}
                </h1>
                <p
                  className="text-xs text-gray-600 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  908 Gil Carlos St. San Jose, Baliwag, Bulacan
                </p>
                {currentAY && (
                  <p className="text-xs font-mono text-gray-600">
                    Academic Year: {currentAY}
                  </p>
                )}
                <p className="text-xs font-mono text-gray-600">
                  Date:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="print-section mb-4">
          <h2
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Enrolled Students - {section.sectionName}
          </h2>
          <p
            className="text-sm text-gray-600 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Section: {section.sectionName} | Grade/Course: {section.grade} | Department: {section.department}
          </p>
        </div>

        {/* Loading State - Skeleton */}
        {loading && (
          <div className="print-section mb-6">
            <table
              className="print-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '15px',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    Student ID
                  </th>
                  <th
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    Name of the Student
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 400,
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'left',
                        verticalAlign: 'top',
                      }}
                    >
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 400,
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'left',
                        verticalAlign: 'top',
                      }}
                    >
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="print-section mb-6">
            <p
              className="text-sm text-red-600"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Students Table */}
        {!loading && !error && enrolledStudents.length > 0 && (
          <div className="print-section mb-6">
            <table
              className="print-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '15px',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    Student ID
                  </th>
                  <th
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      border: '1px solid #000',
                      padding: '8px',
                      textAlign: 'center',
                      backgroundColor: '#f3f4f6',
                    }}
                  >
                    Name of the Student
                  </th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((student, index) => (
                  <tr key={student.userId || index}>
                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 400,
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'left',
                        verticalAlign: 'top',
                      }}
                    >
                      {student.studentId || 'unassigned'}
                    </td>
                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 400,
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'left',
                        verticalAlign: 'top',
                      }}
                    >
                      {capitalizeName(student.studentName || 'unassigned')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              className="text-xs text-gray-600 mt-4"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Total: {enrolledStudents.length} student
              {enrolledStudents.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && enrolledStudents.length === 0 && (
          <div className="print-section mb-6">
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              No students enrolled in this section for the current academic
              year.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="print-section mt-8">
          <div className="flex justify-between items-start pt-4">
            <div>
              <p
                className="text-xs text-black font-mono"
                style={{ fontWeight: 400 }}
              >
                Generated on{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="border-t border-black mb-2"></div>
              <p
                className="text-xs text-gray-900 font-medium"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {registrarName || 'Registrar'}
              </p>
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Registrar
              </p>
            </div>
          </div>
        </div>
      </div>
    </Print>
  )
}

