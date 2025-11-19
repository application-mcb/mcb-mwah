'use client'

import React from 'react'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationControlsProps) {
  if (totalItems === 0) return null

  const baseButtonClasses =
    'rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white bg-white text-blue-900'

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-5 py-4 bg-white/90 border border-blue-100 rounded-xl shadow-lg mt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div
          className="text-xs text-blue-900/70 flex items-center gap-3"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-3 h-3 rounded-md bg-blue-900/80"></div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{' '}
          students
        </div>
        <label
          className="flex items-center gap-2 text-xs text-blue-900/70"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Show
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-blue-100 bg-white px-3 py-1 text-xs text-blue-900 focus:ring-2 focus:ring-blue-900 focus:outline-none"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>

      <nav
        className="flex flex-wrap items-center justify-end gap-2"
        aria-label="Student pagination"
      >
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`${baseButtonClasses} flex items-center gap-1 border border-blue-100 hover:-translate-y-0.5 hover:border-blue-300 disabled:hover:translate-y-0`}
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          aria-label="Previous page"
        >
          <ArrowLeft size={14} className="text-blue-900" />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
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
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`${baseButtonClasses} border ${
                  currentPage === pageNum
                    ? 'border-blue-900 shadow-lg shadow-blue-900/30'
                    : 'border-blue-100 hover:border-blue-300 hover:-translate-y-0.5'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                aria-current={currentPage === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`${baseButtonClasses} flex items-center gap-1 border border-blue-100 hover:-translate-y-0.5 hover:border-blue-300 disabled:hover:translate-y-0`}
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          aria-label="Next page"
        >
          Next
          <ArrowRight size={14} className="text-blue-900" />
        </button>
      </nav>
    </div>
  )
}
