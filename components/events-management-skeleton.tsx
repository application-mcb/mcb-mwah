'use client'

export default function EventsManagementSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-7 bg-white/20 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-white/20 rounded w-48 animate-pulse"></div>
            </div>
          </div>
          <div className="h-10 bg-white/20 rounded-lg w-36 animate-pulse"></div>
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg p-4">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Events List Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 shadow-lg animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 flex-shrink-0"></div>
              <div className="flex-1 min-w-0 space-y-3">
                <div className="h-7 bg-white/20 rounded-xl w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/20 rounded-xl w-full"></div>
                  <div className="h-4 bg-white/20 rounded-xl w-5/6"></div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="h-3 bg-white/20 rounded-xl w-32"></div>
                  <div className="h-3 bg-white/20 rounded-xl w-40"></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <div className="h-8 bg-white/20 rounded-lg w-20"></div>
                  <div className="h-8 bg-white/20 rounded-lg w-24"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
