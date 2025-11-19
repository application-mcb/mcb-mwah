import React from 'react'
import {
  ChartLineUp,
  BookOpen,
  Trophy,
  WarningCircle,
} from '@phosphor-icons/react'
import { StudentAnalyticsResult } from './types'

interface SummaryCardsProps {
  analytics: StudentAnalyticsResult
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ analytics }) => {
  const passRate =
    analytics.completedSubjects > 0
      ? (analytics.passCount / analytics.completedSubjects) * 100
      : 0

  const cards = [
    {
      label: 'Overall Average',
      value:
        analytics.overallAverage !== null
          ? `${analytics.overallAverage.toFixed(1)}%`
          : '—',
      helper: 'Across completed subjects',
      icon: ChartLineUp,
    },
    {
      label: analytics.level === 'college' ? 'GWA' : 'Completed Subjects',
      value:
        analytics.level === 'college'
          ? analytics.gwa !== null
            ? analytics.gwa.toFixed(2)
            : '—'
          : `${analytics.completedSubjects}/${analytics.totalSubjects}`,
      helper:
        analytics.level === 'college'
          ? 'Numeric grading scale'
          : 'Posted grades vs total',
      icon: BookOpen,
    },
    {
      label: 'Pass Rate',
      value: `${passRate.toFixed(0)}%`,
      helper: `${analytics.passCount} pass • ${analytics.failCount} fail`,
      icon: Trophy,
    },
    {
      label: 'Pending Grades',
      value: analytics.pendingCount.toString(),
      helper: 'Awaiting teacher submission',
      icon: WarningCircle,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white flex-shrink-0">
            <card.icon size={24} weight="fill" />
          </div>
          <div>
            <p
              className="text-xs uppercase text-gray-500 tracking-wide"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {card.label}
            </p>
            <p
              className="text-2xl text-gray-900 leading-tight"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {card.value}
            </p>
            <p
              className="text-xs text-gray-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {card.helper}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}


