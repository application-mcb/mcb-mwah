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
import { ComparisonData } from '../types'
import { generateInsight } from '../utils/insight-generator'

interface ComparisonPrintContentProps {
  comparisonData: ComparisonData[]
  selectedAYs: string[]
  summary: string
  registrarName?: string
  metric?: string
  metricTitle?: string
}

export const ComparisonPrintContent: React.FC<ComparisonPrintContentProps> = ({
  comparisonData,
  selectedAYs,
  summary,
  registrarName,
  metric,
  metricTitle,
}) => {
  // Generate colors and gradients for each AY
  const ayGradients: Record<
    string,
    { base: string; light: string; gradientId: string }
  > = {}
  const colorShades = [
    { base: '#1e40af', light: '#3b82f6' }, // blue-900 to blue-500
    { base: '#1e3a8a', light: '#2563eb' }, // blue-950 to blue-600
    { base: '#2563eb', light: '#60a5fa' }, // blue-600 to blue-400
    { base: '#3b82f6', light: '#93c5fd' }, // blue-500 to blue-300
    { base: '#1e40af', light: '#60a5fa' }, // blue-900 to blue-400
  ]
  selectedAYs.forEach((ay, index) => {
    const shade = colorShades[index % colorShades.length]
    ayGradients[ay] = {
      base: shade.base,
      light: shade.light,
      gradientId: `gradient-print-${ay.replace(/\s+/g, '-')}`,
    }
  })

  // Helper function to create chart data based on metric
  const createChartData = (data: ComparisonData) => {
    if (!metric || !data || !data.analytics) return []

    switch (metric) {
      case 'grade':
        const gradeEntries = Object.entries(
          data.analytics.studentsByGrade || {}
        )
        if (gradeEntries.length === 0) return []
        return gradeEntries
          .map(([grade, count]) => ({
            name: `Grade ${grade}`,
            students: Number(count) || 0,
          }))
          .sort(
            (a, b) =>
              parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1])
          )
      case 'strand':
        const strandEntries = Object.entries(
          data.analytics.studentsByStrand || {}
        )
        if (strandEntries.length === 0) return []
        return strandEntries.map(([strand, count]) => ({
          name: strand,
          students: Number(count) || 0,
        }))
      case 'course':
        const courseEntries = Object.entries(
          data.analytics.studentsByCourse || {}
        )
        if (courseEntries.length === 0) return []
        return courseEntries.map(([course, count]) => ({
          name: course.length > 20 ? course.substring(0, 20) + '...' : course,
          students: Number(count) || 0,
        }))
      case 'regularIrregular':
        const regular = Number(data.analytics.regularVsIrregular?.regular) || 0
        const irregular =
          Number(data.analytics.regularVsIrregular?.irregular) || 0
        if (regular === 0 && irregular === 0) return []
        return [
          {
            name: 'Regular',
            value: regular,
          },
          {
            name: 'Irregular',
            value: irregular,
          },
        ]
      case 'gender':
        const genderEntries = Object.entries(
          data.analytics.genderDistribution || {}
        )
        if (genderEntries.length === 0) return []
        return genderEntries.map(([gender, count]) => ({
          name: gender,
          value: Number(count) || 0,
        }))
      case 'age':
        const ageEntries = Object.entries(
          data.analytics.birthdateRange?.ageGroups || {}
        )
        if (ageEntries.length === 0) return []
        return ageEntries.map(([ageGroup, count]) => ({
          name: ageGroup,
          students: Number(count) || 0,
        }))
      case 'province':
        const provinceEntries = Object.entries(
          data.analytics.locationBreakdown?.province || {}
        )
        if (provinceEntries.length === 0) return []
        return provinceEntries
          .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
          .slice(0, 10)
          .map(([province, count]) => ({
            name:
              province.length > 20
                ? province.substring(0, 20) + '...'
                : province,
            students: Number(count) || 0,
          }))
      case 'schoolType':
        const schoolTypeEntries = Object.entries(
          data.analytics.previousSchoolType || {}
        )
        if (schoolTypeEntries.length === 0) return []
        return schoolTypeEntries.map(([schoolType, count]) => ({
          name: schoolType,
          students: Number(count) || 0,
        }))
      case 'religion':
        const religionEntries = Object.entries(
          data.analytics.religionDistribution || {}
        )
        if (religionEntries.length === 0) return []
        return religionEntries.map(([religion, count]) => ({
          name:
            religion.length > 20 ? religion.substring(0, 20) + '...' : religion,
          students: Number(count) || 0,
        }))
      case 'municipality':
        const municipalityEntries = Object.entries(
          data.analytics.locationBreakdown?.municipality || {}
        )
        if (municipalityEntries.length === 0) return []
        return municipalityEntries
          .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
          .slice(0, 10)
          .map(([municipality, count]) => ({
            name:
              municipality.length > 20
                ? municipality.substring(0, 20) + '...'
                : municipality,
            students: Number(count) || 0,
          }))
      case 'barangay':
        const barangayEntries = Object.entries(
          data.analytics.locationBreakdown?.barangay || {}
        )
        if (barangayEntries.length === 0) return []
        return barangayEntries
          .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
          .slice(0, 10)
          .map(([barangay, count]) => ({
            name:
              barangay.length > 20
                ? barangay.substring(0, 20) + '...'
                : barangay,
            students: Number(count) || 0,
          }))
      default:
        return []
    }
  }

  const getDataKey = () => {
    if (metric === 'regularIrregular' || metric === 'gender') {
      return 'value'
    }
    return 'students'
  }

  const hasData = comparisonData.some((data) => {
    if (!metric) return false
    switch (metric) {
      case 'grade':
        return Object.keys(data.analytics.studentsByGrade).length > 0
      case 'strand':
        return Object.keys(data.analytics.studentsByStrand).length > 0
      case 'course':
        return Object.keys(data.analytics.studentsByCourse).length > 0
      case 'regularIrregular':
        return (
          data.analytics.regularVsIrregular.regular > 0 ||
          data.analytics.regularVsIrregular.irregular > 0
        )
      case 'gender':
        return Object.keys(data.analytics.genderDistribution).length > 0
      case 'age':
        return Object.keys(data.analytics.birthdateRange.ageGroups).length > 0
      case 'province':
        return Object.keys(data.analytics.locationBreakdown.province).length > 0
      case 'schoolType':
        return Object.keys(data.analytics.previousSchoolType).length > 0
      case 'religion':
        return Object.keys(data.analytics.religionDistribution || {}).length > 0
      case 'municipality':
        return (
          Object.keys(data.analytics.locationBreakdown?.municipality || {})
            .length > 0
        )
      case 'barangay':
        return (
          Object.keys(data.analytics.locationBreakdown?.barangay || {}).length >
          0
        )
      default:
        return false
    }
  })

  return (
    <div className="print-document p-3">
      {/* Header */}
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
          className="text-lg font-medium text-gray-900 mb-2"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          {metricTitle || 'Academic Year Comparison Analytics'}
        </h2>
        <p
          className="text-sm text-gray-600"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Comparing: {selectedAYs.join(', ')}
        </p>
      </div>

      {/* Metric Comparison */}
      {hasData && metric && comparisonData && comparisonData.length > 0 && (
        <div className="print-section mb-6">
          <h3
            className="text-sm font-medium text-gray-700 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            {metricTitle || 'Comparison'}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {comparisonData
              .filter((data) => data && data.analytics)
              .map((data) => {
                const chartData = createChartData(data)
                const insight = generateInsight({
                  analytics: data.analytics,
                  totalStudents: data.totalStudents,
                  studentsByDepartment: data.studentsByDepartment,
                  metric,
                })

                // Validate chart data - ensure we have valid data before filtering
                if (!chartData || chartData.length === 0) {
                  return (
                    <div key={data.ay} className="space-y-2">
                      <h4
                        className="text-xs font-medium text-gray-700"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {data.ay}
                      </h4>
                      <div
                        className="w-full flex items-center justify-center"
                        style={{
                          height: '300px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      >
                        <p
                          className="text-xs text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          No data available
                        </p>
                      </div>
                      <p
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {insight}
                      </p>
                    </div>
                  )
                }

                // Validate chart data values
                const dataKey = getDataKey()
                const validChartData = chartData
                  .map((item: any) => {
                    const value = item[dataKey]
                    const numValue =
                      typeof value === 'number' ? value : Number(value)
                    // Allow 0 values - they're valid data points
                    if (
                      value !== undefined &&
                      value !== null &&
                      !isNaN(numValue) &&
                      numValue >= 0
                    ) {
                      return {
                        ...item,
                        [dataKey]: numValue,
                      }
                    }
                    return null
                  })
                  .filter((item: any) => item !== null)

                if (!validChartData || validChartData.length === 0) {
                  return (
                    <div key={data.ay} className="space-y-2">
                      <h4
                        className="text-xs font-medium text-gray-700"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {data.ay}
                      </h4>
                      <div
                        className="w-full flex items-center justify-center"
                        style={{
                          height: '300px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                      >
                        <p
                          className="text-xs text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          No data available
                        </p>
                      </div>
                      <p
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {insight}
                      </p>
                    </div>
                  )
                }

                return (
                  <div key={data.ay} className="space-y-2">
                    <h4
                      className="text-xs font-medium text-gray-700"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <div
                      className="w-full"
                      style={{
                        height: '300px',
                        minHeight: '300px',
                        position: 'relative',
                      }}
                    >
                      {validChartData && validChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={validChartData}
                            margin={{
                              top: 5,
                              right: 5,
                              bottom:
                                metric === 'strand' ||
                                metric === 'course' ||
                                metric === 'province' ||
                                metric === 'religion' ||
                                metric === 'municipality' ||
                                metric === 'barangay'
                                  ? 60
                                  : 20,
                              left: 5,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id={ayGradients[data.ay].gradientId}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor={ayGradients[data.ay].base}
                                  stopOpacity={1}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={ayGradients[data.ay].light}
                                  stopOpacity={0.8}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            {metric === 'strand' ||
                            metric === 'course' ||
                            metric === 'province' ||
                            metric === 'religion' ||
                            metric === 'municipality' ||
                            metric === 'barangay' ? (
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 9, fill: '#6b7280' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              />
                            ) : (
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: '#6b7280' }}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              />
                            )}
                            <YAxis
                              tick={{ fontSize: 10, fill: '#6b7280' }}
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
                              dataKey={getDataKey()}
                              fill={`url(#${ayGradients[data.ay].gradientId})`}
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
                          <p
                            className="text-xs text-gray-500"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            No chart data available
                          </p>
                        </div>
                      )}
                    </div>
                    <p
                      className="text-xs text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {insight}
                    </p>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="print-section mb-6">
        <h3
          className="text-sm font-medium text-gray-700 mb-3"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          Comparison Summary
        </h3>
        <p
          className="text-xs text-gray-600"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          {summary}
        </p>
      </div>

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
