import React from 'react'
import { Card } from '@/components/ui/card'

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 animate-pulse rounded"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 animate-pulse rounded w-48"></div>
            <div className="h-4 bg-gray-100 animate-pulse rounded w-64"></div>
          </div>
        </div>
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>

      {/* Search and Filter Skeleton */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-10 w-full sm:w-96 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>

      {/* Department Cards Skeleton */}
      <div className="flex flex-wrap gap-4">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="p-6 bg-white border border-gray-200 rounded-xl flex-[1_1_min(100%,_350px)]"
          >
            <div className="animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-100 rounded w-24"></div>
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart Cards Skeleton */}
      <div className="flex flex-wrap gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card
            key={i}
            className={`p-6 bg-white border border-gray-200 rounded-xl flex-[1_1_min(100%,_350px)] ${
              i <= 2 ? 'lg:flex-[1_1_100%]' : ''
            }`}
          >
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

