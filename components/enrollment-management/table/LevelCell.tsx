'use client'

import React from 'react'

interface Props {
  enrollment: any
  getEnrollmentDisplayInfo: (e: any) => { displayText: string; color: string }
  getBgColor: (color: string) => string
  cellBgClass?: string
}

const LevelCell: React.FC<Props> = ({ enrollment, getEnrollmentDisplayInfo, getBgColor, cellBgClass = 'bg-white' }) => {
  const displayInfo = getEnrollmentDisplayInfo(enrollment)
  return (
    <td className={`px-6 py-4 whitespace-nowrap border-r border-gray-200 ${cellBgClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: getBgColor(displayInfo.color) }}></div>
        <div className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          {displayInfo.displayText}
        </div>
      </div>
      <div className="text-xs text-gray-500 font-mono" style={{ fontWeight: 400 }}>
        {/* subtitle comes from getEnrollmentDisplayInfo if provided by caller */}
      </div>
    </td>
  )
}

export default LevelCell


