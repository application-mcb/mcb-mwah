'use client'

import React from 'react'
import { ExtendedEnrollmentData, StudentDocuments } from '../types'
import { formatDate } from '../utils/format'
import { FileText, Eye } from '@phosphor-icons/react'
import { FileText as FileTextIcon } from '@phosphor-icons/react'

interface DocumentsTabProps {
  viewingEnrollment: ExtendedEnrollmentData | null
  studentDocuments: Record<string, StudentDocuments>
  onViewDocument: (doc: {url: string, fileName: string, fileType: string, fileFormat: string}) => void
}

export default function DocumentsTab({
  viewingEnrollment,
  studentDocuments,
  onViewDocument,
}: DocumentsTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <FileTextIcon size={14} weight="fill" className="text-white" />
        </div>
        Submitted Documents
      </h3>
      {(() => {
        const documents = viewingEnrollment
          ? studentDocuments[viewingEnrollment.userId]
          : null
        if (!documents || Object.keys(documents).length === 0) {
          return (
            <div className="bg-gray-50 border border-gray-200 p-4 text-center rounded-xl">
              <p className="text-gray-500">No documents submitted</p>
            </div>
          )
        }

        const documentTypes = {
          birthCertificate: 'Birth Certificate',
          certificateOfGoodMoral: 'Certificate of Good Moral',
          form137: 'Form 137',
          idPicture: 'ID Picture',
          reportCard: 'Report Card',
        }

        return (
          <div className="space-y-3">
            {Object.entries(documents).map(([key, doc]) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center mr-4">
                    <FileText
                      size={16}
                      weight="fill"
                      className="text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">
                      {documentTypes[key as keyof typeof documentTypes] ||
                        key}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.fileName} • {doc.fileFormat.toUpperCase()} •{' '}
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-gray-400">
                      Uploaded: {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onViewDocument({
                      url: doc.fileUrl,
                      fileName: doc.fileName,
                      fileType: doc.fileType,
                      fileFormat: doc.fileFormat,
                    })
                  }}
                  className="px-3 py-1 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg text-white text-xs hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center gap-1"
                >
                  <Eye size={12} />
                  View Document
                </button>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
