'use client'

import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  GraduationCap,
  BookOpen,
  ChartBar,
  Users,
  GenderIntersex,
  MapPin,
  Calendar,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { ComparisonData } from './types'
import { generateInsight } from './utils/insight-generator'

interface ComparisonChartsProps {
  comparisonData: ComparisonData[]
  selectedAYs: string[]
}

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({
  comparisonData,
  selectedAYs,
}) => {
  // Generate colors for each AY
  const ayColors = useMemo(() => {
    const colorShades = [
      '#1e40af', // blue-900
      '#1e3a8a', // blue-950
      '#2563eb', // blue-600
      '#3b82f6', // blue-500
      '#60a5fa', // blue-400
    ]
    return selectedAYs.reduce((acc, ay, index) => {
      acc[ay] = colorShades[index % colorShades.length]
      return acc
    }, {} as Record<string, string>)
  }, [selectedAYs])

  // Helper to create chart data for a single AY
  const createGradeData = (data: ComparisonData) => {
    return Object.entries(data.analytics.studentsByGrade)
      .map(([grade, count]) => ({
        name: `Grade ${grade}`,
        students: count,
      }))
      .sort((a, b) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]))
  }

  const createStrandData = (data: ComparisonData) => {
    return Object.entries(data.analytics.studentsByStrand).map(
      ([strand, count]) => ({
        name: strand,
        students: count,
      })
    )
  }

  const createCourseData = (data: ComparisonData) => {
    return Object.entries(data.analytics.studentsByCourse).map(
      ([course, count]) => ({
        name: course.length > 20 ? course.substring(0, 20) + '...' : course,
        students: count,
      })
    )
  }

  const createRegularIrregularData = (data: ComparisonData) => {
    return [
      { name: 'Regular', value: data.analytics.regularVsIrregular.regular },
      { name: 'Irregular', value: data.analytics.regularVsIrregular.irregular },
    ]
  }

  const createGenderData = (data: ComparisonData) => {
    return Object.entries(data.analytics.genderDistribution).map(
      ([gender, count]) => ({
        name: gender,
        value: count,
      })
    )
  }

  const createAgeData = (data: ComparisonData) => {
    return Object.entries(data.analytics.birthdateRange.ageGroups).map(
      ([ageGroup, count]) => ({
        name: ageGroup,
        students: count,
      })
    )
  }

  const createProvinceData = (data: ComparisonData) => {
    return Object.entries(data.analytics.locationBreakdown.province)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([province, count]) => ({
        name:
          province.length > 20 ? province.substring(0, 20) + '...' : province,
        students: count,
      }))
  }

  const createSchoolTypeData = (data: ComparisonData) => {
    return Object.entries(data.analytics.previousSchoolType).map(
      ([schoolType, count]) => ({
        name: schoolType,
        students: count,
      })
    )
  }

  // Check which metrics have data
  const hasGradeData = comparisonData.some(
    (d) => Object.keys(d.analytics.studentsByGrade).length > 0
  )
  const hasStrandData = comparisonData.some(
    (d) => Object.keys(d.analytics.studentsByStrand).length > 0
  )
  const hasCourseData = comparisonData.some(
    (d) => Object.keys(d.analytics.studentsByCourse).length > 0
  )
  const hasRegularIrregularData = comparisonData.some(
    (d) =>
      d.analytics.regularVsIrregular.regular > 0 ||
      d.analytics.regularVsIrregular.irregular > 0
  )
  const hasGenderData = comparisonData.some(
    (d) => Object.keys(d.analytics.genderDistribution).length > 0
  )
  const hasAgeData = comparisonData.some(
    (d) => Object.keys(d.analytics.birthdateRange.ageGroups).length > 0
  )
  const hasProvinceData = comparisonData.some(
    (d) => Object.keys(d.analytics.locationBreakdown.province).length > 0
  )
  const hasSchoolTypeData = comparisonData.some(
    (d) => Object.keys(d.analytics.previousSchoolType).length > 0
  )

  return (
    <div className="space-y-8">
      {/* Grade Level Comparison */}
      {hasGradeData && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" weight="fill" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Students by Grade Level - Comparison
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.map((data) => {
              const chartData = createGradeData(data)
              const insight = generateInsight({
                analytics: data.analytics,
                totalStudents: data.totalStudents,
                studentsByDepartment: data.studentsByDepartment,
                metric: 'grade',
              })
              return (
                <div key={data.ay} className="space-y-4">
                  <div>
                    <h4
                      className="text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
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
                          fill={ayColors[data.ay]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Strand Comparison */}
      {hasStrandData && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <BookOpen size={20} className="text-white" weight="fill" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Students by Strand - Comparison
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.map((data) => {
              const chartData = createStrandData(data)
              const insight = generateInsight({
                analytics: data.analytics,
                totalStudents: data.totalStudents,
                studentsByDepartment: data.studentsByDepartment,
                metric: 'strand',
              })
              return (
                <div key={data.ay} className="space-y-4">
                  <div>
                    <h4
                      className="text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
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
                          fill={ayColors[data.ay]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Course Comparison */}
      {hasCourseData && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <ChartBar size={20} className="text-white" weight="fill" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Students by Course - Comparison
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.map((data) => {
              const chartData = createCourseData(data)
              const insight = generateInsight({
                analytics: data.analytics,
                totalStudents: data.totalStudents,
                studentsByDepartment: data.studentsByDepartment,
                metric: 'course',
              })
              return (
                <div key={data.ay} className="space-y-4">
                  <div>
                    <h4
                      className="text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
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
                          fill={ayColors[data.ay]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Regular vs Irregular Comparison */}
      {hasRegularIrregularData && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <Users size={20} className="text-white" weight="fill" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Regular vs Irregular - Comparison
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.map((data) => {
              const chartData = createRegularIrregularData(data)
              const insight = generateInsight({
                analytics: data.analytics,
                totalStudents: data.totalStudents,
                studentsByDepartment: data.studentsByDepartment,
                metric: 'regularIrregular',
              })
              return (
                <div key={data.ay} className="space-y-4">
                  <div>
                    <h4
                      className="text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
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
                          dataKey="value"
                          fill={ayColors[data.ay]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Gender Comparison */}
      {hasGenderData && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <GenderIntersex size={20} className="text-white" weight="fill" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Gender Distribution - Comparison
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.map((data) => {
              const chartData = createGenderData(data)
              const insight = generateInsight({
                analytics: data.analytics,
                totalStudents: data.totalStudents,
                studentsByDepartment: data.studentsByDepartment,
                metric: 'gender',
              })
              return (
                <div key={data.ay} className="space-y-4">
                  <div>
                    <h4
                      className="text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
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
                          dataKey="value"
                          fill={ayColors[data.ay]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Age Comparison */}
      {hasAgeData && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <Calendar size={20} className="text-white" weight="fill" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Age Distribution - Comparison
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.map((data) => {
              const chartData = createAgeData(data)
              const insight = generateInsight({
                analytics: data.analytics,
                totalStudents: data.totalStudents,
                studentsByDepartment: data.studentsByDepartment,
                metric: 'age',
              })
              return (
                <div key={data.ay} className="space-y-4">
                  <div>
                    <h4
                      className="text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
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
                          fill={ayColors[data.ay]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Province Comparison */}
      {hasProvinceData && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <MapPin size={20} className="text-white" weight="fill" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Students by Province - Comparison
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.map((data) => {
              const chartData = createProvinceData(data)
              const insight = generateInsight({
                analytics: data.analytics,
                totalStudents: data.totalStudents,
                studentsByDepartment: data.studentsByDepartment,
                metric: 'province',
              })
              return (
                <div key={data.ay} className="space-y-4">
                  <div>
                    <h4
                      className="text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
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
                          fill={ayColors[data.ay]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Previous School Type Comparison */}
      {hasSchoolTypeData && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" weight="fill" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Previous School Type - Comparison
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonData.map((data) => {
              const chartData = createSchoolTypeData(data)
              const insight = generateInsight({
                analytics: data.analytics,
                totalStudents: data.totalStudents,
                studentsByDepartment: data.studentsByDepartment,
                metric: 'schoolType',
              })
              return (
                <div key={data.ay} className="space-y-4">
                  <div>
                    <h4
                      className="text-sm font-medium text-gray-700 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {data.ay}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
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
                          fill={ayColors[data.ay]}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {insight}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
