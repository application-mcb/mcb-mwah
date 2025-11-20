'use client'

import { Card } from '@/components/ui/card'

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 animate-pulse rounded w-48"></div>
          <div className="h-4 bg-gray-100 animate-pulse rounded w-64"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 bg-white border border-blue-50 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
