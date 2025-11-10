'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, FileText, BookOpen } from '@phosphor-icons/react'

type PersonalInfo = {
  firstName: string
  middleName: string
  lastName: string
  nameExtension: string
  email: string
  phone: string
  birthMonth: string
  birthDay: string
  birthYear: string
  placeOfBirth: string
  gender: string
  citizenship: string
  religion: string
  civilStatus: string
}

type DocumentsStatus = {
  uploaded: number
  required: number
  isComplete: boolean
}

type ConfirmationStepProps = {
  animatingStep: boolean
  selectedLevel: 'high-school' | 'college' | null
  selectedGrade: any | null
  selectedCourse: any | null
  selectedYear: number | null
  selectedSemester: 'first-sem' | 'second-sem' | null
  personalInfo: PersonalInfo
  documentsStatus: DocumentsStatus | null
  onBack: () => void
  onOpenSubmit: () => void
}

const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8',
  }
  return colorMap[color] || '#1e40af'
}

export default function ConfirmationStep({
  animatingStep,
  selectedLevel,
  selectedGrade,
  selectedCourse,
  selectedYear,
  selectedSemester,
  personalInfo,
  documentsStatus,
  onBack,
  onOpenSubmit,
}: ConfirmationStepProps) {
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [subjectsMap, setSubjectsMap] = useState<Record<string, any>>({})

  // Load assigned subjects based on enrollment info
  useEffect(() => {
    const loadAssignedSubjects = async () => {
      if (!selectedLevel) {
        setAssignedSubjects([])
        return
      }

      setLoadingSubjects(true)
      try {
        // Fetch subject assignments, subject sets, and subjects in parallel
        const [assignmentsRes, setsRes, subjectsRes] = await Promise.all([
          fetch('/api/subject-assignments'),
          fetch('/api/subject-sets'),
          fetch('/api/subjects'),
        ])

        const [assignmentsData, setsData, subjectsData] = await Promise.all([
          assignmentsRes.json(),
          setsRes.json(),
          subjectsRes.json(),
        ])

        // Build subjects map
        const subjects: Record<string, any> = {}
        if (subjectsRes.ok && subjectsData.subjects) {
          subjectsData.subjects.forEach((subject: any) => {
            subjects[subject.id] = subject
          })
        }
        setSubjectsMap(subjects)

        // Build subject sets map
        const subjectSetsMap: Record<string, any> = {}
        if (setsRes.ok && setsData.subjectSets) {
          setsData.subjectSets.forEach((set: any) => {
            subjectSetsMap[set.id] = set
          })
        }

        // Get subject assignments
        const subjectAssignments =
          assignmentsRes.ok && assignmentsData.subjectAssignments
            ? assignmentsData.subjectAssignments
            : []

        let subjectIds: string[] = []

        if (selectedLevel === 'college') {
          // College: match by course, year, semester
          if (selectedCourse && selectedYear && selectedSemester) {
            const assignment = subjectAssignments.find(
              (a: any) =>
                a.level === 'college' &&
                a.courseCode === selectedCourse.code &&
                a.yearLevel === selectedYear &&
                a.semester === selectedSemester
            )
            if (assignment?.subjectSetId) {
              const set = subjectSetsMap[assignment.subjectSetId]
              subjectIds = set?.subjects || []
            }
          }
        } else if (selectedLevel === 'high-school' && selectedGrade) {
          const gradeLevel = parseInt(selectedGrade.gradeLevel || '0')
          const isSHS = selectedGrade.department === 'SHS'

          if (isSHS) {
            // SHS: match by grade, semester, strand
            if (selectedSemester && selectedGrade.strand) {
              const assignment = subjectAssignments.find(
                (a: any) =>
                  a.level === 'high-school' &&
                  a.gradeLevel === gradeLevel &&
                  a.semester === selectedSemester &&
                  a.strand === selectedGrade.strand
              )
              if (assignment?.subjectSetId) {
                const set = subjectSetsMap[assignment.subjectSetId]
                subjectIds = set?.subjects || []
              }
            }
          } else {
            // JHS: match by grade only (no semester)
            const assignment = subjectAssignments.find(
              (a: any) =>
                a.level === 'high-school' &&
                a.gradeLevel === gradeLevel &&
                !a.semester
            )
            if (assignment?.subjectSetId) {
              const set = subjectSetsMap[assignment.subjectSetId]
              subjectIds = set?.subjects || []
            }
          }
        }

        // Get full subject objects
        const subjectsList = subjectIds
          .map((id) => subjects[id])
          .filter((s) => s !== undefined)

        setAssignedSubjects(subjectsList)
      } catch (error) {
        console.error('Error loading assigned subjects:', error)
        setAssignedSubjects([])
      } finally {
        setLoadingSubjects(false)
      }
    }

    loadAssignedSubjects()
  }, [
    selectedLevel,
    selectedGrade,
    selectedCourse,
    selectedYear,
    selectedSemester,
  ])

  return (
    <div
      className={`space-y-6 transition-all duration-500 ${
        animatingStep
          ? 'opacity-0 transform translate-x-4'
          : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
              <Check size={20} className="text-white" weight="bold" />
            </div>
            <div>
              <h2
                className="text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Confirm Your Enrollment
              </h2>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Review all information and submit your enrollment
              </p>
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={onBack} className="rounded-xl">
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="space-y-6">
            <div>
              <h4
                className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Personal Information
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      className="text-sm font-medium text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Full Name
                    </label>
                    <p className="text-sm text-gray-900 mt-1 font-mono">
                      {personalInfo.firstName} {personalInfo.middleName}{' '}
                      {personalInfo.lastName} {personalInfo.nameExtension}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="text-sm font-medium text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Email Address
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalInfo.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label
                        className="text-sm font-medium text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Phone Number
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalInfo.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Date of Birth
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalInfo.birthMonth &&
                        personalInfo.birthDay &&
                        personalInfo.birthYear
                          ? `${personalInfo.birthMonth}/${personalInfo.birthDay}/${personalInfo.birthYear}`
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label
                        className="text-sm font-medium text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Place of Birth
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalInfo.placeOfBirth || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="text-sm font-medium text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Gender
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalInfo.gender || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label
                        className="text-sm font-medium text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Civil Status
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalInfo.civilStatus || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="text-sm font-medium text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Citizenship
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalInfo.citizenship || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label
                        className="text-sm font-medium text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Religion
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono  ">
                        {personalInfo.religion || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-blue-100 pt-6">
              <h4
                className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Enrollment Details
              </h4>
              <div className="mb-4">
                <div
                  className="p-4 rounded-xl border border-blue-100 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${
                      selectedLevel === 'high-school' && selectedGrade
                        ? getColorValue(selectedGrade.color)
                        : selectedLevel === 'college' && selectedCourse
                        ? getColorValue(selectedCourse.color)
                        : '#1e40af'
                    } 0%, ${
                      selectedLevel === 'high-school' && selectedGrade
                        ? getColorValue(selectedGrade.color) + 'dd'
                        : selectedLevel === 'college' && selectedCourse
                        ? getColorValue(selectedCourse.color) + 'dd'
                        : '#1e40afdd'
                    } 100%)`,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center aspect-square shadow-md">
                      <Check
                        size={16}
                        weight="fill"
                        style={{ color: '#1e40af' }}
                      />
                    </div>
                    <div className="flex-1">
                      {selectedLevel === 'high-school' && selectedGrade && (
                        <>
                          <h5
                            className="font-medium text-white text-sm"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            Grade {selectedGrade.gradeLevel}{' '}
                            {selectedGrade.strand}
                          </h5>
                          <p className="text-xs text-white">
                            {selectedGrade.department} Department
                          </p>
                        </>
                      )}
                      {selectedLevel === 'college' &&
                        selectedCourse &&
                        selectedYear &&
                        selectedSemester && (
                          <>
                            <h5
                              className="font-medium text-white text-sm"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {selectedCourse.code} {selectedYear}{' '}
                              {selectedSemester === 'first-sem'
                                ? 'First Semester'
                                : 'Second Semester'}
                            </h5>
                            <p className="text-xs text-white">
                              {selectedCourse.name}
                            </p>
                          </>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={14} className="text-white" weight="bold" />
                      <span className="text-xs text-white">Selected</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Enrollment Date:
                  </span>
                  <span
                    className="text-sm text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Academic Year:</span>
                  <span
                    className="text-sm text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {new Date().getFullYear()} - {new Date().getFullYear() + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="space-y-6">
            <div>
              <h4
                className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Assigned Subjects ({assignedSubjects.length})
              </h4>
              {loadingSubjects ? (
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-900/30 border-t-blue-900 mx-auto mb-2"></div>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Loading subjects...
                  </p>
                </div>
              ) : assignedSubjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {assignedSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-xl border border-blue-100 shadow-sm"
                    >
                      <div
                        className="w-3 h-3 rounded"
                        style={{
                          backgroundColor: getColorValue(subject.color),
                        }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {subject.code || 'N/A'} - {subject.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(subject.lectureUnits || 0) +
                            (subject.labUnits || 0)}{' '}
                          units
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md mx-auto mb-2">
                    <BookOpen
                      size={20}
                      className="text-white"
                      weight="fill"
                    />
                  </div>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    No subject assignment found for this enrollment.
                    <br />
                    Subjects will be assigned after enrollment approval.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-blue-100 pt-6">
              <h4
                className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Document Management
              </h4>

              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border ${
                    documentsStatus?.isComplete
                      ? 'bg-white/80 backdrop-blur-sm border-green-100 shadow-lg'
                      : 'bg-white/80 backdrop-blur-sm border-yellow-100 shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5
                      className={`font-medium text-sm bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent`}
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Required Documents Status
                    </h5>
                    <div
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg ${
                        documentsStatus?.isComplete
                          ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                          : 'bg-gradient-to-br from-yellow-700 to-yellow-800 text-white shadow-md'
                      }`}
                    >
                      {documentsStatus?.isComplete ? (
                        <Check size={12} />
                      ) : (
                        <FileText size={12} />
                      )}
                      <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        {documentsStatus?.uploaded || 0}/
                        {documentsStatus?.required || 4}
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs text-gray-600`}>
                    {documentsStatus?.isComplete
                      ? 'All required documents have been uploaded. You can proceed with enrollment.'
                      : `You need to upload ${
                          (documentsStatus?.required || 4) -
                          (documentsStatus?.uploaded || 0)
                        } more required document(s) before submitting your enrollment.`}
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                      <FileText
                        size={16}
                        className="text-white"
                        weight="bold"
                      />
                    </div>
                    <div className="flex-1">
                      <h5
                        className="font-medium text-gray-900 text-sm mb-2"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Documents Managed Separately
                      </h5>
                      <p className="text-xs text-gray-600 mb-3">
                        Your academic documents are now managed in the Documents
                        section of your dashboard. You can upload and manage all
                        your documents once and reuse them across multiple
                        enrollments.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                        onClick={() => {}}
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        <FileText size={14} className="mr-1" />
                        Manage Documents
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 bg-blue-50 rounded-xl border border-blue-100 p-3" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  <strong>Note:</strong> Make sure you have uploaded all
                  required documents in the Documents section before submitting
                  your enrollment. Your documents will be automatically
                  referenced during the enrollment process.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 rounded-xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="space-y-4">
          <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100">
            <Button variant="ghost" onClick={onBack} className="rounded-xl" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              Back
            </Button>
            <Button
              onClick={onOpenSubmit}
              className="bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 transition-all duration-300 hover:shadow-lg rounded-xl"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Check
                size={16}
                className="mr-2 transition-transform duration-200 hover:rotate-12"
              />
              Submit Enrollment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
