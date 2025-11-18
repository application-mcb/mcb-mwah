'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'
import type { ChartDataPoint } from '../types'

interface GradePrintContentProps {
  gradeChartData: ChartDataPoint[]
  insight: string
  forecast: string
  includeChart: boolean
  includeInsights: boolean
  includeForecast: boolean
  registrarName?: string
}

export const GradePrintContent: React.FC<GradePrintContentProps> = ({
  gradeChartData,
  insight,
  forecast,
  includeChart,
  includeInsights,
  includeForecast,
  registrarName,
}) => {
  // Validate and filter chart data
  const validChartData = gradeChartData
    ? gradeChartData
        .map((item) => {
          const value = item.students
          const numValue = typeof value === 'number' ? value : Number(value)
          if (
            value !== undefined &&
            value !== null &&
            !isNaN(numValue) &&
            numValue >= 0
          ) {
            return {
              ...item,
              students: numValue,
            }
          }
          return null
        })
        .filter((item) => item !== null)
    : []

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
          Students by Grade Level Analytics
        </h2>
      </div>

      {/* Chart Section */}
      {includeChart && (
        <div className="print-section mb-6">
          <h3
            className="text-sm font-medium text-gray-700 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Chart
          </h3>
          <div className="w-full" style={{ height: '400px', minHeight: '400px', position: 'relative' }}>
            {validChartData && validChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={validChartData}>
                <defs>
                  <linearGradient
                    id="colorGradePrint"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                  }}
                />
                <Bar
                  dataKey="students"
                  fill="url(#colorGradePrint)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
                <p
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  No chart data available
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights Section */}
      {includeInsights && (
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
      {includeForecast && (
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
        <div className="flex justify-between items-start pt-4 ">
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
