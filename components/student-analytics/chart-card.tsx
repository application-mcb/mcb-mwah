import React from 'react'
import { Icon } from '@phosphor-icons/react'

interface ChartCardProps {
  title: string
  description?: string
  icon: Icon
  children: React.ReactNode
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  icon: IconComponent,
  children,
}) => (
  <div className="bg-white/95 border border-blue-100 rounded-xl shadow-sm p-4 space-y-4 w-full">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white">
        <IconComponent size={22} weight="fill" />
      </div>
      <div>
        <h3
          className="text-lg text-gray-900"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
)


