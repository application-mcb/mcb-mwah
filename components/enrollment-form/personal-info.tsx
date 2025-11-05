'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Envelope, Phone, IdentificationCard, Heart } from '@phosphor-icons/react'

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

type PersonalInfoStepProps = {
  animatingStep: boolean
  selectedLevel: 'high-school' | 'college' | null
  selectedGrade: any | null
  selectedCourse: any | null
  selectedYear: number | null
  selectedSemester: 'first-sem' | 'second-sem' | null
  personalInfo: PersonalInfo
  calculatedAge: number | null
  onBackGrade: () => void
  onBackSemester: () => void
  onProceedToConfirmation: () => void
  onChange: (field: string, value: string) => void
  onPhoneChange: (value: string) => void
  onPhoneKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export default function PersonalInfoStep({
  animatingStep,
  selectedLevel,
  selectedGrade,
  selectedCourse,
  selectedYear,
  selectedSemester,
  personalInfo,
  calculatedAge,
  onBackGrade,
  onBackSemester,
  onProceedToConfirmation,
  onChange,
  onPhoneChange,
  onPhoneKeyDown,
}: PersonalInfoStepProps) {
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
              <User size={20} className="text-white" weight="bold" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Personal Information
              </h2>
              <p className="text-sm text-gray-600">Review and update your personal details for enrollment</p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            if (selectedLevel === 'college') {
              onBackSemester()
            } else {
              onBackGrade()
            }
          }}
        >
          Back
        </Button>
      </div>

      <Card className="p-8 border-none bg-gray-50 border-1 shadow-sm border-blue-900">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
              Full Name
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) => onChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Middle Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={personalInfo.middleName}
                  onChange={(e) => onChange('middleName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                  placeholder="Enter middle name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) => onChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Extension <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={personalInfo.nameExtension}
                  onChange={(e) => onChange('nameExtension', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                  placeholder="Jr., Sr., III, etc."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Envelope size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => onChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    onKeyDown={onPhoneKeyDown}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    placeholder="+63 962 781 1434"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <select
                      value={personalInfo.birthMonth || ''}
                      onChange={(e) => onChange('birthMonth', e.target.value)}
                      className="w-full px-3 py-2 h-10 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                    >
                      <option value="">Month</option>
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={personalInfo.birthDay || ''}
                      onChange={(e) => onChange('birthDay', e.target.value)}
                      className="w-full px-4 py-2 h-10 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day.toString().padStart(2, '0')}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={personalInfo.birthYear || ''}
                      onChange={(e) => onChange('birthYear', e.target.value)}
                      className="w-full px-4 py-2 h-10 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center min-h-[40px]">
                    {calculatedAge !== null ? (
                      <div className="px-3 py-2 bg-white border border-gray-300 text-sm font-light text-gray-700 text-center min-w-[60px]">
                        {calculatedAge} Years Old
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-xs text-gray-400 text-center min-w-[60px]">Age</div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Place of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={personalInfo.placeOfBirth}
                  onChange={(e) => onChange('placeOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                  placeholder="Enter place of birth"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={personalInfo.gender}
                  onChange={(e) => onChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Civil Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={personalInfo.civilStatus}
                  onChange={(e) => onChange('civilStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg "
                >
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Citizenship <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdentificationCard size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={personalInfo.citizenship}
                    onChange={(e) => onChange('citizenship', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    placeholder="Enter citizenship"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Religion <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Heart size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={personalInfo.religion}
                    onChange={(e) => onChange('religion', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    placeholder="Enter religion"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button onClick={onProceedToConfirmation} className="bg-blue-900 hover:bg-blue-900 transition-all duration-300  hover:shadow-lg">
              Proceed to Confirmation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


