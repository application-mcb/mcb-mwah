'use client'

import React, { useState } from 'react'
import {
  ExtendedEnrollmentData,
  StudentDocuments,
  StudentDocument,
} from '../types'
import { formatDate } from '../utils/format'
import {
  FileText,
  Eye,
  Check,
  X,
  Warning,
  ArrowCounterClockwise,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { FileText as FileTextIcon } from '@phosphor-icons/react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import DocumentValidationSummary from '@/components/document-validation-summary'
import DocumentScannerModal from '@/components/document-scanner-modal'
import { DocumentValidation } from '@/lib/types/document-validation'

interface DocumentsTabProps {
  viewingEnrollment: ExtendedEnrollmentData | null
  studentDocuments: Record<string, StudentDocuments>
  onViewDocument: (doc: {
    url: string
    fileName: string
    fileType: string
    fileFormat: string
  }) => void
  registrarUid: string
  onDocumentStatusChange?: () => void
}

export default function DocumentsTab({
  viewingEnrollment,
  studentDocuments,
  onViewDocument,
  registrarUid,
  onDocumentStatusChange,
}: DocumentsTabProps) {
  const [showOnlyPending, setShowOnlyPending] = useState(true)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [documentToApprove, setDocumentToApprove] = useState<{
    docKey: string
    doc: StudentDocument
  } | null>(null)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [documentToReject, setDocumentToReject] = useState<{
    docKey: string
    doc: StudentDocument
  } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [documentToRevoke, setDocumentToRevoke] = useState<{
    docKey: string
    doc: StudentDocument
  } | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [scanningDocument, setScanningDocument] = useState<string | null>(null)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [selectedDocumentForScan, setSelectedDocumentForScan] = useState<{
    docKey: string
    doc: StudentDocument
  } | null>(null)

  const documents = viewingEnrollment
    ? studentDocuments[viewingEnrollment.userId]
    : null

  const documentTypes = {
    birthCertificate: 'Birth Certificate',
    certificateOfGoodMoral: 'Certificate of Good Moral',
    form137: 'Form 137',
    idPicture: 'ID Picture',
    reportCard: 'Report Card',
    certificateOfCompletion: 'Certificate of Completion',
    marriageCertificate: 'Marriage Certificate',
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-800 text-white'
      case 'rejected':
        return 'bg-red-800 text-white'
      case 'pending':
      default:
        return 'bg-yellow-600 text-white'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'pending':
      default:
        return 'Pending'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Check size={12} weight="bold" />
      case 'rejected':
        return <X size={12} weight="bold" />
      case 'pending':
      default:
        return <Warning size={12} weight="bold" />
    }
  }

  const handleApproveClick = (docKey: string, doc: StudentDocument) => {
    setDocumentToApprove({ docKey, doc })
    setShowApprovalModal(true)
  }

  const handleConfirmApprove = async () => {
    if (!documentToApprove || !viewingEnrollment) return

    setProcessingAction(`${documentToApprove.docKey}-approve`)
    try {
      const response = await fetch(
        `/api/documents/${documentToApprove.docKey}?userId=${viewingEnrollment.userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'approved',
            registrarUid,
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Document approved successfully', { autoClose: 3000 })
        setShowApprovalModal(false)
        setDocumentToApprove(null)
        if (onDocumentStatusChange) {
          onDocumentStatusChange()
        }
      } else {
        toast.error(data.error || 'Failed to approve document', {
          autoClose: 5000,
        })
      }
    } catch (error) {
      console.error('Error approving document:', error)
      toast.error('Network error occurred while approving document', {
        autoClose: 5000,
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleCancelApprove = () => {
    setShowApprovalModal(false)
    setDocumentToApprove(null)
  }

  const handleRejectClick = (docKey: string, doc: StudentDocument) => {
    setDocumentToReject({ docKey, doc })
    setRejectionReason('')
    setShowRejectionModal(true)
  }

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason', { autoClose: 3000 })
      return
    }
    // Close rejection modal and show confirmation
    setShowRejectionModal(false)
    setShowRejectConfirmModal(true)
  }

  const handleConfirmReject = async () => {
    if (!documentToReject || !viewingEnrollment) return

    setProcessingAction(`${documentToReject.docKey}-reject`)
    try {
      const response = await fetch(
        `/api/documents/${documentToReject.docKey}?userId=${viewingEnrollment.userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'rejected',
            rejectionReason: rejectionReason.trim(),
            registrarUid,
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Document rejected successfully', { autoClose: 3000 })
        setShowRejectConfirmModal(false)
        setDocumentToReject(null)
        setRejectionReason('')
        if (onDocumentStatusChange) {
          onDocumentStatusChange()
        }
      } else {
        toast.error(data.error || 'Failed to reject document', {
          autoClose: 5000,
        })
      }
    } catch (error) {
      console.error('Error rejecting document:', error)
      toast.error('Network error occurred while rejecting document', {
        autoClose: 5000,
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleCancelReject = () => {
    setShowRejectionModal(false)
    setShowRejectConfirmModal(false)
    setDocumentToReject(null)
    setRejectionReason('')
  }

  const handleBackToRejectReason = () => {
    setShowRejectConfirmModal(false)
    setShowRejectionModal(true)
  }

  const handleRevokeClick = (docKey: string, doc: StudentDocument) => {
    setDocumentToRevoke({ docKey, doc })
    setShowRevokeModal(true)
  }

  const handleConfirmRevoke = async () => {
    if (!documentToRevoke || !viewingEnrollment) return

    setProcessingAction(`${documentToRevoke.docKey}-revoke`)
    try {
      const response = await fetch(
        `/api/documents/${documentToRevoke.docKey}?userId=${viewingEnrollment.userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'pending',
            registrarUid,
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Document approval revoked successfully', {
          autoClose: 3000,
        })
        setShowRevokeModal(false)
        setDocumentToRevoke(null)
        if (onDocumentStatusChange) {
          onDocumentStatusChange()
        }
      } else {
        toast.error(data.error || 'Failed to revoke document approval', {
          autoClose: 5000,
        })
      }
    } catch (error) {
      console.error('Error revoking document approval:', error)
      toast.error('Network error occurred while revoking document approval', {
        autoClose: 5000,
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleCancelRevoke = () => {
    setShowRevokeModal(false)
    setDocumentToRevoke(null)
  }

  const handleScanDocument = async (docKey: string, doc: StudentDocument) => {
    if (!viewingEnrollment) return

    setScanningDocument(docKey)
    try {
      const response = await fetch(
        `/api/documents/${docKey}/scan?userId=${viewingEnrollment.userId}&registrarUid=${registrarUid}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )

      const data = await response.json()

      if (response.ok && data.success && data.validation) {
        // Update document with validation results
        const updateResponse = await fetch(
          `/api/documents/${docKey}?userId=${viewingEnrollment.userId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: doc.status || 'pending',
              registrarUid,
              validation: data.validation,
            }),
          }
        )

        if (updateResponse.ok) {
          toast.success('Document scanned successfully', { autoClose: 3000 })
          if (onDocumentStatusChange) {
            onDocumentStatusChange()
          }
          // Show scanner modal with results
          setSelectedDocumentForScan({
            docKey,
            doc: { ...doc, ...data.validation },
          })
          setShowScannerModal(true)
        } else {
          toast.error('Failed to save scan results', { autoClose: 5000 })
        }
      } else {
        toast.error(data.error || 'Failed to scan document', {
          autoClose: 5000,
        })
      }
    } catch (error) {
      console.error('Error scanning document:', error)
      toast.error('Network error occurred while scanning document', {
        autoClose: 5000,
      })
    } finally {
      setScanningDocument(null)
    }
  }

  const handleViewScanResults = (docKey: string, doc: StudentDocument) => {
    setSelectedDocumentForScan({ docKey, doc })
    setShowScannerModal(true)
  }

  const getValidationStatusColor = (validationStatus?: string) => {
    switch (validationStatus) {
      case 'valid':
        return 'bg-emerald-800 text-white'
      case 'warning':
        return 'bg-yellow-600 text-white'
      case 'invalid':
        return 'bg-red-800 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getValidationStatusIcon = (validationStatus?: string) => {
    switch (validationStatus) {
      case 'valid':
        return <Check size={10} weight="bold" />
      case 'warning':
        return <Warning size={10} weight="bold" />
      case 'invalid':
        return <X size={10} weight="bold" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!documents || Object.keys(documents).length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 p-4 text-center rounded-xl">
        <p className="text-gray-500">No documents submitted</p>
      </div>
    )
  }

  // Filter documents based on showOnlyPending
  const filteredDocuments = showOnlyPending
    ? Object.entries(documents).filter(([_, doc]) => {
        const status = doc.status || 'pending'
        return status === 'pending' || status === 'rejected'
      })
    : Object.entries(documents)

  // Determine status for each document (default to pending if not set)
  const getDocumentStatus = (doc: StudentDocument) => {
    return doc.status || 'pending'
  }

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showOnlyPending"
          checked={showOnlyPending}
          onChange={(e) => setShowOnlyPending(e.target.checked)}
          className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
        />
        <label
          htmlFor="showOnlyPending"
          className="text-sm text-gray-700 cursor-pointer"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Show only pending
        </label>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 p-4 text-center rounded-xl">
            <p className="text-gray-500">No pending documents</p>
          </div>
        ) : (
          filteredDocuments.map(([key, doc]) => {
            const status = getDocumentStatus(doc)
            const canApproveReject =
              status === 'pending' || status === 'rejected'
            const isApproved = status === 'approved'

            return (
              <div
                key={key}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center mr-4">
                    <FileText size={16} weight="fill" className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-gray-900">
                        {documentTypes[key as keyof typeof documentTypes] ||
                          key}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 ${getStatusColor(
                          status
                        )}`}
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {getStatusIcon(status)}
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {doc.fileName} • {doc.fileFormat.toUpperCase()} •{' '}
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {status === 'rejected' && doc.rejectionReason && (
                      <p
                        className="text-xs text-red-700 mt-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Uploaded: {formatDate(doc.uploadedAt)}
                    </p>
                    {/* Validation Summary */}
                    {doc.validationStatus && (
                      <div className="mt-2">
                        <DocumentValidationSummary
                          validation={doc as any}
                          onViewFullDetails={() =>
                            handleViewScanResults(key, doc)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onViewDocument({
                        url: doc.fileUrl,
                        fileName: doc.fileName,
                        fileType: doc.fileType,
                        fileFormat: doc.fileFormat,
                      })
                    }}
                    className="h-8 px-3 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center gap-1.5"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <Eye size={12} />
                    View
                  </button>
                  {/* Scan Button */}
                  <Button
                    size="sm"
                    onClick={() => handleScanDocument(key, doc)}
                    disabled={scanningDocument === key}
                    loading={scanningDocument === key}
                    className="text-xs rounded-lg"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <MagnifyingGlass size={12} />
                    {doc.validationStatus ? 'Re-scan' : 'Scan'}
                  </Button>
                  {canApproveReject && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveClick(key, doc)}
                        disabled={processingAction === `${key}-approve`}
                        className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        <Check size={12} />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(key, doc)}
                        disabled={processingAction === `${key}-reject`}
                        loading={processingAction === `${key}-reject`}
                        className="text-xs rounded-lg"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        <X size={12} />
                        Reject
                      </Button>
                    </>
                  )}
                  {isApproved && (
                    <Button
                      size="sm"
                      onClick={() => handleRevokeClick(key, doc)}
                      disabled={processingAction === `${key}-revoke`}
                      loading={processingAction === `${key}-revoke`}
                      className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      <ArrowCounterClockwise size={12} />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectionModal}
        onClose={handleCancelReject}
        title="Reject Document"
        size="md"
      >
        <div className="p-6 space-y-4">
          {documentToReject && (
            <div className="space-y-2">
              <p
                className="text-sm text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <strong>Document:</strong>{' '}
                {documentTypes[
                  documentToReject.docKey as keyof typeof documentTypes
                ] || documentToReject.docKey}
              </p>
              <p
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {documentToReject.doc.fileName}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="rejectionReason"
              className="text-sm font-medium text-gray-700 block"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Rejection Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this document..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none"
              rows={4}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
            <p
              className="text-xs text-gray-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              This reason will be shown to the student.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelReject}
              className="flex-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim()}
              className="flex-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approval Confirmation Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={handleCancelApprove}
        title="Approve Document"
        size="md"
      >
        <div className="p-6 space-y-4">
          {documentToApprove && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Check size={24} className="text-emerald-800" weight="bold" />
                </div>
                <div>
                  <p
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Approve Document
                  </p>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {documentTypes[
                      documentToApprove.docKey as keyof typeof documentTypes
                    ] || documentToApprove.docKey}
                  </p>
                </div>
              </div>
              <p
                className="text-sm text-gray-700 mt-3"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Are you sure you want to approve this document? This action will
                mark the document as approved and notify the student.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mt-2">
                <p className="text-xs text-gray-600">
                  <strong>File:</strong> {documentToApprove.doc.fileName}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Size:</strong>{' '}
                  {formatFileSize(documentToApprove.doc.fileSize)}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelApprove}
              className="flex-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={processingAction !== null}
              loading={processingAction !== null}
              className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Check size={16} className="mr-2" />
              Approve Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rejection Confirmation Modal */}
      <Modal
        isOpen={showRejectConfirmModal}
        onClose={handleCancelReject}
        title="Confirm Rejection"
        size="md"
      >
        <div className="p-6 space-y-4">
          {documentToReject && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <X size={24} className="text-red-800" weight="bold" />
                </div>
                <div>
                  <p
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Confirm Document Rejection
                  </p>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {documentTypes[
                      documentToReject.docKey as keyof typeof documentTypes
                    ] || documentToReject.docKey}
                  </p>
                </div>
              </div>
              <p
                className="text-sm text-gray-700 mt-3"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Are you sure you want to reject this document? This action will
                notify the student with the rejection reason below.
              </p>
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg mt-2">
                <p className="text-xs font-semibold text-red-900 mb-1">
                  Rejection Reason:
                </p>
                <p className="text-xs text-red-800">{rejectionReason}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleBackToRejectReason}
              className="flex-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={processingAction !== null}
              loading={processingAction !== null}
              className="flex-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <X size={16} className="mr-2" />
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Confirmation Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={handleCancelRevoke}
        title="Revoke Document Approval"
        size="md"
      >
        <div className="p-6 space-y-4">
          {documentToRevoke && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ArrowCounterClockwise
                    size={24}
                    className="text-yellow-800"
                    weight="bold"
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Revoke Document Approval
                  </p>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {documentTypes[
                      documentToRevoke.docKey as keyof typeof documentTypes
                    ] || documentToRevoke.docKey}
                  </p>
                </div>
              </div>
              <p
                className="text-sm text-gray-700 mt-3"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Are you sure you want to revoke the approval for this document?
                The document status will be changed back to pending and the
                student may need to resubmit.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mt-2">
                <p className="text-xs text-gray-600">
                  <strong>File:</strong> {documentToRevoke.doc.fileName}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Size:</strong>{' '}
                  {formatFileSize(documentToRevoke.doc.fileSize)}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelRevoke}
              className="flex-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRevoke}
              disabled={processingAction !== null}
              loading={processingAction !== null}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <ArrowCounterClockwise size={16} className="mr-2" />
              Revoke Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Document Scanner Modal */}
      {selectedDocumentForScan && (
        <DocumentScannerModal
          isOpen={showScannerModal}
          onClose={() => {
            setShowScannerModal(false)
            setSelectedDocumentForScan(null)
          }}
          documentName={
            documentTypes[
              selectedDocumentForScan.docKey as keyof typeof documentTypes
            ] || selectedDocumentForScan.docKey
          }
          documentUrl={selectedDocumentForScan.doc.fileUrl}
          validation={selectedDocumentForScan.doc as any}
          onApprove={() => {
            if (selectedDocumentForScan) {
              handleApproveClick(
                selectedDocumentForScan.docKey,
                selectedDocumentForScan.doc
              )
              setShowScannerModal(false)
            }
          }}
          onReject={() => {
            if (selectedDocumentForScan) {
              handleRejectClick(
                selectedDocumentForScan.docKey,
                selectedDocumentForScan.doc
              )
              setShowScannerModal(false)
            }
          }}
        />
      )}
    </div>
  )
}
