'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, FileText } from '@phosphor-icons/react'

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
    'blue-800': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8',
    'blue-900': '#1e3a8a',
  }
  return colorMap[color] || '#1e3a8a'
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
  return (
    <div
      className={`space-y-6 transition-all duration-500 ${
        animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
              <Check size={20} className="text-white" weight="bold" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Confirm Your Enrollment
              </h2>
              <p className="text-sm text-gray-600">Review all information and submit your enrollment</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-none bg-gray-50 border-1 shadow-sm border-blue-900">
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                Personal Information
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                      Full Name
                    </label>
                    <p className="text-sm text-gray-900 mt-1 font-mono">
                      {personalInfo.firstName} {personalInfo.middleName} {personalInfo.lastName} {personalInfo.nameExtension}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Email Address
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{personalInfo.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Phone Number
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{personalInfo.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalInfo.birthMonth && personalInfo.birthDay && personalInfo.birthYear
                          ? `${personalInfo.birthMonth}/${personalInfo.birthDay}/${personalInfo.birthYear}`
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Place of Birth
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{personalInfo.placeOfBirth || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Gender
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{personalInfo.gender || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Civil Status
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{personalInfo.civilStatus || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Citizenship
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{personalInfo.citizenship || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                        Religion
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono  ">{personalInfo.religion || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                Enrollment Details
              </h4>
              <div className="mb-4">
                <div
                  className="p-4 border border-gray-200 bg-white shadow-inner"
                  style={{
                    backgroundColor:
                      selectedLevel === 'high-school' && selectedGrade
                        ? getColorValue(selectedGrade.color)
                        : selectedLevel === 'college' && selectedCourse
                        ? getColorValue(selectedCourse.color)
                        : '#1e40af',
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Check size={16} weight="fill" style={{ color: '#1e40af' }} />
                    </div>
                    <div className="flex-1">
                      {selectedLevel === 'high-school' && selectedGrade && (
                        <>
                          <h5 className="font-medium text-white text-sm" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            Grade {selectedGrade.gradeLevel} {selectedGrade.strand}
                          </h5>
                          <p className="text-xs text-white">{selectedGrade.department} Department</p>
                        </>
                      )}
                      {selectedLevel === 'college' && selectedCourse && selectedYear && selectedSemester && (
                        <>
                          <h5 className="font-medium text-white text-sm" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                            {selectedCourse.code} {selectedYear}{' '}
                            {selectedSemester === 'first-sem' ? 'First Semester' : 'Second Semester'}
                          </h5>
                          <p className="text-xs text-white">{selectedCourse.name}</p>
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
                  <span className="text-sm text-gray-600">Enrollment Date:</span>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Academic Year:</span>
                  <span className="text-sm text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    {new Date().getFullYear()} - {new Date().getFullYear() + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none bg-gray-50 border-1 shadow-sm border-blue-900">
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
              Document Management
            </h4>

            <div className="space-y-4">
              <div className={`p-4 border ${documentsStatus?.isComplete ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-medium text-sm text-gray-900`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Required Documents Status
                  </h5>
                  <div
                    className={`flex items-center gap-1 text-xs px-2 py-1 ${
                      documentsStatus?.isComplete ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {documentsStatus?.isComplete ? <Check size={12} /> : <FileText size={12} />}
                    <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {documentsStatus?.uploaded || 0}/{documentsStatus?.required || 4}
                    </span>
                  </div>
                </div>
                <p className={`text-xs text-gray-600`}>
                  {documentsStatus?.isComplete
                    ? 'All required documents have been uploaded. You can proceed with enrollment.'
                    : `You need to upload ${(documentsStatus?.required || 4) - (documentsStatus?.uploaded || 0)} more required document(s) before submitting your enrollment.`}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-900 flex items-center justify-center">
                    <FileText size={16} className="text-white" weight="bold" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Documents Managed Separately
                    </h5>
                    <p className="text-xs text-gray-600 mb-3">
                      Your academic documents are now managed in the Documents section of your dashboard. You can upload and manage all your documents once and reuse them across multiple enrollments.
                    </p>
                    <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => {}}>
                      <FileText size={14} className="mr-1" />
                      Manage Documents
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-gray-100 p-3">
                <strong>Note:</strong> Make sure you have uploaded all required documents in the Documents section before submitting your enrollment. Your documents will be automatically referenced during the enrollment process.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-none bg-gray-50 border-1 shadow-sm border-blue-900">
        <div className="space-y-4">
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onOpenSubmit} className={`bg-blue-900 hover:bg-blue-900 transition-all duration-300  hover:shadow-lg`}>
              <Check size={16} className="mr-2 transition-transform duration-200 hover:rotate-12" />
              Submit Enrollment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


