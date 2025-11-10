'use client'

import { CourseColor, COURSE_COLORS } from '@/lib/types/course'
import { GraduationCap } from '@phosphor-icons/react'

interface CourseColorPickerProps {
  selectedColor: CourseColor
  onColorChange: (color: CourseColor) => void
  disabled?: boolean
}

const colorMap = {
  'blue-900': { bg: 'bg-blue-900', border: 'border-blue-600', name: 'Blue' },
  'red-800': { bg: 'bg-red-800', border: 'border-red-600', name: 'Red' },
  'emerald-800': {
    bg: 'bg-emerald-800',
    border: 'border-emerald-600',
    name: 'Emerald',
  },
  'yellow-800': {
    bg: 'bg-yellow-800',
    border: 'border-yellow-600',
    name: 'Yellow',
  },
  'orange-800': {
    bg: 'bg-orange-800',
    border: 'border-orange-600',
    name: 'Orange',
  },
  'violet-800': {
    bg: 'bg-violet-800',
    border: 'border-violet-600',
    name: 'Violet',
  },
  'purple-800': {
    bg: 'bg-purple-800',
    border: 'border-purple-600',
    name: 'Purple',
  },
}

export default function CourseColorPicker({
  selectedColor,
  onColorChange,
  disabled = false,
}: CourseColorPickerProps) {
  return (
    <div className="space-y-3">
      <label
        className="block text-sm font-medium text-gray-700"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        Course Color
      </label>

      <div className="grid grid-cols-7 gap-3">
        {COURSE_COLORS.map((color) => {
          const isSelected = selectedColor === color
          const colorInfo = colorMap[color]

          return (
            <button
              key={color}
              type="button"
              onClick={() => !disabled && onColorChange(color)}
              disabled={disabled}
              className={`
                relative w-12 h-12 border-2 transition-all duration-200 rounded-lg
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
              <GraduationCap
                size={16}
                className="text-white/80"
                weight="fill"
              />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center"></div>
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
          {colorMap[selectedColor].name}
        </span>
      </p>
    </div>
  )
}
