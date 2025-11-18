'use client'

import React from 'react'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'

interface Props {
  currentPage: number
  setCurrentPage: (updater: (prev: number) => number) => void
  itemsPerPage: number
  onItemsPerPageChange: (itemsPerPage: number) => void
  totalItems: number
}

const PaginationBar: React.FC<Props> = ({
  currentPage,
  setCurrentPage,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const pageButtons = Array.from(
    { length: Math.min(totalPages, 7) },
    (_, i) => {
      let pageNum
      if (totalPages <= 7) {
        pageNum = i + 1
      } else if (currentPage <= 4) {
        pageNum = i + 1
      } else if (currentPage >= totalPages - 3) {
        pageNum = totalPages - 6 + i
      } else {
        pageNum = currentPage - 3 + i
      }
      return pageNum
    }
  )

  if (totalItems === 0) return null

  return (
    <div className="flex items-center mt-3 shadow-lg justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center gap-4">
      <div
        className="text-xs text-gray-600 flex items-center gap-2"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        <div className="w-3 h-3 aspect-square rounded-md bg-gradient-to-br from-blue-800 to-blue-900"></div>
        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{' '}
        enrollments
        </div>
        <div className="flex items-center gap-2">
          <label
            className="text-xs text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Show:
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            currentPage === 1
              ? 'bg-white text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-gradient-to-br from-blue-800 to-blue-900 text-white hover:from-blue-900 hover:to-blue-950'
          }`}
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <ArrowLeft size={14} />
          Previous
        </button>
        <div className="flex items-center gap-1">
          {pageButtons.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(() => pageNum)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                currentPage === pageNum
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {pageNum}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            currentPage === totalPages
              ? 'bg-white text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-gradient-to-br from-blue-800 to-blue-900 text-white hover:from-blue-900 hover:to-blue-950'
          }`}
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Next
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default PaginationBar
