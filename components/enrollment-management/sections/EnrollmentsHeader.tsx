'use client'

import React from 'react'
import { GraduationCap, Calendar } from '@phosphor-icons/react'

interface Props {
  currentAYFilter: string
  currentSemesterFilter: string
}

const EnrollmentsHeader: React.FC<Props> = ({
  currentAYFilter,
  currentSemesterFilter,
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
      <h1
        className="text-2xl font-light text-white flex items-center gap-2"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
          <GraduationCap size={20} weight="fill" className="text-blue-900" />
        </div>
        Student Enrollments
      </h1>
      <p
        className="text-xs text-blue-100 mt-1"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        Manage and review student enrollment applications
      </p>
      {currentAYFilter && (
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
            <Calendar size={12} className="text-blue-900" weight="bold" />
            <span className="text-xs font-mono text-blue-900 font-mono">
              AY: {currentAYFilter}
            </span>
          </div>
          {currentSemesterFilter && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
              <Calendar size={12} className="text-blue-900" weight="bold" />
              <span className="text-xs font-mono text-blue-900 font-mono">
                Semester: {currentSemesterFilter}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnrollmentsHeader
