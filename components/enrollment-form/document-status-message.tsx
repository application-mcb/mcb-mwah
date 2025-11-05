'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Warning, FileText, Check } from '@phosphor-icons/react'
import { toast } from 'react-toastify'

type DocumentStatusMessageProps = {
  documentsStatus: {
    uploaded: number
    required: number
    isComplete: boolean
    uploadedDocuments?: any[]
  } | null
}

export default function DocumentStatusMessage({
  documentsStatus,
}: DocumentStatusMessageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Warning size={20} className="text-white" weight="bold" />
          </div>
          <div>
            <h1
              className="text-2xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Complete Document Requirements
            </h1>
            <p className="text-sm text-gray-600">
              You must upload all required documents before proceeding with
              enrollment
            </p>
          </div>
        </div>
      </div>

      {/* Document Requirements Alert */}
      <Card className="p-6 border-none bg-gray-50 border-1 shadow-sm border-blue-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
            <FileText size={24} className="text-blue-900" weight="bold" />
          </div>
          <div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Required Documents Missing
            </h3>
            <p className="text-sm text-gray-600">
              You have uploaded {documentsStatus?.uploaded || 0} of{' '}
              {documentsStatus?.required || 4} required documents. Complete document
              upload to access the enrollment form.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-gray-200 p-4">
            <h4
              className="text-sm font-medium text-gray-900 mb-3"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Required Documents:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'reportCard', name: 'Report Card (Form 138)' },
                {
                  key: 'certificateOfGoodMoral',
                  name: 'Certificate of Good Moral Character',
                },
                { key: 'birthCertificate', name: 'Birth Certificate' },
                { key: 'idPicture', name: 'ID Picture' },
              ].map((doc) => {
                const isUploaded =
                  documentsStatus?.uploadedDocuments?.some(
                    (uploadedDoc: any) => uploadedDoc.type === doc.key
                  ) || false
                return (
                  <div key={doc.key} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 flex items-center justify-center border-2 ${
                        isUploaded
                          ? 'border-blue-900 bg-blue-900'
                          : 'border-gray-300'
                      }`}
                    >
                      {isUploaded ? (
                        <Check
                          size={12}
                          className="text-white"
                          weight="bold"
                        />
                      ) : (
                        <div className="w-3 h-3 border border-gray-300"></div>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isUploaded ? 'text-blue-900' : 'text-gray-700'
                      }`}
                    >
                      {doc.name}
                      {!isUploaded && (
                        <span className="text-gray-500 ml-1">*</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                toast.info(
                  'Navigate to the Documents section in your dashboard sidebar to upload required documents.'
                )
              }}
              className="bg-blue-900 hover:bg-blue-900 text-white"
            >
              <FileText size={16} className="mr-2" />
              Go to Documents Section
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Status
            </Button>
          </div>
        </div>
      </Card>

      {/* Help Information */}
      <Card className="p-6 border-none bg-gray-50 border-1 shadow-sm border-blue-900">
        <h3
          className="text-lg font-medium text-gray-900 mb-3"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          Need Help?
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            • Navigate to the <strong>Documents</strong> section in your
            dashboard sidebar
          </p>
          <p>• Upload each required document using the upload buttons</p>
          <p>• Ensure all documents are clearly readable and complete</p>
          <p>
            • Once all documents are uploaded, return here to access the
            enrollment form
          </p>
        </div>
      </Card>
    </div>
  )
}
