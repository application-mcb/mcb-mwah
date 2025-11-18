import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { Users, ChartBar, BookOpen, Calendar } from '@phosphor-icons/react'
import { ChartCard } from './chart-card'
import {
  SectionPerformance,
  GradeDistribution,
  SubjectAnalytics,
  QuarterComparison,
} from './types'

const COLORS = [
  '#1e40af',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#dbeafe',
  '#bfdbfe',
]

interface ChartsGridProps {
  sectionPerformance: SectionPerformance[]
  gradeDistribution: GradeDistribution[]
  subjectAnalytics: SubjectAnalytics[]
  jhsQuarterComparison: QuarterComparison[]
  shsQuarterComparison: QuarterComparison[]
  collegeQuarterComparison: QuarterComparison[]
}

export const ChartsGrid: React.FC<ChartsGridProps> = ({
  sectionPerformance,
  gradeDistribution,
  subjectAnalytics,
  jhsQuarterComparison,
  shsQuarterComparison,
  collegeQuarterComparison,
}) => {
  const sectionPerformanceData = sectionPerformance.map((section) => ({
    name:
      section.sectionName.length > 15
        ? section.sectionName.substring(0, 15) + '...'
        : section.sectionName,
    fullName: section.sectionName,
    average: section.averageGrade,
    students: section.studentCount,
  }))

  const gradeDistributionData = gradeDistribution
    .sort((a, b) => {
      // Sort by range: Below 76, 76-79, 80-84, 85-89, 90-94, 95-100
      const order = ['Below 76', '76-79', '80-84', '85-89', '90-94', '95-100']
      return order.indexOf(a.range) - order.indexOf(b.range)
    })
    .map((dist) => ({
      name: dist.range,
      count: dist.count,
      percentage: dist.percentage,
    }))

  const subjectAnalyticsData = subjectAnalytics.map((subject) => ({
    name: subject.subjectCode,
    fullName: `${subject.subjectCode} - ${subject.subjectName}`,
    average: subject.averageGrade,
    students: subject.studentCount,
  }))

  const jhsQuarterData = jhsQuarterComparison.map((quarter) => ({
    name: quarter.label,
    average: quarter.averageGrade,
    students: quarter.studentCount,
  }))

  const shsQuarterData = shsQuarterComparison.map((quarter) => ({
    name: quarter.label,
    average: quarter.averageGrade,
    students: quarter.studentCount,
  }))

  const collegeQuarterData = collegeQuarterComparison.map((quarter) => ({
    name: quarter.label,
    average: quarter.averageGrade,
    students: quarter.studentCount,
  }))

  const getSectionPerformanceInsight = () => {
    if (sectionPerformance.length === 0)
      return 'No section data available. Please ensure all sections submit performance metrics for accurate comparison.'
    const best = sectionPerformance[0]
    const worst = sectionPerformance[sectionPerformance.length - 1]
    const avg =
      sectionPerformance.reduce((sum, s) => sum + s.averageGrade, 0) /
      sectionPerformance.length
    if (best.averageGrade === worst.averageGrade) {
      return `All ${
        sectionPerformance.length
      } sections show uniform ${best.averageGrade.toFixed(
        1
      )}% average. This indicates effective standardized teaching and equitable resource distribution.`
    }
    const gap = best.averageGrade - worst.averageGrade
    return `${best.sectionName} leads with ${best.averageGrade.toFixed(
      1
    )}% while ${worst.sectionName} shows ${worst.averageGrade.toFixed(
      1
    )}%, a ${gap.toFixed(
      1
    )} point gap. Targeted interventions may help elevate underperforming sections.`
  }

  const getSectionPerformanceForecast = () => {
    if (sectionPerformance.length === 0)
      return 'Section forecasting requires data collection across all active sections to predict trends and recommend strategic interventions.'
    const avg =
      sectionPerformance.reduce((sum, s) => sum + s.averageGrade, 0) /
      sectionPerformance.length
    if (avg >= 90)
      return 'Excellent performance indicates effective teaching methods. Maintaining current strategies will sustain high achievement. Continue advanced learning opportunities and enrichment programs.'
    if (avg >= 85)
      return 'Good performance with growth potential. Targeted interventions in lower sections, differentiated instruction, and peer tutoring can elevate all sections toward 90%.'
    if (avg >= 80)
      return 'Moderate performance needs review of teaching strategies. Additional resources, professional development, and targeted assistance could improve outcomes significantly.'
    return 'Performance below optimal levels requires immediate intervention. Review teaching methods, align curriculum, and provide additional resources and professional development.'
  }

  const getGradeDistributionInsight = () => {
    if (gradeDistribution.length === 0)
      return 'Grade distribution requires comprehensive performance data. Please ensure all grade data is properly recorded for accurate pattern identification.'
    const highest = gradeDistribution.reduce((max, dist) =>
      dist.count > max.count ? dist : max
    )
    const total = gradeDistribution.reduce((sum, d) => sum + d.count, 0)
    const highPerformers = gradeDistribution
      .filter((d) => d.min >= 85)
      .reduce((sum, d) => sum + d.count, 0)
    const highPerformerPercentage =
      total > 0 ? (highPerformers / total) * 100 : 0
    return `${highest.count} students (${highest.percentage.toFixed(
      1
    )}%) fall in ${
      highest.range
    } range. ${highPerformers} students (${highPerformerPercentage.toFixed(
      1
    )}%) achieve 85%+, indicating ${
      highPerformerPercentage >= 50
        ? 'strong'
        : highPerformerPercentage >= 30
        ? 'moderate'
        : 'room for improvement in'
    } overall achievement.`
  }

  const getGradeDistributionForecast = () => {
    if (gradeDistribution.length === 0)
      return 'Grade distribution forecasting requires historical data and trend analysis to identify potential shifts and enable proactive interventions.'
    const highPerformers = gradeDistribution
      .filter((d) => d.min >= 85)
      .reduce((sum, d) => sum + d.count, 0)
    const total = gradeDistribution.reduce((sum, d) => sum + d.count, 0)
    const percentage = total > 0 ? (highPerformers / total) * 100 : 0
    if (percentage >= 50)
      return 'Strong distribution with over half achieving high grades. Maintaining current approaches will sustain this pattern. Continue advanced learning and enrichment programs.'
    if (percentage >= 30)
      return 'Moderate high performer rate with improvement potential. Focus on mid-range students through differentiated instruction, targeted support, and peer tutoring programs.'
    return 'Low high performer rate needs curriculum review and teaching method evaluation. Implement evidence-based strategies, additional support, and early intervention programs to improve distribution.'
  }

  const getSubjectAnalyticsInsight = () => {
    if (subjectAnalytics.length === 0)
      return 'Subject analytics require comprehensive performance data. Please ensure all subject metrics are properly recorded for meaningful comparison.'
    const best = subjectAnalytics[0]
    const worst = subjectAnalytics[subjectAnalytics.length - 1]
    const avg =
      subjectAnalytics.reduce((sum, s) => sum + s.averageGrade, 0) /
      subjectAnalytics.length
    if (best.averageGrade === worst.averageGrade) {
      return `All ${
        subjectAnalytics.length
      } subjects show uniform ${best.averageGrade.toFixed(
        1
      )}% average. This indicates balanced teaching quality and effective curriculum alignment.`
    }
    const gap = best.averageGrade - worst.averageGrade
    return `${best.subjectCode} leads with ${best.averageGrade.toFixed(
      1
    )}% while ${worst.subjectCode} shows ${worst.averageGrade.toFixed(
      1
    )}%, a ${gap.toFixed(
      1
    )} point gap. Targeted curriculum review and additional resources may help ${
      worst.subjectCode
    }.`
  }

  const getSubjectAnalyticsForecast = () => {
    if (subjectAnalytics.length === 0)
      return 'Subject forecasting requires historical data and trend analysis to identify challenges and recommend strategic interventions across all curriculum areas.'
    const avg =
      subjectAnalytics.reduce((sum, s) => sum + s.averageGrade, 0) /
      subjectAnalytics.length
    if (avg >= 90)
      return 'Excellent performance indicates effective teaching methods. Maintaining current quality will sustain high achievement. Continue advanced learning opportunities and professional development.'
    if (avg >= 85)
      return 'Good performance with improvement opportunities. Focus on below-average subjects through curriculum enhancement, additional resources, and targeted support to reach 90% threshold.'
    if (avg >= 80)
      return 'Moderate performance needs curriculum review and teaching strategy evaluation. Additional resources, professional development, and targeted assistance could significantly improve outcomes.'
    return 'Performance below optimal levels requires immediate intervention. Review teaching methods, align curriculum, and provide additional resources and professional development across all subjects.'
  }

  const getQuarterComparisonInsight = (comparison: QuarterComparison[], level: string) => {
    if (comparison.length === 0)
      return `${level} quarter comparison requires performance data across multiple periods. Please ensure all quarter data is properly recorded for trend identification.`
    if (comparison.length === 1) {
      return `Current period shows ${comparison[0].averageGrade.toFixed(
        1
      )}% average for ${
        comparison[0].label
      }. Additional data across multiple quarters will enable trend identification and strategic planning.`
    }
    const first = comparison[0]
    const last = comparison[comparison.length - 1]
    const trend = last.averageGrade - first.averageGrade
    const avg =
      comparison.reduce((sum, q) => sum + q.averageGrade, 0) /
      comparison.length
    if (trend > 0) {
      return `Improving trend from ${first.label} (${first.averageGrade.toFixed(
        1
      )}%) to ${last.label} (${last.averageGrade.toFixed(
        1
      )}%), up ${trend.toFixed(
        1
      )} points. This indicates effective teaching strategies and positive learning outcomes.`
    } else if (trend < 0) {
      return `Declining trend from ${first.label} (${first.averageGrade.toFixed(
        1
      )}%) to ${last.label} (${last.averageGrade.toFixed(1)}%), down ${Math.abs(
        trend
      ).toFixed(
        1
      )} points. Immediate intervention and curriculum review may be necessary.`
    }
    return `Stable performance across ${
      comparison.length
    } periods with ${first.averageGrade.toFixed(
      1
    )}% average. Strategic enhancements and innovative teaching methods could elevate performance while maintaining stability.`
  }

  const getQuarterComparisonForecast = (comparison: QuarterComparison[], level: string) => {
    if (comparison.length === 0)
      return `${level} quarter forecasting requires historical data across multiple periods to identify trends and recommend strategic interventions effectively.`
    if (comparison.length < 2)
      return 'Accurate forecasting requires data across multiple periods to establish trends. Additional data collection will enhance forecasting accuracy and strategic planning.'
    const trend =
      comparison[comparison.length - 1].averageGrade -
      comparison[0].averageGrade
    if (trend > 2)
      return 'Strong upward trend indicates effective teaching strategies. Continuing current approaches will sustain this trajectory. Maintain momentum through consistent quality and professional development.'
    if (trend > 0)
      return 'Positive trend shows gradual improvement. Maintaining momentum while addressing declining areas through targeted interventions can sustain and accelerate this growth.'
    if (trend > -2)
      return 'Stable performance suggests consistent teaching quality. Focusing on improvement through innovative methods and targeted support could elevate performance while maintaining stability.'
    return 'Declining trend signals need for immediate intervention. Implement evidence-based strategies, additional support, and professional development to reverse this trend and restore performance levels.'
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {sectionPerformance.length > 0 && (
        <ChartCard
          title="Section Performance"
          icon={Users}
          insight={getSectionPerformanceInsight()}
          forecast={getSectionPerformanceForecast()}
        >
          <div
            className="w-full"
            style={{ height: '400px', minHeight: '400px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionPerformanceData}>
                <defs>
                  <linearGradient
                    id="sectionGradient"
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
                  dataKey="average"
                  fill="url(#sectionGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {gradeDistribution.length > 0 && (
        <ChartCard
          title="Grade Distribution"
          icon={ChartBar}
          insight={getGradeDistributionInsight()}
          forecast={getGradeDistributionForecast()}
        >
          <div
            className="w-full"
            style={{ height: '400px', minHeight: '400px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeDistributionData}>
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
                  formatter={(value: number, name: string) => {
                    if (name === 'count') {
                      return [`${value} students`, 'Count']
                    }
                    return [`${value.toFixed(1)}%`, 'Percentage']
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ fill: '#1e40af', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Students"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {subjectAnalytics.length > 0 && (
        <ChartCard
          title="Subject Analytics"
          icon={BookOpen}
          insight={getSubjectAnalyticsInsight()}
          forecast={getSubjectAnalyticsForecast()}
        >
          <div
            className="w-full"
            style={{ height: '400px', minHeight: '400px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAnalyticsData}>
                <defs>
                  <linearGradient
                    id="subjectGradient"
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
                  dataKey="average"
                  fill="url(#subjectGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {jhsQuarterComparison.length > 0 && (
        <ChartCard
          title="Junior High School - Quarter Comparison"
          icon={Calendar}
          insight={getQuarterComparisonInsight(jhsQuarterComparison, 'Junior High School')}
          forecast={getQuarterComparisonForecast(jhsQuarterComparison, 'Junior High School')}
        >
          <div
            className="w-full"
            style={{ height: '400px', minHeight: '400px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={jhsQuarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                  }}
                  formatter={(value: number) => {
                    if (isNaN(value) || value === null || value === undefined) {
                      return ['No data', 'Average']
                    }
                    return [`${value.toFixed(1)}%`, 'Average']
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ fill: '#1e40af', r: 5 }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {shsQuarterComparison.length > 0 && (
        <ChartCard
          title="Senior High School - Quarter Comparison"
          icon={Calendar}
          insight={getQuarterComparisonInsight(shsQuarterComparison, 'Senior High School')}
          forecast={getQuarterComparisonForecast(shsQuarterComparison, 'Senior High School')}
        >
          <div
            className="w-full"
            style={{ height: '400px', minHeight: '400px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shsQuarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                  }}
                  formatter={(value: number) => {
                    if (isNaN(value) || value === null || value === undefined) {
                      return ['No data', 'Average']
                    }
                    return [`${value.toFixed(1)}%`, 'Average']
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ fill: '#1e40af', r: 5 }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {collegeQuarterComparison.length > 0 && (
        <ChartCard
          title="College - Period Comparison"
          icon={Calendar}
          insight={getQuarterComparisonInsight(collegeQuarterComparison, 'College')}
          forecast={getQuarterComparisonForecast(collegeQuarterComparison, 'College')}
        >
          <div
            className="w-full"
            style={{ height: '400px', minHeight: '400px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={collegeQuarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                  }}
                  formatter={(value: number) => {
                    if (isNaN(value) || value === null || value === undefined) {
                      return ['No data', 'Average']
                    }
                    return [`${value.toFixed(1)}%`, 'Average']
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ fill: '#1e40af', r: 5 }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  )
}
