import React from 'react'

interface FallbackBannerProps {
  requested: string
  actual: string
}

export const FallbackBanner: React.FC<FallbackBannerProps> = ({
  requested,
  actual,
}) => {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <p style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
        No enrollments were found for <span className="font-semibold">{requested}</span>. Displaying
        data for <span className="font-semibold">{actual}</span> instead.
      </p>
    </div>
  )
}

