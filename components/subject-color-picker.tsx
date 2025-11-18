'use client'

import { SubjectColor, SUBJECT_COLORS } from '@/lib/subject-database'
import { BookOpen } from '@phosphor-icons/react'

interface SubjectColorPickerProps {
  selectedColor: SubjectColor
  onColorChange: (color: SubjectColor) => void
  disabled?: boolean
}

const colorMap = {
  'blue-900': {
    bg: 'bg-blue-900',
    border: 'border-blue-600',
    name: 'Blue 900',
  },
  'blue-800': {
    bg: 'bg-blue-800',
    border: 'border-blue-800',
    name: 'Blue 800',
  },
  'red-700': { bg: 'bg-red-700', border: 'border-red-600', name: 'Red 700' },
  'red-800': { bg: 'bg-red-800', border: 'border-red-700', name: 'Red 800' },
  'emerald-700': {
    bg: 'bg-emerald-700',
    border: 'border-emerald-600',
    name: 'Emerald 700',
  },
  'emerald-800': {
    bg: 'bg-emerald-800',
    border: 'border-emerald-700',
    name: 'Emerald 800',
  },
  'yellow-700': {
    bg: 'bg-yellow-700',
    border: 'border-yellow-600',
    name: 'Yellow 700',
  },
  'yellow-800': {
    bg: 'bg-yellow-800',
    border: 'border-yellow-700',
    name: 'Yellow 800',
  },
  'orange-700': {
    bg: 'bg-orange-700',
    border: 'border-orange-600',
    name: 'Orange 700',
  },
  'orange-800': {
    bg: 'bg-orange-800',
    border: 'border-orange-700',
    name: 'Orange 800',
  },
  'violet-700': {
    bg: 'bg-violet-700',
    border: 'border-violet-600',
    name: 'Violet 700',
  },
  'violet-800': {
    bg: 'bg-violet-800',
    border: 'border-violet-700',
    name: 'Violet 800',
  },
  'purple-700': {
    bg: 'bg-purple-700',
    border: 'border-purple-600',
    name: 'Purple 700',
  },
  'purple-800': {
    bg: 'bg-purple-800',
    border: 'border-purple-700',
    name: 'Purple 800',
  },
  'indigo-700': {
    bg: 'bg-indigo-700',
    border: 'border-indigo-600',
    name: 'Indigo 700',
  },
  'indigo-800': {
    bg: 'bg-indigo-800',
    border: 'border-indigo-700',
    name: 'Indigo 800',
  },
}

export default function SubjectColorPicker({
  selectedColor,
  onColorChange,
  disabled = false,
}: SubjectColorPickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-8 gap-x-0.5 gap-y-1">
        {SUBJECT_COLORS.map((color) => {
          const isSelected = selectedColor === color
          const colorInfo = colorMap[color]

          if (!colorInfo) return null

          return (
            <button
              key={color}
              type="button"
              onClick={() => !disabled && onColorChange(color)}
              disabled={disabled}
              className={`
                relative w-12 h-12 border-2 transition-all duration-200
                ${colorInfo.bg}
                ${
                  isSelected
                    ? colorInfo.border + ' ring-2 ring-offset-2 ring-blue-500'
                    : 'border-gray-300'
                }
                ${
                  disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-110 cursor-pointer'
                }
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                flex items-center justify-center
              `}
              title={colorInfo.name}
              aria-label={`Select ${colorInfo.name} color`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <BookOpen size={16} className="text-white/80" weight="fill" />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p
        className="text-xs text-gray-500"
        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
      >
        Selected:{' '}
        <span className="font-medium text-gray-700">
          {colorMap[selectedColor]?.name || 'Not selected'}
        </span>
      </p>
    </div>
  )
}
