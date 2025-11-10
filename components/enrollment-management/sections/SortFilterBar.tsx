'use client'

import React from 'react'
import { Gear, GraduationCap } from '@phosphor-icons/react'

interface Props {
  onOpenSettings: () => void
  onOpenScholarship: () => void
}

const SortFilterBar: React.FC<Props> = ({
  onOpenSettings,
  onOpenScholarship,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-2 mb-4">
      <div className="flex gap-2">
        <button
          onClick={onOpenSettings}
          className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Gear size={14} />
          Settings
        </button>
        <button
          onClick={onOpenScholarship}
          className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <GraduationCap size={14} />
          Scholarship
        </button>
      </div>
    </div>
  )
}

export default SortFilterBar


