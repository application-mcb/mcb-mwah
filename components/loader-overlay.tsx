import React from 'react'

interface LoaderOverlayProps {
  isVisible: boolean
  message?: string
}

export const LoaderOverlay: React.FC<LoaderOverlayProps> = ({
  isVisible,
  message,
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-15 w-15 border-2 border-white/30 border-t-white"></div>
        {message && (
          <p className="text-white text-sm font-medium animate-pulse">
            Loading...
          </p>
        )}
      </div>
    </div>
  )
}
