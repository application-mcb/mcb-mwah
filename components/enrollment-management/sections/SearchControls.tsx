'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FunnelSimple,
  X,
  User,
  Clock,
  ArrowUp,
  ArrowDown,
  FileArrowDown,
} from '@phosphor-icons/react'

interface SearchControlsProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  currentAYFilter: string
  onAYFilterChange: (value: string) => void
  currentSemesterFilter: string
  onSemesterFilterChange: (value: string) => void
  currentStudentTypeFilter: ('regular' | 'irregular')[]
  onStudentTypeFilterChange: (value: ('regular' | 'irregular')[]) => void
  sortOption: string
  onSortOptionChange: (value: string) => void
  onResetFilters: () => void
  showFilterDropdown: boolean
  onToggleFilterDropdown: () => void
  onExportClick: () => void
}

export default function SearchControls({
  searchQuery,
  onSearchChange,
  currentAYFilter,
  onAYFilterChange,
  currentSemesterFilter,
  onSemesterFilterChange,
  currentStudentTypeFilter,
  onStudentTypeFilterChange,
  sortOption,
  onSortOptionChange,
  onResetFilters,
  showFilterDropdown,
  onToggleFilterDropdown,
  onExportClick,
}: SearchControlsProps) {
  return (
    <>
      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search enrollments..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-4 py-2 w-full border-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportClick}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md hover:from-blue-900 hover:to-blue-950"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <FileArrowDown size={16} weight="bold" />
            Export CSV
          </button>
          <div className="relative">
            <button
              onClick={onToggleFilterDropdown}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                currentAYFilter ||
                currentSemesterFilter ||
                currentStudentTypeFilter.length > 0
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <FunnelSimple size={16} weight="bold" />
              Filter
              {(currentAYFilter ||
                currentSemesterFilter ||
                currentStudentTypeFilter.length > 0) && (
                <span className="w-2 h-2 bg-white rounded-full"></span>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={onToggleFilterDropdown}
                ></div>
                <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 shadow-lg rounded-xl z-20 p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Filter & Sort Options
                      </h3>
                      <button
                        onClick={onToggleFilterDropdown}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Academic Year Filter */}
                    <div>
                      <Label className="text-xs text-gray-700 mb-2 block">
                        Academic Year
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g., AY2526"
                        value={currentAYFilter}
                        onChange={(e) => onAYFilterChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent uppercase"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter AY to filter (e.g., AY2526)
                      </p>
                    </div>

                    {/* Semester Filter */}
                    <div>
                      <Label className="text-xs text-gray-700 mb-2 block">
                        Semester
                      </Label>
                      <select
                        value={currentSemesterFilter}
                        onChange={(e) => onSemesterFilterChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                      >
                        <option value="">All Semesters</option>
                        <option value="1">First Semester (Q1)</option>
                        <option value="2">Second Semester (Q2)</option>
                      </select>
                    </div>

                    {/* Student Type Filter */}
                    <div>
                      <Label className="text-xs text-gray-700 mb-3 block">
                        Student Type
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'regular', label: 'Regular', icon: User },
                          { key: 'irregular', label: 'Irregular', icon: User },
                        ].map((option) => {
                          const isSelected = currentStudentTypeFilter.includes(
                            option.key as 'regular' | 'irregular'
                          )
                          return (
                            <button
                              key={option.key}
                              onClick={() => {
                                if (isSelected) {
                                  onStudentTypeFilterChange(
                                    currentStudentTypeFilter.filter(
                                      (t) => t !== option.key
                                    )
                                  )
                                } else {
                                  onStudentTypeFilterChange([
                                    ...currentStudentTypeFilter,
                                    option.key as 'regular' | 'irregular',
                                  ])
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              <option.icon size={12} weight="bold" />
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <Label className="text-xs text-gray-700 mb-3 block">
                        Sort By
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'latest', label: 'Latest', icon: Clock },
                          { key: 'oldest', label: 'Oldest', icon: Clock },
                          { key: 'a-z', label: 'A-Z', icon: ArrowUp },
                          { key: 'z-a', label: 'Z-A', icon: ArrowDown },
                          {
                            key: 'last-3-days',
                            label: 'Last 3 days',
                            icon: Clock,
                          },
                          {
                            key: 'last-7-days',
                            label: 'Last 7 days',
                            icon: Clock,
                          },
                        ].map((option) => (
                          <button
                            key={option.key}
                            onClick={() => onSortOptionChange(option.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                              sortOption === option.key
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            <option.icon size={12} weight="bold" />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {(currentAYFilter ||
                      currentSemesterFilter ||
                      currentStudentTypeFilter.length > 0 ||
                      sortOption !== 'latest') && (
                      <button
                        onClick={onResetFilters}
                        className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
