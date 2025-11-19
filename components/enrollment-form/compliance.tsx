'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Shield,
  GraduationCap,
  FileText,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import {
  sectionTitleClass,
  sectionSubtextClass,
  headerIconWrapperClass,
  primaryButtonClass,
  ghostButtonClass,
} from '@/components/enrollment-form/theme'

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
      className={`space-y-6 transition-all duration-500 text-blue-50 ${
        animatingStep ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="rounded-2xl border border-blue-800/40 bg-white/5 backdrop-blur-lg p-6 sm:p-8 space-y-5 text-center shadow-inner shadow-blue-950/30">
        <div className="flex flex-col items-center gap-4">
          <div
            className={`${headerIconWrapperClass} w-16 h-16`}
            aria-hidden="true"
          >
            <CurrentIcon size={28} className="text-blue-50" weight="fill" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              {compliancePages.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentPage
                      ? 'w-6 bg-blue-300'
                      : 'w-2 bg-blue-900/40'
                  }`}
                />
              ))}
            </div>

            <h3 className={`${sectionTitleClass} text-center`}>
              {currentCompliance.title}
            </h3>
            <p className={`${sectionSubtextClass} text-center`}>
              Slide through all compliance statements to continue
            </p>
          </div>
        </div>

        <div className="text-sm text-left max-w-3xl mx-auto rounded-2xl border border-blue-800/40 bg-blue-950/40 p-4 sm:p-6 whitespace-pre-line leading-relaxed text-blue-100 shadow-inner shadow-blue-950/40">
          {currentCompliance.content}
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        {isLastPage ? (
          <div className="space-y-4">
            <label
              htmlFor="compliance-check"
              className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer text-blue-100"
            >
              <input
                type="checkbox"
                id="compliance-check"
                checked={complianceChecked}
                onChange={onComplianceCheck}
                className="w-5 h-5 mt-0.5 rounded-md border border-blue-700/40 bg-blue-950/60 text-blue-200 focus:ring-blue-200 focus:ring-offset-0"
              />
              I acknowledge and agree to comply with all school policies and
              requirements
            </label>

            <Button
              onClick={onProceed}
              disabled={!complianceChecked}
              className={`${primaryButtonClass} w-full sm:w-auto sm:px-6 ${
                !complianceChecked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Proceed to Level Selection
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              variant="outline"
              className={`${ghostButtonClass} flex items-center justify-center gap-2 w-full sm:w-auto ${
                currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <CaretLeft size={16} />
              <span>Previous</span>
            </Button>

            <Button
              onClick={handleNext}
              className={`${primaryButtonClass} flex items-center justify-center gap-2 w-full sm:w-auto`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <span>Next</span>
              <CaretRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
