'use client'

import React from 'react'
import { ExtendedEnrollmentData } from '../types'
import { formatFullName } from '../utils/format'
import { Calculator } from '@phosphor-icons/react'
import RegistrarGradesTab from '@/components/grades/RegistrarGradesTab'

interface GradesTabProps {
  viewingEnrollment: ExtendedEnrollmentData | null
}

export default function GradesTab({ viewingEnrollment }: GradesTabProps) {
  return viewingEnrollment ? (
    <div className="space-y-4">
      <h3
        className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <Calculator size={14} weight="fill" className="text-white" />
        </div>
        Student Grades
      </h3>
      <RegistrarGradesTab
        studentId={viewingEnrollment.userId}
        studentName={formatFullName(
          viewingEnrollment.personalInfo?.firstName,
          viewingEnrollment.personalInfo?.middleName,
          viewingEnrollment.personalInfo?.lastName,
          viewingEnrollment.personalInfo?.nameExtension
        )}
        studentNumber={viewingEnrollment.enrollmentInfo?.studentId}
      />
    </div>
  ) : (
    <div
      className="px-6 py-10 text-center text-xs text-gray-500"
      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
    >
      Select a student to view grades.
    </div>
  )
}
