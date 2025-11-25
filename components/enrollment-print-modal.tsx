'use client'

import React, { useEffect, useState } from 'react'
import Print from './print'
import { EnrollmentData } from '@/lib/enrollment-database'
// import { StudentProfile, StudentDocuments } from '@/lib/types/student';
import {
  User as UserIcon,
  GraduationCap as GraduationCapIcon,
} from '@phosphor-icons/react'
import QRCode from 'qrcode'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'

// Extended interface to handle college enrollment fields
interface ExtendedEnrollmentData
  extends Omit<EnrollmentData, 'enrollmentInfo'> {
  enrollmentInfo: {
    gradeLevel?: string
    schoolYear: string
    enrollmentDate: string
    status: string
    orNumber?: string
    scholarship?: string
    studentId?: string
    sectionId?: string
    studentType?: 'regular' | 'irregular'
    // College-specific fields
    level?: 'college' | 'high-school'
    courseId?: string
    courseCode?: string
    courseName?: string
    yearLevel?: string
    semester?: 'first-sem' | 'second-sem'
  }
}

interface SubjectData {
  id: string
  name: string
  color: string
  code: string
  totalUnits: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface SubjectSetData {
  id: string
  name: string
  description: string
  subjects: string[]
  gradeLevel: number
  color: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface StudentProfile {
  userId: string
  photoURL?: string
  email?: string
}

interface EnrollmentPrintModalProps {
  isOpen: boolean
  onClose: () => void
  enrollment: ExtendedEnrollmentData | null
  studentProfile: StudentProfile | null
  selectedSubjects: string[]
  subjects: Record<string, SubjectData>
  subjectSets: Record<number, SubjectSetData[]>
  registrarName?: string
}

const EnrollmentPrintModal: React.FC<EnrollmentPrintModalProps> = ({
  isOpen,
  onClose,
  enrollment,
  studentProfile,
  selectedSubjects,
  subjects,
  subjectSets,
  registrarName,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [orNumber, setOrNumber] = useState<string>('')
  const [scholarship, setScholarship] = useState<string>('')
  const [studentId, setStudentId] = useState<string>('')

  useEffect(() => {
    if (enrollment?.id) {
      generateQRCode(enrollment.id)
    }
  }, [enrollment?.id])

  // Populate form fields from enrollment data
  useEffect(() => {
    console.log('🔄 Populating print modal fields from enrollment:', {
      enrollmentId: enrollment?.id,
      enrollmentInfo: enrollment?.enrollmentInfo,
      orNumber: enrollment?.enrollmentInfo?.orNumber,
      scholarship: enrollment?.enrollmentInfo?.scholarship,
    })

    if (enrollment?.enrollmentInfo) {
      setOrNumber(enrollment.enrollmentInfo.orNumber || '')
      setScholarship(enrollment.enrollmentInfo.scholarship || '')

      // Get studentId from student document
      const getStudentId = async () => {
        try {
          const studentRef = doc(db, 'students', enrollment.userId)
          const studentDoc = await getDoc(studentRef)
          if (studentDoc.exists()) {
            const studentData = studentDoc.data()
            setStudentId(studentData.studentId || '')
          } else {
            setStudentId('')
          }
        } catch (error) {
          console.error('Error fetching student data:', error)
          setStudentId('')
        }
      }

      getStudentId()
    } else {
      // Reset to empty if no enrollment data
      setOrNumber('')
      setScholarship('')
      setStudentId('')
    }
  }, [enrollment])

  const generateQRCode = async (enrollmentId: string) => {
    try {
      // Use the environment variable for the base URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const verificationUrl = `${baseUrl}/verify/${enrollmentId}`

      console.log('Enrollment ID:', enrollmentId)
      console.log('Base URL:', baseUrl)
      console.log('Verification URL:', verificationUrl)

      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 120,
        margin: 2,
        errorCorrectionLevel: 'L', // Low error correction for less dense QR code
        color: {
          dark: '#000000', // Black color
          light: '#FFFFFF', // White background
        },
      })
      setQrCodeDataUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  if (!isOpen || !enrollment) return null

  const formatFullName = (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => {
    if (!lastName && !firstName) return 'N/A'

    const parts: string[] = []
    if (lastName) parts.push(lastName)
    if (firstName) parts.push(firstName)
    if (middleName) {
      const middleInitial = middleName.charAt(0).toUpperCase()
      parts.push(`${middleInitial}.`)
    }
    if (nameExtension) parts.push(`(${nameExtension})`)

    return parts.join(', ')
  }

  const formatSignatureName = (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => {
    if (!lastName && !firstName) return 'N/A'

    const parts: string[] = []
    if (firstName) parts.push(firstName)
    if (middleName) {
      const middleInitial = middleName.charAt(0).toUpperCase()
      parts.push(middleInitial)
    }
    if (lastName) parts.push(lastName)
    if (nameExtension) parts.push(nameExtension)

    return parts.join(' ')
  }

  const formatBirthDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'

    try {
      let parsedDate
      if (date.toDate && typeof date.toDate === 'function') {
        parsedDate = date.toDate()
      } else if (date.seconds) {
        parsedDate = new Date(date.seconds * 1000)
      } else if (typeof date === 'string') {
        parsedDate = new Date(date)
      } else {
        parsedDate = date
      }

      return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'N/A'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getColorValue = (colorClass: string) => {
    // Convert Tailwind color classes to actual hex values
    const colorMap: Record<string, string> = {
      // Red variants
      'red-500': '#ef4444',
      'red-600': '#dc2626',
      'red-700': '#b91c1c',
      'red-800': '#991b1b',
      'red-900': '#7f1d1d',
      // Blue variants
      'blue-500': '#3b82f6',
      'blue-600': '#2563eb',
      'blue-900': '#1d4ed8',
      'blue-900': '#1e40af',
      'blue-900': '#1e3a8a',
      // Green variants
      'green-500': '#22c55e',
      'green-600': '#16a34a',
      'green-700': '#15803d',
      'green-800': '#166534',
      'green-900': '#14532d',
      // Yellow variants
      'yellow-500': '#eab308',
      'yellow-600': '#ca8a04',
      'yellow-700': '#a16207',
      'yellow-800': '#854d0e',
      'yellow-900': '#713f12',
      // Purple variants
      'purple-500': '#a855f7',
      'purple-600': '#9333ea',
      'purple-700': '#7c3aed',
      'purple-800': '#6b21a8',
      'purple-900': '#581c87',
      // Pink variants
      'pink-500': '#ec4899',
      'pink-600': '#db2777',
      'pink-700': '#be185d',
      'pink-800': '#9d174d',
      'pink-900': '#831843',
      // Indigo variants
      'indigo-500': '#6366f1',
      'indigo-600': '#4f46e5',
      'indigo-700': '#4338ca',
      'indigo-800': '#3730a3',
      'indigo-900': '#312e81',
      // Gray variants
      'gray-500': '#6b7280',
      'gray-600': '#4b5563',
      'gray-700': '#374151',
      'gray-800': '#1f2937',
      'gray-900': '#111827',
      // Orange variants
      'orange-500': '#f97316',
      'orange-600': '#ea580c',
      'orange-700': '#c2410c',
      'orange-800': '#9a3412',
      'orange-900': '#7c2d12',
      // Teal variants
      'teal-500': '#14b8a6',
      'teal-600': '#0d9488',
      'teal-700': '#0f766e',
      'teal-800': '#115e59',
      'teal-900': '#134e4a',
      // Cyan variants
      'cyan-500': '#06b6d4',
      'cyan-600': '#0891b2',
      'cyan-700': '#0e7490',
      'cyan-800': '#155e75',
      'cyan-900': '#164e63',
      // Lime variants
      'lime-500': '#84cc16',
      'lime-600': '#65a30d',
      'lime-700': '#365314',
      'lime-800': '#3f6212',
      'lime-900': '#365314',
      // Emerald variants
      'emerald-500': '#10b981',
      'emerald-600': '#059669',
      'emerald-700': '#047857',
      'emerald-800': '#065f46',
      'emerald-900': '#064e3b',
      // Sky variants
      'sky-500': '#0ea5e9',
      'sky-600': '#0284c7',
      'sky-700': '#0369a1',
      'sky-800': '#075985',
      'sky-900': '#0c4a6e',
      // Violet variants
      'violet-500': '#8b5cf6',
      'violet-600': '#7c3aed',
      'violet-700': '#6d28d9',
      'violet-800': '#5b21b6',
      'violet-900': '#4c1d95',
      // Fuchsia variants
      'fuchsia-500': '#d946ef',
      'fuchsia-600': '#c026d3',
      'fuchsia-700': '#a21caf',
      'fuchsia-800': '#86198f',
      'fuchsia-900': '#701a75',
      // Rose variants
      'rose-500': '#f43f5e',
      'rose-600': '#e11d48',
      'rose-700': '#be123c',
      'rose-800': '#9f1239',
      'rose-900': '#881337',
      // Amber variants
      'amber-500': '#f59e0b',
      'amber-600': '#d97706',
      'amber-700': '#b45309',
      'amber-800': '#92400e',
      'amber-900': '#78350f',
      // Slate variants
      'slate-500': '#64748b',
      'slate-600': '#475569',
      'slate-700': '#334155',
      'slate-800': '#1e293b',
      'slate-900': '#0f172a',
      // Zinc variants
      'zinc-500': '#71717a',
      'zinc-600': '#52525b',
      'zinc-700': '#3f3f46',
      'zinc-800': '#27272a',
      'zinc-900': '#18181b',
      // Neutral variants
      'neutral-500': '#737373',
      'neutral-600': '#525252',
      'neutral-700': '#404040',
      'neutral-800': '#262626',
      'neutral-900': '#171717',
      // Stone variants
      'stone-500': '#78716c',
      'stone-600': '#57534e',
      'stone-700': '#44403c',
      'stone-800': '#292524',
      'stone-900': '#1c1917',
    }

    return colorMap[colorClass] || '#6b7280' // Default to gray-500 if not found
  }

  const getSelectedSubjectsData = () => {
    console.log('📋 Processing selected subjects:', selectedSubjects)
    const result = selectedSubjects
      .map((subjectId) => {
        const subject = subjects[subjectId]
        if (!subject) {
          console.warn('  Subject not found:', subjectId)
          return null
        }
        console.log('  Found subject:', subject.name, subject.code)
        return {
          id: subjectId,
          name: subject.name,
          color: subject.color,
          code: subject.code,
          totalUnits: subject.totalUnits,
        }
      })
      .filter(Boolean)
    console.log('📊 Final subjects data:', result.length, 'subjects')
    return result
  }

  const getSubjectSetsForSelectedSubjects = () => {
    // Handle college enrollments
    if (enrollment.enrollmentInfo?.level === 'college') {
      // Return all subject sets that contain any of the selected subjects
      const allSubjectSets = Object.values(subjectSets).flat()
      return allSubjectSets.filter((subjectSet) =>
        subjectSet.subjects.some((subjectId) =>
          selectedSubjects.includes(subjectId)
        )
      )
    }

    // Handle high school enrollments
    const gradeLevel = enrollment.enrollmentInfo?.gradeLevel
    if (!gradeLevel) return []

    const gradeSubjectSets = subjectSets[parseInt(gradeLevel)] || []
    return gradeSubjectSets.filter((subjectSet) =>
      subjectSet.subjects.some((subjectId) =>
        selectedSubjects.includes(subjectId)
      )
    )
  }

  return (
    <Print onClose={onClose} title="Student Enrollment Summary">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .subject-color-dot {
            width: 12px !important;
            height: 12px !important;
            display: inline-block !important;
            margin-right: 8px !important;
            vertical-align: middle !important;
            border-radius: 2px !important;
          }
          ${getSelectedSubjectsData()
            .map((subject, index) => {
              if (!subject) return ''
              const colorValue = getColorValue(subject.color)
              const safeId = subject.id.replace(/[^a-zA-Z0-9]/g, '')
              return `.subject-${safeId} { background-color: ${colorValue} !important; }`
            })
            .join('\n')}
        `,
        }}
      />
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
                <p className="text-xs font-mono text-gray-600 ">
                  Enrollment Date:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="grid grid-cols-1 gap-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  OR Number
                </label>
                <p
                  className="w-32 px-2 py-1 text-sm border border-gray-300 bg-gray-50 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  {orNumber || 'XXXXX'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Scholarship
                </label>
                <p
                  className="w-32 px-2 py-1 text-sm border border-gray-300 bg-gray-50 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  {scholarship || '%XXX'} %
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Student ID
                </label>
                <p
                  className="w-32 px-2 py-1 text-sm border border-gray-300 bg-gray-50 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  {studentId || 'YYY-XXX'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="print-section">
          <div className="flex gap-6">
            <div className="flex-1 overflow-hidden bg-white">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Birthdate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      {enrollment.enrollmentInfo?.level === 'college'
                        ? 'Course & Year'
                        : 'Grade Level'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School Year
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                      {formatFullName(
                        enrollment.personalInfo?.firstName,
                        enrollment.personalInfo?.middleName,
                        enrollment.personalInfo?.lastName,
                        enrollment.personalInfo?.nameExtension
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                      {(() => {
                        const birthMonth = enrollment.personalInfo?.birthMonth
                        const birthDay = enrollment.personalInfo?.birthDay
                        const birthYear = enrollment.personalInfo?.birthYear
                        if (birthMonth && birthDay && birthYear) {
                          return formatBirthDate(
                            `${birthYear}-${birthMonth.padStart(
                              2,
                              '0'
                            )}-${birthDay.padStart(2, '0')}`
                          )
                        }
                        return 'N/A'
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                      {enrollment.personalInfo?.gender || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                      {(() => {
                        if (enrollment.enrollmentInfo?.level === 'college') {
                          const semesterDisplay =
                            enrollment.enrollmentInfo.semester === 'first-sem'
                              ? 'Q1'
                              : enrollment.enrollmentInfo.semester ===
                                'second-sem'
                              ? 'Q2'
                              : ''
                          const semesterSuffix = semesterDisplay
                            ? ` ${semesterDisplay}`
                            : ''
                          return `${
                            enrollment.enrollmentInfo.courseCode || 'N/A'
                          } ${
                            enrollment.enrollmentInfo.yearLevel || 'N/A'
                          }${semesterSuffix}`
                        }
                        return enrollment.enrollmentInfo?.gradeLevel || 'N/A'
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                      {enrollment.enrollmentInfo?.schoolYear || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center">
              {qrCodeDataUrl && (
                <div className="text-center">
                  <img
                    src={qrCodeDataUrl}
                    alt={`Verification QR Code for enrollment ${enrollment.id}`}
                    className="qr-code border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subject Assignment */}
        <div className="print-section">
          {/* Subjects Table */}
          <div>
            <div className="grid grid-cols-3 gap-4 mt-4 print-section">
              {getSelectedSubjectsData().map((subject, index) => {
                if (!subject) return null
                console.log(
                  `Subject: ${subject.name}, Color: ${
                    subject.color
                  }, Hex: ${getColorValue(subject.color)}`
                )
                return (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="subject-color-dot"
                        style={{
                          backgroundColor: getColorValue(subject.color),
                          width: '12px',
                          height: '12px',
                          display: 'inline-block',
                          marginRight: '8px',
                          verticalAlign: 'middle',
                          borderRadius: '2px',
                          border: '1px solid #ccc',
                        }}
                      ></div>
                      <span
                        className="text-xs text-gray-900 font-mono uppercase"
                        style={{ fontWeight: 400 }}
                      >
                        {subject.code}
                      </span>
                    </div>
                    <span
                      className="text-xs text-gray-600 font-medium font-mono"
                      style={{ fontWeight: 400 }}
                    >
                      {subject.totalUnits || 'N/A'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="print-section">
          <div className="flex justify-between">
            <p className="font-regular text-xs border-t-1 w-[200px] text-center border-black pt-2 mt-8">
              {formatSignatureName(
                enrollment.personalInfo?.firstName,
                enrollment.personalInfo?.middleName,
                enrollment.personalInfo?.lastName,
                enrollment.personalInfo?.nameExtension
              )}
            </p>

            <p className="font-regular text-xs border-t-1 w-[200px] text-center border-black pt-2 mt-8">
              {registrarName || 'Registrar'}
            </p>
          </div>
        </div>
      </div>
    </Print>
  )
}

export default EnrollmentPrintModal
