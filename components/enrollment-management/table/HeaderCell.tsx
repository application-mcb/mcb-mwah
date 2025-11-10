'use client'

import React from 'react'

interface Props {
  icon: React.ReactNode
  text: string
  className?: string
}

const HeaderCell: React.FC<Props> = ({ icon, text, className }) => {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800 ${className || ''}`}
      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 aspect-square rounded-md bg-white flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, { className: 'text-blue-900' })}
        </div>
        {text}
      </div>
    </th>
  )
}

export default HeaderCell


