import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WarningCircle } from '@phosphor-icons/react'

interface NoDataCardProps {
  onReload: () => void
  latestAvailableAY?: string
  selectedAY: string
  onSelectAY: (ay: string) => void
}

export const NoDataCard: React.FC<NoDataCardProps> = ({
  onReload,
  latestAvailableAY,
  selectedAY,
  onSelectAY,
}) => {
  return (
    <Card className="w-full p-10 border border-gray-200 text-center bg-white shadow-sm rounded-xl">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <WarningCircle size={32} className="text-white" weight="fill" />
      </div>
      <h3
        className="text-lg font-medium text-gray-900 mb-2"
        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
      >
        No analytics available
      </h3>
      <p
        className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto"
        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
      >
        There are no enrolled students that match the selected academic year, semester, or filters.
        Try switching to another academic year or reload the dataset once new enrollments are
        available.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={onReload}
          className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Reload data
        </Button>
        {latestAvailableAY && selectedAY !== latestAvailableAY && (
          <Button
            variant="outline"
            onClick={() => onSelectAY(latestAvailableAY)}
            className="rounded-lg border-blue-200 text-blue-900 hover:bg-blue-50"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Show latest AY ({latestAvailableAY})
          </Button>
        )}
      </div>
    </Card>
  )
}

