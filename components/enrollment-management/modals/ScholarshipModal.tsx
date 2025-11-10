'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { GraduationCap, Gear, Check, X } from '@phosphor-icons/react'

type ScholarshipData = any

interface ScholarshipForm {
  code: string
  name: string
  value: number
  minUnit: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  scholarships: ScholarshipData[]
  editingScholarship: ScholarshipData | null
  scholarshipForm: ScholarshipForm
  setScholarshipForm: (
    updater: (prev: ScholarshipForm) => ScholarshipForm
  ) => void
  scholarshipLoading: boolean
  handleCreateScholarship: () => void
  handleUpdateScholarship: () => void
  handleDeleteScholarship: (id: string) => void
  handleEditScholarship: (sch: any) => void
  resetScholarshipForm: () => void
}

const ScholarshipModal: React.FC<Props> = ({
  isOpen,
  onClose,
  scholarships,
  editingScholarship,
  scholarshipForm,
  setScholarshipForm,
  scholarshipLoading,
  handleCreateScholarship,
  handleUpdateScholarship,
  handleDeleteScholarship,
  handleEditScholarship,
  resetScholarshipForm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scholarship Management"
      size="2xl"
    >
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h3
            className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
              <GraduationCap size={14} weight="fill" className="text-white" />
            </div>
            {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scholarshipForm.code}
                onChange={(e) =>
                  setScholarshipForm((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="e.g., ACAD"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scholarshipForm.name}
                onChange={(e) =>
                  setScholarshipForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Academic Excellence"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Value (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={scholarshipForm.value}
                onChange={(e) =>
                  setScholarshipForm((prev) => ({
                    ...prev,
                    value: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="0"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Minimum Units
              </label>
              <input
                type="number"
                min={0}
                value={scholarshipForm.minUnit}
                onChange={(e) =>
                  setScholarshipForm((prev) => ({
                    ...prev,
                    minUnit: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="0"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={
                editingScholarship
                  ? handleUpdateScholarship
                  : handleCreateScholarship
              }
              disabled={scholarshipLoading}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {scholarshipLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingScholarship ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Check size={14} />
                  {editingScholarship
                    ? 'Update Scholarship'
                    : 'Add Scholarship'}
                </>
              )}
            </button>
            {editingScholarship && (
              <button
                onClick={resetScholarshipForm}
                className="px-4 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <X size={14} />
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3
            className="text-lg font-medium text-gray-900 flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
              <GraduationCap size={14} weight="fill" className="text-white" />
            </div>
            Existing Scholarships ({scholarships.length})
          </h3>
          {scholarships.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p
                className="text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                No scholarships found. Create your first scholarship above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scholarships.map((scholarship) => (
                <div
                  key={scholarship.id}
                  className="bg-white border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center"></div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 font-mono">
                            {scholarship.code} | {scholarship.name}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              Value: {scholarship.value}%
                            </span>
                            <span
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              Min Units: {scholarship.minUnit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditScholarship(scholarship)}
                        className="px-3 py-1 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center gap-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        <Gear size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteScholarship(scholarship.id)}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700 transition-colors flex items-center gap-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        <X size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ScholarshipModal
