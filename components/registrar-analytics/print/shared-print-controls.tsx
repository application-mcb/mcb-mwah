'use client'

import React, { useState } from 'react'
import { Printer, Gear } from '@phosphor-icons/react'
import Print from '@/components/print'
import { BasePrintContent } from './base-print-content'

interface SharedPrintControlsProps {
  title: string
  chartContent: React.ReactNode
  insight: string
  forecast: string
  registrarName?: string
}

export const SharedPrintControls: React.FC<SharedPrintControlsProps> = ({
  title,
  chartContent,
  insight,
  forecast,
  registrarName,
}) => {
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [includeChart, setIncludeChart] = useState(true)
  const [includeInsights, setIncludeInsights] = useState(true)
  const [includeForecast, setIncludeForecast] = useState(true)

  const handlePrintClick = () => {
    const hasAnySection = includeChart || includeInsights || includeForecast
    if (!hasAnySection) {
      return
    }
    setIsPrintOpen(true)
  }

  const handleClosePrint = () => {
    setIsPrintOpen(false)
  }

  const hasAnySection = includeChart || includeInsights || includeForecast

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrintClick}
          disabled={!hasAnySection}
          className={`px-4 py-2 text-white text-sm font-medium transition-colors flex items-center gap-2 rounded-lg ${
            hasAnySection
              ? 'bg-blue-900 hover:bg-blue-800'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Printer size={16} weight="fill" />
          Print Analytics
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 transition-colors flex items-center gap-2 rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Gear size={16} weight="fill" />
            Settings
          </button>
          {showSettings && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSettings(false)}
              />
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20 min-w-[200px]">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeChart}
                      onChange={(e) => setIncludeChart(e.target.checked)}
                      className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                    />
                    <span
                      className="text-sm text-gray-700"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Chart
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeInsights}
                      onChange={(e) => setIncludeInsights(e.target.checked)}
                      className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                    />
                    <span
                      className="text-sm text-gray-700"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Insights
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeForecast}
                      onChange={(e) => setIncludeForecast(e.target.checked)}
                      className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                    />
                    <span
                      className="text-sm text-gray-700"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Forecast
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isPrintOpen && hasAnySection && (
        <Print onClose={handleClosePrint} title={`${title} Analytics`}>
          <BasePrintContent
            title={title}
            includeChart={includeChart}
            includeInsights={includeInsights}
            includeForecast={includeForecast}
            registrarName={registrarName}
            chartContent={chartContent}
            insight={insight}
            forecast={forecast}
          />
        </Print>
      )}
    </>
  )
}

