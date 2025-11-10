'use client'

import React from 'react'

export default function SkeletonCard() {
  return (
    <div className="bg-white p-4 shadow animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 w-24"></div>
          <div className="h-8 bg-gray-200 w-16"></div>
        </div>
        <div className="h-6 w-6 bg-gray-200"></div>
      </div>
    </div>
  )
}
