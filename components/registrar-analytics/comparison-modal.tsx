'use client'

import React, { useState, useMemo } from 'react'
import { X, Printer } from '@phosphor-icons/react'
import { ExtendedEnrollmentData } from '../enrollment-management/types'
import { StudentProfile } from './types'
import { useComparisonData } from './hooks/useComparisonData'
import { ComparisonCharts } from './comparison-charts'
import { generateComparisonSummary } from './utils/comparison-summary'
import Print from '@/components/print'
import { ComparisonPrintContent } from './print/comparison-print-content'

interface ComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  enrollments: ExtendedEnrollmentData[]
  studentProfiles: Record<string, StudentProfile>
  availableAYs: string[]
  currentSemester: string
  registrarName?: string
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  enrollments,
  studentProfiles,
  availableAYs,
  currentSemester,
  registrarName,
}) => {
  const [selectedAYs, setSelectedAYs] = useState<string[]>(() => {
    // Initialize with all available AYs
    return availableAYs.length > 0 ? [...availableAYs] : []
  })
  const [isPrintOpen, setIsPrintOpen] = useState(false)

  const comparisonData = useComparisonData({
    enrollments,
    studentProfiles,
    selectedAYs,
    selectedSemester: currentSemester,
  })

  const summary = useMemo(() => {
    return generateComparisonSummary(comparisonData)
  }, [comparisonData])

  const handleToggleAY = (ay: string) => {
    setSelectedAYs((prev) => {
      if (prev.includes(ay)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev
        return prev.filter((a) => a !== ay)
      } else {
        return [...prev, ay]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedAYs([...availableAYs])
  }

  const handlePrint = () => {
    setIsPrintOpen(true)
  }

  const handleClosePrint = () => {
    setIsPrintOpen(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2
                className="text-xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Academic Year Comparison
              </h2>
              <p
                className="text-sm text-gray-600 mt-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Compare analytics across multiple academic years
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={selectedAYs.length === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedAYs.length > 0
                    ? 'bg-blue-900 text-white hover:bg-blue-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <Printer size={16} weight="bold" />
                Print
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <X size={20} weight="bold" />
              </button>
            </div>
          </div>

          {/* AY Filter Pills */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Select Academic Years to Compare
              </label>
              {availableAYs.length > selectedAYs.length && (
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-900 hover:text-blue-800 font-medium"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Select All
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {availableAYs.map((ay) => {
                const isSelected = selectedAYs.includes(ay)
                return (
                  <button
                    key={ay}
                    onClick={() => handleToggleAY(ay)}
                    disabled={!isSelected && selectedAYs.length === 0}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-900 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                    } ${selectedAYs.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {ay}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedAYs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p
                  className="text-gray-500 text-center"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Please select at least one academic year to compare.
                </p>
              </div>
            ) : comparisonData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p
                  className="text-gray-500 text-center"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  No data available for the selected academic years.
                </p>
              </div>
            ) : (
              <>
                <ComparisonCharts
                  comparisonData={comparisonData}
                  selectedAYs={selectedAYs}
                />

                {/* Summary */}
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h3
                    className="text-lg font-medium text-gray-900 mb-3"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Comparison Summary
                  </h3>
                  <p
                    className="text-sm text-gray-700 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {summary}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {isPrintOpen && selectedAYs.length > 0 && (
        <Print
          onClose={handleClosePrint}
          title="Academic Year Comparison Analytics"
        >
          <ComparisonPrintContent
            comparisonData={comparisonData}
            selectedAYs={selectedAYs}
            summary={summary}
            registrarName={registrarName}
          />
        </Print>
      )}
    </>
  )
}

