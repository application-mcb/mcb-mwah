'use client'

import React from 'react'

interface Props {
  submittedAt: any
  formatDate: (d: any) => string
  getTimeAgoInfo: (d: any) => { text: string; color: string }
  cellBgClass?: string
}

const SubmittedAtCell: React.FC<Props> = ({
  submittedAt,
  formatDate,
  getTimeAgoInfo,
  cellBgClass = 'bg-white',
}) => {
  const info = getTimeAgoInfo(submittedAt)
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-xs text-gray-500 border-r border-gray-200 font-mono hidden lg:table-cell ${cellBgClass}`}
      style={{ fontWeight: 400 }}
    >
      <div className="space-y-1">
        <div className="text-xs font-mono text-gray-900">
          {formatDate(submittedAt)}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 flex-shrink-0"
            style={{ backgroundColor: info.color }}
          ></div>
          <span
            className="text-xs font-medium font-mono"
            style={{ fontWeight: 400 }}
          >
            {info.text}
          </span>
        </div>
      </div>
    </td>
  )
}

export default SubmittedAtCell
