'use client'

import React from 'react'

interface Props {
  status: string | undefined
  studentType?: 'regular' | 'irregular' | string
  getStatusHexColor: (status: string) => string
}

const StatusBadge: React.FC<Props> = ({
  status,
  studentType,
  getStatusHexColor,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 flex-shrink-0"
          style={{ backgroundColor: getStatusHexColor(status || 'unknown') }}
        ></div>
        <span
          className="text-xs capitalize font-medium font-mono"
          style={{ fontWeight: 400 }}
        >
          {status || 'Unknown'}
        </span>
      </div>
      {studentType && (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 flex-shrink-0"
            style={{
              backgroundColor:
                studentType === 'irregular' ? '#dc2626' : '#064e3b',
            }}
          ></div>
          <span
            className="text-xs capitalize text-black font-mono"
            style={{ fontWeight: 300 }}
          >
            {studentType}
          </span>
        </div>
      )}
    </div>
  )
}

export default StatusBadge
