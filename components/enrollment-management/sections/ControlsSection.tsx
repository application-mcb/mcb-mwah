'use client'

import React from 'react'
import EnrollmentsHeader from './EnrollmentsHeader'
import SearchControls from './SearchControls'
import SortFilterBar from './SortFilterBar'

interface Props {
  currentAYFilter: string
  currentSemesterFilter: string
  searchQuery: string
  setSearchQuery: (v: string) => void
  sortOption: string
  setSortOption: (v: string) => void
  currentStudentTypeFilter: ('regular' | 'irregular')[]
  onStudentTypeFilterChange: (value: ('regular' | 'irregular')[]) => void
  onAYFilterChange: (v: string) => void
  onSemesterFilterChange: (v: string) => void
  onResetFilters: () => void
  showFilterDropdown: boolean
  onToggleFilterDropdown: () => void
  onOpenSettings: () => void
  onOpenScholarship: () => void
  onExportClick: () => void
}

const ControlsSection: React.FC<Props> = ({
  currentAYFilter,
  currentSemesterFilter,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  currentStudentTypeFilter,
  onStudentTypeFilterChange,
  onAYFilterChange,
  onSemesterFilterChange,
  onResetFilters,
  showFilterDropdown,
  onToggleFilterDropdown,
  onOpenSettings,
  onOpenScholarship,
  onExportClick,
}) => {
  return (
    <>
      <EnrollmentsHeader
        currentAYFilter={currentAYFilter}
        currentSemesterFilter={currentSemesterFilter}
      />
      <SearchControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentAYFilter={currentAYFilter}
        onAYFilterChange={onAYFilterChange}
        currentSemesterFilter={currentSemesterFilter}
        onSemesterFilterChange={onSemesterFilterChange}
        currentStudentTypeFilter={currentStudentTypeFilter}
        onStudentTypeFilterChange={onStudentTypeFilterChange}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        onResetFilters={onResetFilters}
        showFilterDropdown={showFilterDropdown}
        onToggleFilterDropdown={onToggleFilterDropdown}
        onExportClick={onExportClick}
      />
      <SortFilterBar
        onOpenSettings={onOpenSettings}
        onOpenScholarship={onOpenScholarship}
      />
    </>
  )
}

export default ControlsSection
