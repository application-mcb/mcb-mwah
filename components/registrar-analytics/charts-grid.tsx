import React from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
import { ChartCard } from './chart-card'
import { SharedPrintControls } from './print/shared-print-controls'
import { MetricComparisonButton } from './metric-comparison-button'
import { ExtendedEnrollmentData } from '../enrollment-management/types'
import { StudentProfile } from './types'
import type {
  AnalyticsData,
  InsightsContent,
  ChartDataPoint,
  ChartDataPointWithFullName,
  PieChartDataPoint,
  RegularIrregularDataPoint,
} from './types'

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']

interface ChartsGridProps {
  showGradeChart: boolean
  showStrandChart: boolean
  showCourseChart: boolean
  showRegularIrregularChart: boolean
  showGenderChart: boolean
  showReligionChart: boolean
  showAgeChart: boolean
  showProvinceChart: boolean
  showMunicipalityChart: boolean
  showBarangayChart: boolean
  showSchoolTypeChart: boolean
  showPreviousSchoolChart: boolean
  gradeChartData: ChartDataPoint[]
  strandChartData: ChartDataPoint[]
  courseChartData: ChartDataPointWithFullName[]
  regularIrregularData: RegularIrregularDataPoint[]
  genderChartData: PieChartDataPoint[]
  ageGroupChartData: ChartDataPoint[]
  provinceChartData: ChartDataPointWithFullName[]
  previousSchoolTypeChartData: ChartDataPoint[]
  previousSchoolChartData: ChartDataPointWithFullName[]
  analytics: AnalyticsData
  insights: InsightsContent
  registrarName?: string
  enrollments: ExtendedEnrollmentData[]
  studentProfiles: Record<string, StudentProfile>
  availableAYs: string[]
  currentSemester: string
}

export const ChartsGrid: React.FC<ChartsGridProps> = ({
  showGradeChart,
  showStrandChart,
  showCourseChart,
  showRegularIrregularChart,
  showGenderChart,
  showReligionChart,
  showAgeChart,
  showProvinceChart,
  showMunicipalityChart,
  showBarangayChart,
  showSchoolTypeChart,
  showPreviousSchoolChart,
  gradeChartData,
  strandChartData,
  courseChartData,
  regularIrregularData,
  genderChartData,
  ageGroupChartData,
  provinceChartData,
  previousSchoolTypeChartData,
  previousSchoolChartData,
  analytics,
  insights,
  registrarName,
  enrollments,
  studentProfiles,
  availableAYs,
  currentSemester,
}: ChartsGridProps) => {
  const hasAnyChart =
    showGradeChart ||
    showStrandChart ||
    showCourseChart ||
    showRegularIrregularChart ||
    showGenderChart ||
    showReligionChart ||
    showAgeChart ||
    showProvinceChart ||
    showMunicipalityChart ||
    showBarangayChart ||
    showSchoolTypeChart ||
    showPreviousSchoolChart

  if (!hasAnyChart) {
    return null
  }

  const municipalityData = Object.entries(
    analytics.locationBreakdown.municipality
  )
    .sort((a, b) => b[1] - a[1])
    .map(([municipality, count]) => ({
      name:
        municipality.length > 25
          ? municipality.substring(0, 25) + '...'
          : municipality,
      fullName: municipality,
      students: count,
    }))

  const barangayData = Object.entries(analytics.locationBreakdown.barangay)
    .sort((a, b) => b[1] - a[1])
    .map(([barangay, count]) => ({
      name: barangay.length > 25 ? barangay.substring(0, 25) + '...' : barangay,
      fullName: barangay,
      students: count,
    }))

  const religionData = Object.entries(analytics.religionDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([religion, count]) => ({
      name: religion.length > 25 ? religion.substring(0, 25) + '...' : religion,
      fullName: religion,
      students: count,
    }))

  // Helper function to create bar chart content for printing
  const createBarChartContent = (
    data:
      | ChartDataPoint[]
      | ChartDataPointWithFullName[]
      | RegularIrregularDataPoint[],
    gradientId: string,
    gradientStart: string,
    gradientEnd: string,
    dataKey: string,
    xAxisAngle?: number
  ) => {
    // Ensure data is valid and not empty
    if (!data || data.length === 0) {
      return (
        <div
          className="w-full flex items-center justify-center"
          style={{ height: '400px' }}
        >
          <p style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            No data available
          </p>
        </div>
      )
    }

    // Validate data values
    const validData = data
      .map((item: any) => {
        const value = item[dataKey]
        const numValue = typeof value === 'number' ? value : Number(value)
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
      .filter((item) => item !== null)

    if (!validData || validData.length === 0) {
      return (
        <div
          className="w-full flex items-center justify-center"
          style={{ height: '400px' }}
        >
          <p style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            No valid data available
          </p>
        </div>
      )
    }

    return (
      <div
        className="w-full"
        style={{ height: '400px', minHeight: '400px', position: 'relative' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={validData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientStart} stopOpacity={1} />
                <stop offset="95%" stopColor={gradientEnd} stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: xAxisAngle ? 11 : 12, fill: '#6b7280' }}
              angle={xAxisAngle || 0}
              textAnchor={xAxisAngle ? 'end' : 'middle'}
              {...(xAxisAngle ? { height: 100 } : {})}
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
              dataKey={dataKey}
              fill={`url(#${gradientId})`}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Helper function to create pie chart content for printing
  const createPieChartContent = (data: PieChartDataPoint[]) => {
    // Ensure data is valid and not empty
    if (!data || data.length === 0) {
      return (
        <div
          className="w-full flex items-center justify-center"
          style={{ height: '400px' }}
        >
          <p style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            No data available
          </p>
        </div>
      )
    }

    return (
      <div className="w-full" style={{ height: '400px', minHeight: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontFamily: 'Poppins',
                fontWeight: 400,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {showGradeChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Students by Grade Level"
            icon={GraduationCap}
            insight={insights.gradeLevelInsight}
            forecast={insights.gradeLevelForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="grade"
                metricTitle="Students by Grade Level"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Students by Grade Level"
                chartContent={createBarChartContent(
                  gradeChartData,
                  'colorGradePrint',
                  '#1e40af',
                  '#3b82f6',
                  'students'
                )}
                insight={insights.gradeLevelInsight}
                forecast={insights.gradeLevelForecast}
                registrarName={registrarName}
              />
            }
          >
            {gradeChartData && gradeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeChartData}>
                  <defs>
                    <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.8}
                      />
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
                    fill="url(#colorGrade)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border border-gray-200">
                <p
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  No data available
                </p>
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {showStrandChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Students by Strand"
            icon={BookOpen}
            insight={insights.strandInsight}
            forecast={insights.strandForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="strand"
                metricTitle="Students by Strand"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Students by Strand"
                chartContent={createBarChartContent(
                  strandChartData,
                  'colorStrandPrint',
                  '#3b82f6',
                  '#60a5fa',
                  'students',
                  -45
                )}
                insight={insights.strandInsight}
                forecast={insights.strandForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strandChartData}>
                <defs>
                  <linearGradient id="colorStrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                  fill="url(#colorStrand)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showCourseChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Students by Course"
            icon={ChartBar}
            insight={insights.courseInsight}
            forecast={insights.courseForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="course"
                metricTitle="Students by Course"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Students by Course"
                chartContent={createBarChartContent(
                  courseChartData,
                  'colorCoursePrint',
                  '#1e40af',
                  '#60a5fa',
                  'students',
                  -45
                )}
                insight={insights.courseInsight}
                forecast={insights.courseForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseChartData}>
                <defs>
                  <linearGradient id="colorCourse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                  fill="url(#colorCourse)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showRegularIrregularChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Regular vs Irregular"
            icon={Users}
            insight={insights.regularIrregularInsight}
            forecast={insights.regularIrregularForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="regularIrregular"
                metricTitle="Regular vs Irregular"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Regular vs Irregular"
                chartContent={createBarChartContent(
                  regularIrregularData,
                  'colorRegularIrregularPrint',
                  '#1e40af',
                  '#3b82f6',
                  'value'
                )}
                insight={insights.regularIrregularInsight}
                forecast={insights.regularIrregularForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regularIrregularData}>
                <defs>
                  <linearGradient
                    id="colorRegularIrregular"
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
                  dataKey="value"
                  fill="url(#colorRegularIrregular)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showGenderChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Gender Distribution"
            icon={GenderIntersex}
            insight={insights.genderInsight}
            forecast={insights.genderForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="gender"
                metricTitle="Gender Distribution"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Gender Distribution"
                chartContent={createPieChartContent(genderChartData)}
                insight={insights.genderInsight}
                forecast={insights.genderForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showReligionChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Religion Distribution"
            icon={MapPin}
            insight={insights.religionInsight}
            forecast={insights.religionForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="religion"
                metricTitle="Religion Distribution"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Religion Distribution"
                chartContent={createBarChartContent(
                  religionData,
                  'colorReligionPrint',
                  '#3b82f6',
                  '#93c5fd',
                  'students',
                  -45
                )}
                insight={insights.religionInsight}
                forecast={insights.religionForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={religionData}>
                <defs>
                  <linearGradient
                    id="colorReligion"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                  fill="url(#colorReligion)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showAgeChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Age Distribution"
            icon={Calendar}
            insight={insights.ageInsight}
            forecast={insights.ageForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="age"
                metricTitle="Age Distribution"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Age Distribution"
                chartContent={createBarChartContent(
                  ageGroupChartData,
                  'colorAgePrint',
                  '#1e40af',
                  '#60a5fa',
                  'students'
                )}
                insight={insights.ageInsight}
                forecast={insights.ageForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageGroupChartData}>
                <defs>
                  <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.8} />
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
                  fill="url(#colorAge)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showProvinceChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Students by Province"
            icon={MapPin}
            insight={insights.provinceInsight}
            forecast={insights.provinceForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="province"
                metricTitle="Students by Province"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Students by Province"
                chartContent={createBarChartContent(
                  provinceChartData,
                  'colorProvincePrint',
                  '#60a5fa',
                  '#93c5fd',
                  'students',
                  -45
                )}
                insight={insights.provinceInsight}
                forecast={insights.provinceForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceChartData}>
                <defs>
                  <linearGradient
                    id="colorProvince"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={1} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                  fill="url(#colorProvince)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showMunicipalityChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Students by Municipality"
            icon={MapPin}
            insight={insights.municipalityInsight}
            forecast={insights.municipalityForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="municipality"
                metricTitle="Students by Municipality"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Students by Municipality"
                chartContent={createBarChartContent(
                  municipalityData,
                  'colorMunicipalityPrint',
                  '#3b82f6',
                  '#60a5fa',
                  'students',
                  -45
                )}
                insight={insights.municipalityInsight}
                forecast={insights.municipalityForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={municipalityData}>
                <defs>
                  <linearGradient
                    id="colorMunicipality"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                  fill="url(#colorMunicipality)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showBarangayChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Students by Barangay"
            icon={MapPin}
            insight={insights.barangayInsight}
            forecast={insights.barangayForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="barangay"
                metricTitle="Students by Barangay"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Students by Barangay"
                chartContent={createBarChartContent(
                  barangayData,
                  'colorBarangayPrint',
                  '#1e40af',
                  '#3b82f6',
                  'students',
                  -45
                )}
                insight={insights.barangayInsight}
                forecast={insights.barangayForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barangayData}>
                <defs>
                  <linearGradient
                    id="colorBarangay"
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
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                  fill="url(#colorBarangay)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showSchoolTypeChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Previous School Type"
            icon={GraduationCap}
            insight={insights.schoolTypeInsight}
            forecast={insights.schoolTypeForecast}
            comparisonControls={
              <MetricComparisonButton
                enrollments={enrollments}
                studentProfiles={studentProfiles}
                availableAYs={availableAYs}
                currentSemester={currentSemester}
                metric="schoolType"
                metricTitle="Previous School Type"
                registrarName={registrarName}
              />
            }
            printControls={
              <SharedPrintControls
                title="Previous School Type"
                chartContent={createBarChartContent(
                  previousSchoolTypeChartData,
                  'colorPreviousSchoolTypePrint',
                  '#1e40af',
                  '#60a5fa',
                  'students'
                )}
                insight={insights.schoolTypeInsight}
                forecast={insights.schoolTypeForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={previousSchoolTypeChartData}>
                <defs>
                  <linearGradient
                    id="colorPreviousSchoolType"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.8} />
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
                  fill="url(#colorPreviousSchoolType)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {showPreviousSchoolChart && (
        <div className="col-span-1 lg:col-span-2">
          <ChartCard
            title="Previous School Distribution"
            icon={GraduationCap}
            insight={insights.schoolInsight}
            forecast={insights.schoolForecast}
            printControls={
              <SharedPrintControls
                title="Previous School Distribution"
                chartContent={createBarChartContent(
                  previousSchoolChartData,
                  'colorPreviousSchoolPrint',
                  '#3b82f6',
                  '#93c5fd',
                  'students',
                  -45
                )}
                insight={insights.schoolInsight}
                forecast={insights.schoolForecast}
                registrarName={registrarName}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={previousSchoolChartData}>
                <defs>
                  <linearGradient
                    id="colorPreviousSchool"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                  fill="url(#colorPreviousSchool)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
