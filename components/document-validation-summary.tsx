'use client'

import React from 'react'
import { DocumentValidation } from '@/lib/types/document-validation'
import { Check, X, Warning, Eye } from '@phosphor-icons/react'

interface DocumentValidationSummaryProps {
  validation: DocumentValidation | null | undefined
  onViewFullDetails?: () => void
}

export default function DocumentValidationSummary({
  validation,
  onViewFullDetails,
}: DocumentValidationSummaryProps) {
  if (!validation || validation.validationStatus === 'pending') {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-emerald-800 text-white'
      case 'warning':
        return 'bg-yellow-600 text-white'
      case 'invalid':
        return 'bg-red-800 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <Check size={12} weight="bold" />
      case 'warning':
        return <Warning size={12} weight="bold" />
      case 'invalid':
        return <X size={12} weight="bold" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Valid'
      case 'warning':
        return 'Warning'
      case 'invalid':
        return 'Invalid'
      default:
        return 'Pending'
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <span
        className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 ${getStatusColor(
          validation.validationStatus
        )}`}
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        {getStatusIcon(validation.validationStatus)}
        {getStatusLabel(validation.validationStatus)}
      </span>
      {validation.confidenceScore > 0 && (
        <span
          className="text-xs text-gray-500"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          {(validation.confidenceScore * 100).toFixed(0)}% confidence
        </span>
      )}
      {onViewFullDetails && (
        <button
          onClick={onViewFullDetails}
          className="flex items-center gap-1 text-xs text-blue-900 hover:text-blue-950 transition-colors underline"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Eye size={12} />
          View Details
        </button>
      )}
    </div>
  )
}
