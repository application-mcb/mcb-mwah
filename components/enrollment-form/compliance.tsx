'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from '@phosphor-icons/react'

type ComplianceStepProps = {
  animatingStep: boolean
  complianceChecked: boolean
  onComplianceCheck: () => void
  onProceed: () => void
}

export default function ComplianceStep({
  animatingStep,
  complianceChecked,
  onComplianceCheck,
  onProceed,
}: ComplianceStepProps) {
  return (
    <Card
      className={`p-8 border-none bg-gray-50 border-1 shadow-sm border-blue-900 h-full transition-all duration-500 ${
        animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-blue-900 flex items-center justify-center mx-auto">
          <BookOpen size={32} className="text-white" weight="fill" />
        </div>
        <div className="space-y-4 flex flex-col items-center">
          <h3
            className="text-xl font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Enrollment Compliance Agreement
          </h3>
          <p className="text-gray-600 text-sm text-justify max-w-2xl mx-auto border-1 shadow-sm border-blue-900 p-4 bg-blue-50">
            Before proceeding with enrollment, you must acknowledge and agree to comply with all school policies, academic requirements, and institutional guidelines. This includes maintaining academic integrity, following the code of conduct, and meeting all course prerequisites. By checking the box below, you confirm your understanding and commitment to these standards.
          </p>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="compliance-check"
              checked={complianceChecked}
              onChange={onComplianceCheck}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 transition-all duration-200"
            />

            <label
              htmlFor="compliance-check"
              className="text-sm text-gray-900 cursor-pointer"
            >
              I acknowledge and agree to comply with all school policies and requirements
            </label>
          </div>
        </div>

        <div className="space-y-4"></div>

        <Button
          onClick={onProceed}
          disabled={!complianceChecked}
          className={`bg-blue-900 hover:bg-blue-900 transition-all duration-300 hover:shadow-lg ${
            !complianceChecked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Proceed to Level Selection
        </Button>
      </div>
    </Card>
  )
}


