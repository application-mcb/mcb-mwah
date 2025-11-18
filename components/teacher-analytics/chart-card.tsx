import React from 'react'
import { Card } from '@/components/ui/card'
import { Lightbulb, TrendUp } from '@phosphor-icons/react'

export interface ChartCardProps {
  title: string
  icon: React.ElementType
  insight: string
  forecast: string
  children: React.ReactNode
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  icon: Icon,
  insight,
  forecast,
  children,
}) => {
  return (
    <Card className="p-6 rounded-xl border border-blue-100 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
            <Icon size={20} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-lg font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            {title}
          </h3>
        </div>
      </div>
      <div className="mb-4">{children}</div>
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <Lightbulb
            size={16}
            className="text-blue-900 mt-0.5 flex-shrink-0"
            weight="fill"
          />
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: 'monospace', fontWeight: 400 }}
          >
            <span className="font-medium text-gray-900">Insight:</span>{' '}
            {insight}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <TrendUp
            size={16}
            className="text-blue-900 mt-0.5 flex-shrink-0"
            weight="fill"
          />
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: 'monospace', fontWeight: 400 }}
          >
            <span className="font-medium text-gray-900">Forecast:</span>{' '}
            {forecast}
          </p>
        </div>
      </div>
    </Card>
  )
}
