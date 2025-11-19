import React from 'react'
import { GraduationCap } from '@phosphor-icons/react'

interface EmptyStateProps {
  message: string
  hint?: string
}

export const StudentAnalyticsEmptyState: React.FC<EmptyStateProps> = ({
  message,
  hint,
}) => (
  <div className="bg-white/95 border border-blue-100 rounded-xl shadow-sm p-10 text-center space-y-4">
    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 mx-auto flex items-center justify-center text-white">
      <GraduationCap size={28} weight="fill" />
    </div>
    <p
      className="text-lg text-gray-900"
      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
    >
      {message}
    </p>
    {hint && (
      <p
        className="text-sm text-gray-500"
        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
      >
        {hint}
      </p>
    )}
  </div>
)


