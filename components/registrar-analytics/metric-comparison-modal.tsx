'use client'

import React, { useState, useMemo } from 'react'
import { X, Printer } from '@phosphor-icons/react'
import { ExtendedEnrollmentData } from '../enrollment-management/types'
import { StudentProfile } from './types'
import { useComparisonData } from './hooks/useComparisonData'
import { generateComparisonSummary } from './utils/comparison-summary'
import { generateInsight } from './utils/insight-generator'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import Print from '@/components/print'
import { ComparisonPrintContent } from './print/comparison-print-content'

interface MetricComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  enrollments: ExtendedEnrollmentData[]
  studentProfiles: Record<string, StudentProfile>
  availableAYs: string[]
  currentSemester: string
  metric: string
  metricTitle: string
  registrarName?: string
}

export const MetricComparisonModal: React.FC<MetricComparisonModalProps> = ({
  isOpen,
  onClose,
  enrollments,
  studentProfiles,
  availableAYs,
  currentSemester,
  metric,
  metricTitle,
  registrarName,
}) => {
  const [selectedAYs, setSelectedAYs] = useState<string[]>(() => {
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

  // Generate colors and gradients for each AY
  const ayColors = useMemo(() => {
    const colorShades = [
      { base: '#1e40af', light: '#3b82f6' }, // blue-900 to blue-500
      { base: '#1e3a8a', light: '#2563eb' }, // blue-950 to blue-600
      { base: '#2563eb', light: '#60a5fa' }, // blue-600 to blue-400
      { base: '#3b82f6', light: '#93c5fd' }, // blue-500 to blue-300
      { base: '#1e40af', light: '#60a5fa' }, // blue-900 to blue-400
    ]
    return selectedAYs.reduce((acc, ay, index) => {
      const shade = colorShades[index % colorShades.length]
      acc[ay] = {
        base: shade.base,
        light: shade.light,
        gradientId: `gradient-${ay.replace(/\s+/g, '-')}`,
      }
      return acc
    }, {} as Record<string, { base: string; light: string; gradientId: string }>)
  }, [selectedAYs])

  // Helper functions to create chart data
  const createChartData = (data: any) => {
    if (!data || !data.analytics) return []

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
                {metricTitle} - Comparison
              </h2>
              <p
                className="text-sm text-gray-600 mt-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Compare {metricTitle.toLowerCase()} across academic years
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
                    } ${
                      selectedAYs.length === 0
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }`}
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
            ) : !hasData ? (
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
                {comparisonData.filter((data) => {
                  const chartData = createChartData(data)
                  return chartData && chartData.length > 0
                }).length === 0 ? (
                  <Card className="p-6 rounded-xl border border-gray-200 bg-white">
                    <div className="flex items-center justify-center h-[400px]">
                      <p
                        className="text-gray-500 text-center"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        No data available for {metricTitle.toLowerCase()} in the
                        selected academic years.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 rounded-xl border border-gray-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {comparisonData.map((data) => {
                        const chartData = createChartData(data)
                        const insight = generateInsight({
                          analytics: data.analytics,
                          totalStudents: data.totalStudents,
                          studentsByDepartment: data.studentsByDepartment,
                          metric,
                        })

                        // Check if chartData is valid
                        if (!chartData || chartData.length === 0) {
                          return (
                            <div key={data.ay} className="space-y-4">
                              <h4
                                className="text-sm font-medium text-gray-700 mb-2"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {data.ay}
                              </h4>
                              <div className="flex items-center justify-center h-[250px] bg-gray-50 rounded-lg border border-gray-200">
                                <p
                                  className="text-sm text-gray-500"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  No data available
                                </p>
                              </div>
                              <p
                                className="text-xs text-gray-600 leading-relaxed"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {insight}
                              </p>
                            </div>
                          )
                        }

                        // Ensure all values are valid numbers (allow 0 values)
                        const dataKey = getDataKey()
                        const validChartData = chartData
                          .map((item: any) => {
                            const value = item[dataKey]
                            // Ensure value is a valid number
                            const numValue =
                              typeof value === 'number' ? value : Number(value)
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
                            <div key={data.ay} className="space-y-4">
                              <h4
                                className="text-sm font-medium text-gray-700 mb-2"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {data.ay}
                              </h4>
                              <div className="flex items-center justify-center h-[250px] bg-gray-50 rounded-lg border border-gray-200">
                                <p
                                  className="text-sm text-gray-500"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  No valid data available
                                </p>
                              </div>
                              <p
                                className="text-xs text-gray-600 leading-relaxed"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {insight}
                              </p>
                            </div>
                          )
                        }

                        return (
                          <div key={data.ay} className="space-y-4">
                            <div>
                              <h4
                                className="text-sm font-medium text-gray-700 mb-2"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {data.ay}
                              </h4>
                              <div
                                style={{
                                  width: '100%',
                                  height: '250px',
                                  minHeight: '250px',
                                }}
                              >
                                {validChartData && validChartData.length > 0 ? (
                                  <ResponsiveContainer
                                    width="100%"
                                    height={250}
                                  >
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
                                          id={ayColors[data.ay].gradientId}
                                          x1="0"
                                          y1="0"
                                          x2="0"
                                          y2="1"
                                        >
                                          <stop
                                            offset="5%"
                                            stopColor={ayColors[data.ay].base}
                                            stopOpacity={1}
                                          />
                                          <stop
                                            offset="95%"
                                            stopColor={ayColors[data.ay].light}
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
                                          tick={{
                                            fontSize: 10,
                                            fill: '#6b7280',
                                          }}
                                          angle={-45}
                                          textAnchor="end"
                                          height={80}
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 300,
                                          }}
                                        />
                                      ) : (
                                        <XAxis
                                          dataKey="name"
                                          tick={{
                                            fontSize: 11,
                                            fill: '#6b7280',
                                          }}
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 300,
                                          }}
                                        />
                                      )}
                                      <YAxis
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 300,
                                        }}
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
                                        fill={`url(#${
                                          ayColors[data.ay].gradientId
                                        })`}
                                        radius={[8, 8, 0, 0]}
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
                                    <p
                                      className="text-sm text-gray-500"
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 400,
                                      }}
                                    >
                                      No chart data available
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p
                              className="text-xs text-gray-600 leading-relaxed"
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: 400,
                              }}
                            >
                              {insight}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                )}

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
          title={`${metricTitle} Comparison Analytics`}
        >
          <ComparisonPrintContent
            comparisonData={comparisonData}
            selectedAYs={selectedAYs}
            summary={summary}
            registrarName={registrarName}
            metric={metric}
            metricTitle={metricTitle}
          />
        </Print>
      )}
    </>
  )
}
