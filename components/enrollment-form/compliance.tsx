'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Shield,
  GraduationCap,
  FileText,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'

type ComplianceStepProps = {
  animatingStep: boolean
  complianceChecked: boolean
  onComplianceCheck: () => void
  onProceed: () => void
}

const compliancePages = [
  {
    icon: Shield,
    title: 'Academic Integrity & Code of Conduct',
    content: `Academic integrity is the foundation of our educational community. You must commit to:

• Maintaining honesty in all academic work and assessments
• Avoiding plagiarism, cheating, or any form of academic dishonesty
• Respecting intellectual property rights of others
• Following the established code of student conduct
• Reporting any violations of academic integrity you witness
• Understanding that violations may result in severe penalties including suspension or expulsion

Your commitment to academic integrity ensures a fair and respectful learning environment for all students.`,
  },
  {
    icon: GraduationCap,
    title: 'Course Prerequisites & Academic Requirements',
    content: `Successful enrollment requires meeting all academic prerequisites and standards:

• All course prerequisites must be completed with satisfactory grades
• Minimum GPA requirements must be maintained for continued enrollment
• Required general education courses must be completed in sequence
• Major-specific requirements must be fulfilled as outlined in your program
• Transfer credits will be evaluated and approved by academic advisors
• Academic probation policies apply if GPA falls below minimum standards

Failure to meet these requirements may result in course withdrawal or program dismissal. Regular academic advising is essential for compliance.`,
  },
  {
    icon: FileText,
    title: 'Institutional Policies & Guidelines',
    content: `As a member of our academic community, you must adhere to all institutional policies:

• Attendance policies must be followed for all enrolled courses
• Financial obligations including tuition and fees must be met by deadlines
• Health and safety regulations must be observed at all times
• Technology use policies apply to all campus resources and online platforms
• Non-discrimination and anti-harassment policies protect all community members
• Emergency procedures must be understood and followed when applicable

These policies ensure a safe, equitable, and productive learning environment. Violations may result in disciplinary action up to and including permanent dismissal.`,
  },
]

export default function ComplianceStep({
  animatingStep,
  complianceChecked,
  onComplianceCheck,
  onProceed,
}: ComplianceStepProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const isLastPage = currentPage === compliancePages.length - 1

  const handleNext = () => {
    if (currentPage < compliancePages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const currentCompliance = compliancePages[currentPage]
  const CurrentIcon = currentCompliance.icon

  return (
    <div
      className={`p-4 sm:p-6 lg:p-8 border-none bg-gray-50 border-1 shadow-sm border-blue-900 h-full transition-all duration-500 ${
        animatingStep
          ? 'opacity-0 transform translate-x-4'
          : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="text-center space-y-4 sm:space-y-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-900 flex items-center justify-center mx-auto">
          <CurrentIcon
            size={24}
            className="sm:w-8 sm:h-8 text-white"
            weight="fill"
          />
        </div>

        <div className="space-y-3 sm:space-y-4 flex flex-col items-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {compliancePages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentPage ? 'bg-blue-900' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <h3
            className="text-lg sm:text-xl font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            {currentCompliance.title}
          </h3>

          <div className="text-gray-600 text-sm text-left max-w-2xl mx-auto border-1 shadow-sm border-blue-900 p-3 sm:p-4 lg:p-6 bg-blue-50 whitespace-pre-line leading-relaxed">
            {currentCompliance.content}
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          {isLastPage ? (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 justify-start">
                <input
                  type="checkbox"
                  id="compliance-check"
                  checked={complianceChecked}
                  onChange={onComplianceCheck}
                  className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500 transition-all duration-200 flex-shrink-0"
                />
                <label
                  htmlFor="compliance-check"
                  className="text-sm text-gray-900 cursor-pointer leading-relaxed"
                >
                  I acknowledge and agree to comply with all school policies and
                  requirements
                </label>
              </div>

              <Button
                onClick={onProceed}
                disabled={!complianceChecked}
                className={`bg-blue-900 hover:bg-blue-900 transition-all duration-300 hover:shadow-lg w-full sm:w-auto sm:px-6 ${
                  !complianceChecked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Proceed to Level Selection
              </Button>
            </div>
          ) : (
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <Button
                onClick={handlePrevious}
                disabled={currentPage === 0}
                variant="outline"
                className={`flex items-center justify-center space-x-2 w-full sm:w-auto ${
                  currentPage === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-50'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <CaretLeft size={16} />
                <span>Previous</span>
              </Button>

              <Button
                onClick={handleNext}
                className="flex items-center justify-center space-x-2 bg-blue-900 hover:bg-blue-900 transition-all duration-300 hover:shadow-lg w-full sm:w-auto"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <span>Next</span>
                <CaretRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
