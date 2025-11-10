'use client'

import React from 'react'
import { ExtendedEnrollmentData, StudentDocument, StudentDocuments } from '../types'
import { Eye, FileText as FileTextIcon } from '@phosphor-icons/react'

// types moved to ../types

interface Props {
  viewingEnrollment: ExtendedEnrollmentData | null
  studentDocuments: Record<string, StudentDocuments>
  formatDate: (dateInput: any) => string
  onViewDocument: (doc: StudentDocument) => void
}

const DocumentsTab: React.FC<Props> = ({
  viewingEnrollment,
  studentDocuments,
  formatDate,
  onViewDocument,
}) => {
  const documents = viewingEnrollment
    ? studentDocuments[viewingEnrollment.userId]
    : null

  if (!documents || Object.keys(documents).length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          No documents submitted
        </p>
      </div>
    )
  }

  const documentTypes: Record<string, string> = {
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
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl"
        >
          <div className="flex items-center flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mr-4">
              <FileTextIcon size={16} weight="fill" className="text-white" />
            </div>
            <div className="flex-1">
              <p
                className="text-xs font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {documentTypes[key] || key}
              </p>
              <p
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {doc.fileName} • {doc.fileFormat.toUpperCase()} •{' '}
                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
              <p
                className="text-xs text-gray-400"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Uploaded: {formatDate(doc.uploadedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onViewDocument(doc)}
            className="px-3 py-1 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center gap-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Eye size={12} />
            View Document
          </button>
        </div>
      ))}
    </div>
  )
}

export default DocumentsTab


