import React from 'react'
import { Card } from '@/components/ui/card'
import { Users, BookOpen, ChartBar } from '@phosphor-icons/react'

interface SummaryCardsProps {
  totalStudents: number
  totalSections: number
  totalSubjects: number
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalStudents,
  totalSections,
  totalSubjects,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 rounded-xl border border-blue-100 bg-white hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-sm text-gray-600 mb-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Total Students
            </p>
            <p
              className="text-3xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {totalStudents}
            </p>
            <p
              className="text-xs text-gray-500 mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Across all sections
            </p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-blue-900 flex items-center justify-center">
            <Users size={24} className="text-white" weight="fill" />
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-xl border border-blue-100 bg-white hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-sm text-gray-600 mb-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Total Sections
            </p>
            <p
              className="text-3xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {totalSections}
            </p>
            <p
              className="text-xs text-gray-500 mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Assigned sections
            </p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-blue-900 flex items-center justify-center">
            <BookOpen size={24} className="text-white" weight="fill" />
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-xl border border-blue-100 bg-white hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-sm text-gray-600 mb-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Total Subjects
            </p>
            <p
              className="text-3xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {totalSubjects}
            </p>
            <p
              className="text-xs text-gray-500 mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Teaching subjects
            </p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-blue-900 flex items-center justify-center">
            <ChartBar size={24} className="text-white" weight="fill" />
          </div>
        </div>
      </Card>
    </div>
  )
}
