import React from 'react'
import { Card } from '@/components/ui/card'

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/30" />
            <div className="space-y-2">
              <div className="h-5 bg-white/60 rounded w-48" />
              <div className="h-3 bg-white/40 rounded w-64" />
            </div>
          </div>
          <div className="h-10 w-40 rounded-lg bg-white/25" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((chip) => (
            <div
              key={`analytics-chip-${chip}`}
              className="h-8 w-28 rounded-full bg-white/20"
            />
          ))}
        </div>
      </div>

      <Card className="p-4 border border-blue-100 rounded-xl bg-white shadow-sm animate-pulse space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="h-10 rounded-lg bg-gray-100 flex-1" />
          <div className="flex gap-2 w-full lg:w-auto">
            {[1, 2, 3].map((filter) => (
              <div
                key={`analytics-filter-${filter}`}
                className="h-10 rounded-lg bg-gray-100 flex-1"
              />
            ))}
          </div>
          <div className="h-10 w-32 rounded-lg bg-gray-100" />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((cardIndex) => (
          <Card
            key={`analytics-card-${cardIndex}`}
            className="p-4 border border-blue-100 rounded-xl bg-white shadow-sm animate-pulse space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100" />
              <div className="space-y-2 flex-1">
                <div className="h-3 rounded bg-gray-100 w-20" />
                <div className="h-5 rounded bg-gray-200 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((chart) => (
          <Card
            key={`analytics-chart-${chart}`}
            className="p-4 border border-blue-100 rounded-xl bg-white shadow-sm animate-pulse space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100" />
              <div className="h-4 rounded bg-gray-100 w-32" />
            </div>
            <div className="h-48 rounded-xl bg-gray-50" />
            <div className="grid gap-2 sm:grid-cols-2">
              {[1, 2].map((legend) => (
                <div key={`analytics-legend-${chart}-${legend}`} className="h-4 rounded bg-gray-100" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

