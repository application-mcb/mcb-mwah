'use client'

import React, { useState } from 'react'
import { ChartLineUp } from '@phosphor-icons/react'
import { ExtendedEnrollmentData } from '../enrollment-management/types'
import { StudentProfile } from './types'
import { MetricComparisonModal } from './metric-comparison-modal'

interface MetricComparisonButtonProps {
  enrollments: ExtendedEnrollmentData[]
  studentProfiles: Record<string, StudentProfile>
  availableAYs: string[]
  currentSemester: string
  metric: string
  metricTitle: string
  registrarName?: string
}

export const MetricComparisonButton: React.FC<
  MetricComparisonButtonProps
> = ({
  enrollments,
  studentProfiles,
  availableAYs,
  currentSemester,
  metric,
  metricTitle,
  registrarName,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={availableAYs.length < 2}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
          availableAYs.length >= 2
            ? 'bg-blue-900 text-white hover:bg-blue-800'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        <ChartLineUp size={16} weight="bold" />
        Compare
      </button>

      <MetricComparisonModal
        isOpen={isOpen}
        onClose={handleClose}
        enrollments={enrollments}
        studentProfiles={studentProfiles}
        availableAYs={availableAYs}
        currentSemester={currentSemester}
        metric={metric}
        metricTitle={metricTitle}
        registrarName={registrarName}
      />
    </>
  )
}

