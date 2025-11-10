'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Gear, Trash } from '@phosphor-icons/react'

interface Props {
  isOpen: boolean
  onClose: () => void
  newAY: string
  setNewAY: (v: string) => void
  newSemester: string
  setNewSemester: (v: string) => void
  newEnrollmentStartHS: string
  setNewEnrollmentStartHS: (v: string) => void
  newEnrollmentEndHS: string
  setNewEnrollmentEndHS: (v: string) => void
  newEnrollmentStartCollege: string
  setNewEnrollmentStartCollege: (v: string) => void
  newEnrollmentEndCollege: string
  setNewEnrollmentEndCollege: (v: string) => void
  updatingAY: boolean
  onUpdateAcademicYear: () => void
  onClearHSDuration: () => void
  onClearCollegeDuration: () => void
}

const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  newAY,
  setNewAY,
  newSemester,
  setNewSemester,
  newEnrollmentStartHS,
  setNewEnrollmentStartHS,
  newEnrollmentEndHS,
  setNewEnrollmentEndHS,
  newEnrollmentStartCollege,
  setNewEnrollmentStartCollege,
  newEnrollmentEndCollege,
  setNewEnrollmentEndCollege,
  updatingAY,
  onUpdateAcademicYear,
  onClearHSDuration,
  onClearCollegeDuration,
}) => {
  const renderDuration = (start: string, end: string) => {
    if (!start || !end) return null
    const s = new Date(start)
    const e = new Date(end)
    const diffTime = Math.abs(e.getTime() - s.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return (
      <div className="mt-3 pt-3 border-t border-gray-300">
        <p className="text-xs text-gray-700" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          <span className="font-medium">Duration:</span> {diffDays} {diffDays === 1 ? 'day' : 'days'}
        </p>
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center">
            <Gear size={24} className="text-white" weight="bold" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              System Settings
            </h3>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              Manage Academic Year, Semester, and Enrollment Duration
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Academic Year & Semester:
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newAY}
                onChange={(e) => setNewAY(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="AY2526"
                maxLength={6}
                style={{ fontWeight: 400 }}
              />
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Format: AY2526
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                value={newSemester}
                onChange={(e) => setNewSemester(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ fontWeight: 400 }}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Select semester (1 or 2)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Enrollment Duration for High School:
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Start Period
              </label>
              <input
                type="date"
                value={newEnrollmentStartHS}
                onChange={(e) => setNewEnrollmentStartHS(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                End Period
              </label>
              <input
                type="date"
                value={newEnrollmentEndHS}
                onChange={(e) => setNewEnrollmentEndHS(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
          {renderDuration(newEnrollmentStartHS, newEnrollmentEndHS)}
          {(newEnrollmentStartHS || newEnrollmentEndHS) && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <button
                onClick={onClearHSDuration}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <Trash size={12} />
                Cancel Enrollment
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Enrollment Duration for College:
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Start Period
              </label>
              <input
                type="date"
                value={newEnrollmentStartCollege}
                onChange={(e) => setNewEnrollmentStartCollege(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                End Period
              </label>
              <input
                type="date"
                value={newEnrollmentEndCollege}
                onChange={(e) => setNewEnrollmentEndCollege(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
          {renderDuration(newEnrollmentStartCollege, newEnrollmentEndCollege)}
          {(newEnrollmentStartCollege || newEnrollmentEndCollege) && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <button
                onClick={onClearCollegeDuration}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <Trash size={12} />
                Cancel Enrollment
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              disabled={updatingAY}
            >
            Cancel
          </button>
          <button
            onClick={onUpdateAcademicYear}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            disabled={updatingAY}
          >
            {updatingAY ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                Update Settings
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default SettingsModal


