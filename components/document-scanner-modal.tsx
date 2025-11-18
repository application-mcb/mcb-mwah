'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { DocumentValidation } from '@/lib/types/document-validation'
import { Check, X, Warning, MagnifyingGlass, XCircle, CheckCircle, ArrowCounterClockwise, FileArrowUp } from '@phosphor-icons/react'

interface DocumentScannerModalProps {
  isOpen: boolean
  onClose: () => void
  documentName: string
  documentUrl: string
  validation: DocumentValidation | null
  onApprove?: () => void
  onReject?: () => void
  onRequestReupload?: () => void
}

export default function DocumentScannerModal({
  isOpen,
  onClose,
  documentName,
  documentUrl,
  validation,
  onApprove,
  onReject,
  onRequestReupload,
}: DocumentScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'validation'>('validation')

  if (!validation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Document Scanner" size="lg">
        <div className="p-6 text-center">
          <p className="text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            No scan results available
          </p>
        </div>
      </Modal>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <Check size={16} weight="bold" />
      case 'warning':
        return <Warning size={16} weight="bold" />
      case 'invalid':
        return <X size={16} weight="bold" />
      default:
        return null
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Scanner Results" size="xl">
      <div className="p-6 space-y-6">
        {/* Header with Status */}
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {documentName}
            </h3>
            <p
              className="text-sm text-gray-500 mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Scanned: {new Date(validation.scannedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-sm ${getStatusColor(
                validation.validationStatus
              )}`}
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {getStatusIcon(validation.validationStatus)}
              {validation.validationStatus.charAt(0).toUpperCase() +
                validation.validationStatus.slice(1)}
            </span>
            {validation.confidenceScore > 0 && (
              <span
                className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {(validation.confidenceScore * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-4 py-2 text-sm font-medium transition-all rounded-t-lg flex items-center gap-2 ${
              activeTab === 'validation'
                ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <CheckCircle size={16} weight={activeTab === 'validation' ? 'fill' : 'regular'} />
            Validation
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 text-sm font-medium transition-all rounded-t-lg flex items-center gap-2 ${
              activeTab === 'text'
                ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <FileArrowUp size={16} weight={activeTab === 'text' ? 'fill' : 'regular'} />
            Extracted Text
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === 'validation' ? (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h4
                  className="text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Summary
                </h4>
                <p
                  className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {validation.validationSummary}
                </p>
              </div>

              {/* Key Findings */}
              {validation.keyFindings && validation.keyFindings.length > 0 && (
                <div>
                  <h4
                    className="text-sm font-medium text-gray-900 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Key Findings
                  </h4>
                  <ul className="list-disc list-inside space-y-1 bg-gray-50 p-3 rounded-lg">
                    {validation.keyFindings.map((finding, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-700"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Validation Details */}
              {validation.validationDetails && (
                <div className="space-y-4">
                  {/* Matches */}
                  {validation.validationDetails.matches &&
                    validation.validationDetails.matches.length > 0 && (
                      <div>
                        <h4
                          className="text-sm font-medium text-emerald-800 mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Matches ({validation.validationDetails.matches.length})
                        </h4>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                          {validation.validationDetails.matches.map((match, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-sm"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              <Check size={16} className="text-emerald-800 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong className="text-emerald-900">{match.field}:</strong>
                                <span className="text-gray-700 ml-2">{match.foundValue}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({(match.confidence * 100).toFixed(0)}% confidence)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Mismatches */}
                  {validation.validationDetails.mismatches &&
                    validation.validationDetails.mismatches.length > 0 && (
                      <div>
                        <h4
                          className="text-sm font-medium text-red-800 mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Mismatches ({validation.validationDetails.mismatches.length})
                        </h4>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                          {validation.validationDetails.mismatches.map((mismatch, index) => (
                            <div
                              key={index}
                              className="text-sm"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              <div className="flex items-start gap-2">
                                <X size={16} className="text-red-800 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <strong className="text-red-900">{mismatch.field}</strong>
                                  <div className="mt-1 space-y-1 ml-4">
                                    <div className="text-gray-700">
                                      <span className="font-medium">Expected:</span>{' '}
                                      {mismatch.expectedValue || 'N/A'}
                                    </div>
                                    <div className="text-gray-700">
                                      <span className="font-medium">Found:</span>{' '}
                                      {mismatch.foundValue || 'N/A'}
                                    </div>
                                    {mismatch.notes && (
                                      <div className="text-red-700 italic text-xs">
                                        {mismatch.notes}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                      Confidence: {(mismatch.confidence * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Missing Fields */}
                  {validation.validationDetails.missingFields &&
                    validation.validationDetails.missingFields.length > 0 && (
                      <div>
                        <h4
                          className="text-sm font-medium text-yellow-800 mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Missing Fields
                        </h4>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <ul className="list-disc list-inside space-y-1">
                            {validation.validationDetails.missingFields.map((field, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700"
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                              >
                                {field}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                  {/* Extra Fields */}
                  {validation.validationDetails.extraFields &&
                    validation.validationDetails.extraFields.length > 0 && (
                      <div>
                        <h4
                          className="text-sm font-medium text-blue-800 mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Additional Information Found
                        </h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <ul className="list-disc list-inside space-y-1">
                            {validation.validationDetails.extraFields.map((field, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700"
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                              >
                                {field}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h4
                className="text-sm font-medium text-gray-900 mb-2"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Extracted Text
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre
                  className="text-sm text-gray-700 whitespace-pre-wrap font-sans max-h-80 overflow-y-auto"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {validation.extractedText}
                </pre>
              </div>
              {validation.ocrMethod && (
                <p
                  className="text-xs text-gray-500 mt-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  OCR Method: {validation.ocrMethod}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <XCircle size={18} />
            Close
          </Button>
          {onRequestReupload && (
            <Button
              variant="outline"
              onClick={onRequestReupload}
              className="flex-1 rounded-full flex items-center justify-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <ArrowCounterClockwise size={18} />
              Request Re-upload
            </Button>
          )}
          {onReject && (
            <Button
              variant="destructive"
              onClick={onReject}
              className="flex-1 rounded-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <X size={18} weight="bold" />
              Reject
            </Button>
          )}
          {onApprove && (
            <Button
              onClick={onApprove}
              className="flex-1 rounded-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <CheckCircle size={18} weight="bold" />
              Approve
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

