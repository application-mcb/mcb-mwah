import React from 'react'
import { Card } from '@/components/ui/card'
import { GraduationCap, BookOpen, ChartBar } from '@phosphor-icons/react'

interface SummaryCardsProps {
  showJHSCard: boolean
  showSHSCard: boolean
  showCollegeCard: boolean
  jhsCount: number
  shsCount: number
  collegeCount: number
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  showJHSCard,
  showSHSCard,
  showCollegeCard,
  jhsCount,
  shsCount,
  collegeCount,
}) => {
  if (!showJHSCard && !showSHSCard && !showCollegeCard) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {showJHSCard && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm text-gray-600 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Junior High School
              </p>
              <p
                className="text-3xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {jhsCount}
              </p>
              <p
                className="text-xs text-gray-500 mt-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Grades 7-10
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-blue-800 flex items-center justify-center">
              <GraduationCap size={24} className="text-white" weight="fill" />
            </div>
          </div>
        </Card>
      )}

      {showSHSCard && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm text-gray-600 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Senior High School
              </p>
              <p
                className="text-3xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {shsCount}
              </p>
              <p
                className="text-xs text-gray-500 mt-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Grades 11-12
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-blue-800 flex items-center justify-center">
              <BookOpen size={24} className="text-white" weight="fill" />
            </div>
          </div>
        </Card>
      )}

      {showCollegeCard && (
        <Card className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm text-gray-600 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                College Department
              </p>
              <p
                className="text-3xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {collegeCount}
              </p>
              <p
                className="text-xs text-gray-500 mt-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Year 1-4
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-blue-800 flex items-center justify-center">
              <ChartBar size={24} className="text-white" weight="fill" />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

