'use client'

import React from 'react'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'

interface BasePrintContentProps {
  title: string
  includeChart: boolean
  includeInsights: boolean
  includeForecast: boolean
  registrarName?: string
  chartContent?: React.ReactNode
  insight?: string
  forecast?: string
}

export const BasePrintContent: React.FC<BasePrintContentProps> = ({
  title,
  includeChart,
  includeInsights,
  includeForecast,
  registrarName,
  chartContent,
  insight,
  forecast,
}) => {
  return (
    <div className="print-document p-3">
      {/* Header with Logo and School Info */}
      <div className="print-header mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Marian College Logo"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1
                className="text-md font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {SCHOOL_NAME_FORMAL}
              </h1>
              <p
                className="text-xs text-gray-600 font-mono"
                style={{ fontWeight: 400 }}
              >
                908 Gil Carlos St. San Jose, Baliwag, Bulacan
              </p>
              <p className="text-xs font-mono text-gray-600">
                Date:{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="print-section mb-4">
        <h2
          className="text-lg font-medium text-gray-900 mb-4"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          {title} Analytics
        </h2>
      </div>

      {/* Chart Section */}
      {includeChart && chartContent && (
        <div className="print-section mb-6">
          <h3
            className="text-sm font-medium text-gray-700 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Chart
          </h3>
          {chartContent}
        </div>
      )}

      {/* Insights Section */}
      {includeInsights && insight && (
        <div className="print-section mb-6">
          <h3
            className="text-sm font-medium text-gray-700 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Insights
          </h3>
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {insight}
          </p>
        </div>
      )}

      {/* Forecast Section */}
      {includeForecast && forecast && (
        <div className="print-section mb-6">
          <h3
            className="text-sm font-medium text-gray-700 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Forecast
          </h3>
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {forecast}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="print-section mt-8">
        <div className="flex justify-between items-start pt-4">
          <div>
            <p
              className="text-xs text-black font-mono"
              style={{ fontWeight: 400 }}
            >
              Generated on{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="border-t border-black mb-2"></div>
            <p
              className="text-xs text-gray-900 font-medium"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {registrarName || 'Registrar'}
            </p>
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Registrar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
