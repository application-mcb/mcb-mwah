'use client'

import { TASK_COLORS, TaskColor } from '@/lib/types/task'
import { ListChecks } from '@phosphor-icons/react'

interface TaskColorPickerProps {
  selectedColor: TaskColor
  onColorChange: (color: TaskColor) => void
  disabled?: boolean
}

const colorMap = {
  'blue-900': { bg: 'bg-blue-900', border: 'border-blue-600', name: 'Blue' },
  'green-600': {
    bg: 'bg-green-600',
    border: 'border-green-500',
    name: 'Green',
  },
  'yellow-600': {
    bg: 'bg-yellow-600',
    border: 'border-yellow-500',
    name: 'Yellow',
  },
  'orange-600': {
    bg: 'bg-orange-600',
    border: 'border-orange-500',
    name: 'Orange',
  },
  'red-600': { bg: 'bg-red-600', border: 'border-red-500', name: 'Red' },
  'purple-600': {
    bg: 'bg-purple-600',
    border: 'border-purple-500',
    name: 'Purple',
  },
  'pink-600': { bg: 'bg-pink-600', border: 'border-pink-500', name: 'Pink' },
  'teal-600': { bg: 'bg-teal-600', border: 'border-teal-500', name: 'Teal' },
}

export default function TaskColorPicker({
  selectedColor,
  onColorChange,
  disabled = false,
}: TaskColorPickerProps) {
  return (
    <div className="space-y-3">
      <label
        className="block text-sm font-medium text-gray-700"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        Task Color
      </label>

      <div className="grid grid-cols-4 gap-3">
        {TASK_COLORS.map((color) => {
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
              <ListChecks
                size={16}
                className="text-white/80"
                weight="fill"
              />
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

