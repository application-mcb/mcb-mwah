'use client'

import React from 'react'
import { Users } from '@phosphor-icons/react'

interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
      <h1 className="text-2xl font-light text-white flex items-center gap-2">
        <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
          <Users size={20} weight="fill" className="text-blue-900" />
        </div>
        {title}
      </h1>
      <p className="text-xs text-blue-100 mt-1">
        {description}
      </p>
    </div>
  )
}
