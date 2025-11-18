import React from 'react'
import { Card } from '@/components/ui/card'
import { MagnifyingGlass } from '@phosphor-icons/react'

export const SearchEmptyState: React.FC = () => {
  return (
    <Card className="w-full p-8 border border-gray-200 text-center bg-white shadow-sm rounded-xl">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <MagnifyingGlass size={24} className="text-white" weight="bold" />
      </div>
      <h3
        className="text-lg font-medium text-gray-900 mb-2"
        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
      >
        No analytics match your search
      </h3>
      <p
        className="text-sm text-gray-600"
        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
      >
        Try a different keyword or clear the search box to view all analytics again.
      </p>
    </Card>
  )
}

