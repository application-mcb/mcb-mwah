import React from 'react'

export const StudentAnalyticsSkeleton: React.FC = () => (
  <div className="p-6 space-y-4">
    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`card-${index}`}
          className="h-32 bg-gray-100 rounded-xl animate-pulse"
        />
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`chart-${index}`}
          className="h-72 bg-gray-100 rounded-xl animate-pulse"
        />
      ))}
    </div>
  </div>
)


