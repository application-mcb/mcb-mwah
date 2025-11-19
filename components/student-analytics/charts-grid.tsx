import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendUp,
  Medal,
  WarningCircle,
  Gauge,
} from '@phosphor-icons/react'
import { StudentAnalyticsResult } from './types'
import { useStudentChartData } from './hooks/useStudentChartData'
import { ChartCard } from './chart-card'

const PASS_FAIL_COLORS = ['#15803d', '#dc2626', '#64748b']
const BAR_GRADIENT = {
  id: 'studentBarGradient',
  from: '#1e40af',
  to: '#3b82f6',
}

interface ChartsGridProps {
  analytics: StudentAnalyticsResult
}

export const ChartsGrid: React.FC<ChartsGridProps> = ({ analytics }) => {
  const {
    gradeTrendData,
    subjectPerformanceData,
    subjectRiskData,
    passFailData,
    gwaHistoryData,
  } = useStudentChartData(analytics)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {gradeTrendData.length > 0 && (
        <ChartCard
          title="Grade Trend"
          description="Average performance per grading period"
          icon={TrendUp}
        >
          <div className="w-full min-w-0" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  style={{ fontFamily: 'Poppins', fontSize: '12px' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  domain={[60, 100]}
                  style={{ fontFamily: 'Poppins', fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                  }}
                  formatter={(value: number) => [`${value?.toFixed(1)}%`, 'Average']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1e40af"
                  strokeWidth={3}
                  dot={{ fill: '#1e40af', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {analytics.level === 'college' && gwaHistoryData.length > 0 && (
        <ChartCard
          title="GWA History"
          description="Numeric conversion per term"
          icon={Gauge}
        >
          <div className="w-full min-w-0" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gwaHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  style={{ fontFamily: 'Poppins', fontSize: '12px' }}
                />
                <YAxis
                  reversed
                  domain={[1, 5]}
                  stroke="#94a3b8"
                  style={{ fontFamily: 'Poppins', fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                  }}
                  formatter={(value: number) => [value?.toFixed(2), 'GWA']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#15803d"
                  strokeWidth={3}
                  dot={{ fill: '#15803d', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {subjectPerformanceData.length > 0 && (
        <ChartCard
          title="Top Performing Subjects"
          description="Highest averages this term"
          icon={Medal}
        >
          <div className="w-full min-w-0" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectPerformanceData}
                layout="vertical"
                margin={{ left: 32 }}
              >
                <defs>
                  <linearGradient
                    id={BAR_GRADIENT.id}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="5%" stopColor={BAR_GRADIENT.from} stopOpacity={1} />
                    <stop offset="95%" stopColor={BAR_GRADIENT.to} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  domain={[60, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#0f172a', fontSize: 12 }}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                  }}
                  formatter={(value: number) => [`${value?.toFixed(1)}%`, 'Average']}
                />
                <Bar dataKey="average" fill={`url(#${BAR_GRADIENT.id})`} radius={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {subjectRiskData.length > 0 && (
        <ChartCard
          title="Subjects Needing Attention"
          description="Lowest averages so far"
          icon={WarningCircle}
        >
          <div className="w-full min-w-0" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectRiskData}
                layout="vertical"
                margin={{ left: 32 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  domain={[60, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#0f172a', fontSize: 12 }}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                  }}
                  formatter={(value: number) => [`${value?.toFixed(1)}%`, 'Average']}
                />
                <Bar dataKey="average" fill="#dc2626" radius={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {passFailData.length > 0 && (
        <ChartCard
          title="Pass vs Fail Overview"
          description="Subject outcome summary"
          icon={TrendUp}
        >
          <div className="w-full min-w-0" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passFailData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {passFailData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PASS_FAIL_COLORS[index % PASS_FAIL_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Poppins',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} subjects`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  )
}


