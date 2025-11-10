'use client'

import React from 'react'

interface ResultsCountProps {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  hasSearchQuery: boolean
}

export default function ResultsCount({
  totalItems,
  currentPage,
  itemsPerPage,
  hasSearchQuery,
}: ResultsCountProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalItems === 0) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"></div>
  )
}
