'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { initializeApp, getApps } from 'firebase/app'
import {
  FileText,
  Camera,
  IdentificationCard,
  Upload,
  X,
  Check,
  Trash,
  Eye,
  Download,
  Warning,
  GraduationCap,
  Certificate,
  BookOpen,
  User,
  Heart,
  Phone,
  MapPin,
  Users,
  UserCircle,
  File,
  Pencil,
  ArrowRight,
  ArrowLeft,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

interface DocumentInfo {
  id: string
  name: string
  type:
    | 'reportCard'
    | 'certificateOfGoodMoral'
    | 'birthCertificate'
    | 'idPicture'
    | 'form137'
    | 'certificateOfCompletion'
    | 'marriageCertificate'
  fileName: string
  fileUrl: string
  fileType: string
  fileFormat: string
  uploadDate: string
  uploadedAt: string
  fileSize: number
  verified?: boolean
  verificationDate?: string | null
  expiryDate?: string | null
  notes?: string
}

interface DocumentsManagerProps {
  userId: string
  userProfile?: any
  onProgressUpdate?: () => void
}

const REQUIRED_DOCUMENTS = [
  {
    key: 'reportCard' as const,
    name: 'Report Card (Form 138)',
    description: 'Latest report card or Form 138',
    required: true,
    icon: GraduationCap,
  },
  {
    key: 'certificateOfGoodMoral' as const,
    name: 'Certificate of Good Moral Character',
    description: 'From previous school',
    required: true,
    icon: Certificate,
  },
  {
    key: 'birthCertificate' as const,
    name: 'Birth Certificate',
    description: 'PSA-issued birth certificate',
    required: true,
    icon: IdentificationCard,
  },
  {
    key: 'idPicture' as const,
    name: 'ID Picture',
    description: 'Recent Formal Photo (2x2)',
    required: true,
    icon: User,
  },
  {
    key: 'form137' as const,
    name: 'Form 137',
    description: 'Permanent Record',
    required: true,
    icon: BookOpen,
  },
  {
    key: 'certificateOfCompletion' as const,
    name: 'Certificate of Completion',
    description: 'From previous school',
    required: true,
    icon: Certificate,
  },
  {
    key: 'marriageCertificate' as const,
    name: 'Marriage Certificate',
    description: 'Required for married students only',
    required: 'conditional', // Will be determined by civil status
    icon: Heart,
  },
]

export default function DocumentsManager({
  userId,
  userProfile,
  onProgressUpdate,
}: DocumentsManagerProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraDocumentKey, setCameraDocumentKey] = useState<string | null>(
    null
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentInfo | null>(
    null
  )
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<DocumentInfo | null>(
    null
  )
  const [filePreviewModalOpen, setFilePreviewModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedDocumentKey, setSelectedDocumentKey] = useState<string>('')
  const [isProcessingFile, setIsProcessingFile] = useState(false)

  // Initialize Firebase
  useEffect(() => {
    // Check if Firebase app is already initialized
    if (typeof window !== 'undefined' && !getApps().length) {
      initializeApp(firebaseConfig)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [userId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (documentKey: string, file: File) => {
    setUploadingDocKey(documentKey)
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setUploadProgress(0)

      console.log(
        'Starting upload for file:',
        file.name,
        'type:',
        file.type,
        'size:',
        file.size
      )

      const storage = getStorage()
      const fileName = `${userId}/${documentKey}/${Date.now()}_${file.name}`
      const storageRef = ref(storage, fileName)

      console.log('Storage ref:', fileName)

      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log('Upload progress:', progress + '%')
          setUploadProgress(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          console.error('Error code:', error.code)
          console.error('Error message:', error.message)
          toast.error(`Upload failed: ${error.message || 'Unknown error'}`)
          setUploadingDocKey(null)
        },
        async () => {
          try {
            console.log('Upload completed, getting download URL...')
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            console.log('Download URL obtained:', downloadURL)

            const documentData = {
              userId,
              type: documentKey,
              fileName: file.name,
              downloadURL,
              size: file.size,
            }

            console.log('Saving document data to database:', documentData)

            const response = await fetch('/api/documents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(documentData),
            })

            console.log('Database response status:', response.status)

            if (response.ok) {
              const result = await response.json()
              console.log('Document saved successfully:', result)
              toast.success('Document uploaded successfully')
              loadDocuments()

              // Trigger progress update callback
              if (onProgressUpdate) {
                onProgressUpdate()
              }
            } else {
              const errorText = await response.text()
              console.error('Failed to save document. Response:', errorText)
              throw new Error(
                `Failed to save document info: ${response.status} ${response.statusText}`
              )
            }
          } catch (error) {
            console.error('Error saving document:', error)
            toast.error(
              error instanceof Error
                ? error.message
                : 'Failed to save document information'
            )
          } finally {
            setUploadingDocKey(null)
            setUploadProgress(0)
          }
        }
      )
    } catch (error) {
      console.error('Upload setup error:', error)
      toast.error('Upload failed')
      setUploadingDocKey(null)
    }
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return

    try {
      // Delete from Firebase Storage
      const storage = getStorage()
      const storageRef = ref(
        storage,
        documentToDelete.fileUrl.split('/o/')[1].split('?')[0]
      )
      await deleteObject(storageRef)

      // Delete from database
      const response = await fetch(
        `/api/documents/${documentToDelete.id}?userId=${userId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('Document deleted successfully')
        loadDocuments()
      } else {
        throw new Error('Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    } finally {
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
    }
  }

  const handleDownload = async (document: DocumentInfo) => {
    try {
      // Show loading state
      toast.info('Preparing download...')

      // Use server-side download endpoint instead of direct fetch
      const response = await fetch('/api/documents/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: document.fileUrl,
          fileName: document.fileName,
          documentId: document.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to download file')
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const downloadLink = window.document.createElement('a')
      downloadLink.href = url
      downloadLink.download = document.fileName || 'document'

      // Trigger download
      window.document.body.appendChild(downloadLink)
      downloadLink.click()

      // Cleanup
      window.document.body.removeChild(downloadLink)
      window.URL.revokeObjectURL(url)

      toast.success('Download completed successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to download file. Please try again.'
      )
    }
  }

  const handlePreview = (document: DocumentInfo) => {
    setPreviewDocument(document)
    setPreviewModalOpen(true)
  }

  const handleUploadFromPreview = async () => {
    console.log('Starting upload from preview modal')
    if (selectedFile && selectedDocumentKey) {
      console.log('Closing preview modal and starting upload')
      setFilePreviewModalOpen(false)
      setIsProcessingFile(false)
      await handleFileUpload(selectedDocumentKey, selectedFile)
      setSelectedFile(null)
      setSelectedDocumentKey('')
    }
  }

  const handleCancelPreview = () => {
    console.log('Canceling preview modal')
    setFilePreviewModalOpen(false)
    setSelectedFile(null)
    setSelectedDocumentKey('')
    setIsProcessingFile(false)
  }

  const getDocumentStatus = (key: string) => {
    return documents.find((doc) => doc.type === key)
  }

  const getCardGradient = (hasDoc: boolean) =>
    hasDoc
      ? 'bg-gradient-to-br from-blue-800 to-blue-900'
      : 'bg-gradient-to-br from-red-700 to-red-800'

  const getCardShadow = (hasDoc: boolean) => (hasDoc ? '#3b82f6' : '#ef4444')

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Determine if a document is required based on user profile
  const isDocumentRequired = (docType: any) => {
    if (docType.required === true) return true
    if (docType.required === 'conditional') {
      // Marriage certificate is required only for married students
      return userProfile?.civilStatus?.toLowerCase() === 'married'
    }
    return false
  }

  // Get required documents count based on user profile
  const getRequiredDocumentsCount = () => {
    return REQUIRED_DOCUMENTS.filter((docType) => isDocumentRequired(docType))
      .length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-blue-100 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="h-6 bg-gray-200 rounded-xl w-64 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-xl w-96 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-xl w-48 animate-pulse"></div>
          </div>
        </div>

        {/* Documents Grid Skeleton */}
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex-[1_1_min(100%,_360px)] max-w-full flex"
            >
              <div className="border border-gray-200 border-dashed rounded-xl p-6 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse h-full w-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-300 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded-lg w-full"></div>
                    <div className="h-4 bg-gray-300 rounded-lg w-2/3"></div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="h-7 bg-gray-300 rounded-lg w-24"></div>
                  <div className="flex gap-2 mt-auto">
                    <div className="h-9 bg-gray-300 rounded-lg flex-1"></div>
                    <div className="h-9 bg-gray-300 rounded-lg flex-1"></div>
                    <div className="h-9 bg-gray-300 rounded-lg flex-1"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-blue-100 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
              <FileText size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h2
                className="text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Document Management
              </h2>
              <p
                className="text-sm text-gray-600 mt-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Upload and manage your academic documents. These documents will
                be available for all your enrollments.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white bg-gradient-to-br from-blue-800 to-blue-900 px-4 py-2 rounded-xl shadow-md">
            <Check size={16} />
            <span style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
              {documents.length} of {getRequiredDocumentsCount()} required
              uploaded
            </span>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="flex flex-wrap gap-4 sm:gap-6">
        {REQUIRED_DOCUMENTS.filter((docType) =>
          isDocumentRequired(docType)
        ).map((docType, index) => {
          const existingDoc = getDocumentStatus(docType.key)
          const hasDoc = Boolean(existingDoc)
          const IconComponent = docType.icon
          return (
            <div
              key={docType.key}
              className="flex-[1_1_min(100%,_360px)] max-w-full flex"
            >
              <Card
                className={`group flex flex-col h-full w-full p-6 border-none rounded-xl text-white transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-[1.02] ${getCardGradient(
                  hasDoc
                )}`}
                style={{
                  animationDelay: `${index * 75}ms`,
                  animationFillMode: 'both',
                  boxShadow: `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px ${getCardShadow(
                    hasDoc
                  )}33`,
                }}
                onMouseEnter={(e) => {
                  const shadowColor = getCardShadow(hasDoc)
                  e.currentTarget.style.boxShadow = `0 25px 50px -12px ${shadowColor}70, 0 0 0 1px ${shadowColor}45`
                }}
                onMouseLeave={(e) => {
                  const shadowColor = getCardShadow(hasDoc)
                  e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px ${shadowColor}33`
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <IconComponent
                      size={32}
                      className="text-blue-900"
                      weight="fill"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-medium text-white leading-tight"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {docType.name}
                      {isDocumentRequired(docType) && (
                        <span className="text-white ml-1">*</span>
                      )}
                    </h3>
                    <p
                      className="text-sm text-white/80 mt-2 leading-relaxed"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {docType.description}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col space-y-4">
                  {hasDoc ? (
                    <div className="flex items-center gap-2 text-xs bg-white text-blue-900 w-fit px-3 py-1.5 rounded-lg shadow-sm">
                      <Check size={12} className="text-blue-900" />
                      <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        Uploaded
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-white bg-white/20 px-3 py-1.5 w-fit rounded-lg border border-white/30">
                      <Warning size={12} />
                      <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        Not uploaded
                      </span>
                    </div>
                  )}

                  {hasDoc ? (
                    <>
                      <p className="text-xs text-white/80">
                        Uploaded:{' '}
                        <span className="font-semibold">
                          {existingDoc?.uploadDate
                            ? new Date(
                                existingDoc.uploadDate
                              ).toLocaleDateString()
                            : 'Unknown'}
                        </span>{' '}
                        •{' '}
                        <span>
                          {formatFileSize(existingDoc?.fileSize || 0)}
                        </span>
                      </p>
                      <div className="mt-auto flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!existingDoc) return
                            handlePreview(existingDoc)
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 transition-all duration-200 rounded-lg shadow-sm"
                          aria-label={`Preview ${docType.name}`}
                        >
                          <Eye size={14} className="text-blue-900" />
                          <span
                            className="text-xs"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Preview
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!existingDoc) return
                            handleDownload(existingDoc)
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 transition-all duration-200 rounded-lg shadow-sm"
                          aria-label={`Download ${docType.name}`}
                        >
                          <Download size={14} className="text-blue-900" />
                          <span
                            className="text-xs"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Download
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (existingDoc) {
                              setDocumentToDelete(existingDoc)
                              setDeleteModalOpen(true)
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 transition-all duration-200 rounded-lg shadow-sm"
                          aria-label={`Delete ${docType.name}`}
                        >
                          <Trash size={14} className="text-blue-900" />
                          <span
                            className="text-xs"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Delete
                          </span>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-auto space-y-2">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (
                            file &&
                            !filePreviewModalOpen &&
                            !isProcessingFile
                          ) {
                            setIsProcessingFile(true)
                            setSelectedFile(file)
                            setSelectedDocumentKey(docType.key)
                            setFilePreviewModalOpen(true)
                            setUploadingDocKey(null)
                            setUploadProgress(0)
                          }
                        }}
                        className="hidden"
                        id={`file-${docType.key}`}
                        disabled={
                          uploadingDocKey === docType.key ||
                          filePreviewModalOpen ||
                          isProcessingFile
                        }
                      />
                      <div className="flex gap-2">
                        <label
                          htmlFor={`file-${docType.key}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`Choose file for ${docType.name}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              const fileInput = document.getElementById(
                                `file-${docType.key}`
                              ) as HTMLInputElement
                              if (fileInput) fileInput.click()
                            }
                          }}
                          className={`inline-flex items-center justify-center px-4 py-2 text-xs text-white/90 hover:text-white hover:bg-white/30 rounded-lg transition-all duration-200 flex-1 ${
                            uploadingDocKey === docType.key ||
                            filePreviewModalOpen ||
                            isProcessingFile
                              ? 'opacity-60 cursor-not-allowed bg-white/20'
                              : 'cursor-pointer bg-white/20 hover:scale-105 active:scale-95'
                          }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {uploadingDocKey === docType.key ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              {Math.round(uploadProgress)}%
                            </>
                          ) : (
                            <>
                              <Upload size={16} className="mr-2" />
                              Choose File
                            </>
                          )}
                        </label>
                        <Button
                          size="sm"
                          onClick={() => {
                            setCameraDocumentKey(docType.key)
                            setCameraOpen(true)
                          }}
                          className="text-white/90 hover:text-white hover:bg-white/30 px-4 py-2 text-xs bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
                          disabled={
                            uploadingDocKey === docType.key ||
                            filePreviewModalOpen ||
                            isProcessingFile
                          }
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <Camera size={14} className="mr-2" />
                          Take Photo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <Modal
          isOpen={cameraOpen}
          onClose={() => {
            setCameraOpen(false)
            setCameraDocumentKey(null)
          }}
          title="Take Photo"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <Camera size={32} className="text-blue-600" weight="bold" />
            </div>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Camera functionality will be implemented here. For now, please use
              the "Choose File" button to upload your document.
            </p>
            <Button
              onClick={() => {
                setCameraOpen(false)
                setCameraDocumentKey(null)
              }}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDocumentToDelete(null)
        }}
        title="Delete Document"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash size={24} className="text-red-600" />
            </div>
            <div>
              <h3
                className="text-lg font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Confirm Deletion
              </h3>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Are you sure you want to delete this document? This action
                cannot be undone.
              </p>
            </div>
          </div>

          {documentToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>File:</strong> {documentToDelete.fileName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Uploaded:</strong>{' '}
                {new Date(documentToDelete.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setDeleteModalOpen(false)
                setDocumentToDelete(null)
              }}
              variant="outline"
              className="flex-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDocument}
              className="flex-1 bg-red-600 hover:bg-red-700"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Delete Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false)
          setPreviewDocument(null)
        }}
        title="Document Preview"
        size="2xl"
      >
        {previewDocument && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="space-y-2">
                <h3
                  className="text-lg font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {previewDocument.name}
                </h3>
                <p className="text-sm text-gray-600 font-mono">
                  {previewDocument.fileName} •{' '}
                  {formatFileSize(previewDocument.fileSize)}
                </p>
              </div>
              <Button
                onClick={() => handleDownload(previewDocument)}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                <Download size={16} className="mr-2" />
                Download
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {previewDocument.fileUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={`https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
                    previewDocument.fileUrl
                  )}`}
                  className="w-full h-[600px]"
                  title="Document Preview"
                  frameBorder="0"
                  scrolling="no"
                />
              ) : (
                <img
                  src={previewDocument.fileUrl}
                  alt="Document Preview"
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* File Preview Modal */}
      <Modal
        isOpen={filePreviewModalOpen}
        onClose={handleCancelPreview}
        title="Document Preview & Upload"
        size="2xl"
      >
        {selectedFile && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Document Preview */}
              <div className="space-y-2">
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-[500px] flex items-center justify-center">
                  {selectedFile.type === 'application/pdf' ? (
                    <div className="w-full h-full relative bg-white">
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `
                          /* Hide PDF toolbar elements */
                          iframe ~ div,
                          iframe + div,
                          iframe ~ [role="toolbar"],
                          iframe + [role="toolbar"],
                          iframe ~ .toolbar,
                          iframe + .toolbar,
                          iframe ~ [class*="toolbar"],
                          iframe + [class*="toolbar"] {
                            display: none !important;
                            visibility: hidden !important;
                            height: 0 !important;
                            width: 0 !important;
                            overflow: hidden !important;
                            position: absolute !important;
                            left: -9999px !important;
                            top: -9999px !important;
                          }

                          /* Hide any floating controls */
                          iframe ~ button,
                          iframe + button,
                          iframe ~ input,
                          iframe + input {
                            display: none !important;
                          }
                        `,
                        }}
                      />
                      <iframe
                        src={URL.createObjectURL(selectedFile)}
                        className="w-full h-full"
                        title="Document Preview"
                        style={{
                          border: 'none',
                          margin: 0,
                          padding: 0,
                          minHeight: '70vh',
                        }}
                      />
                    </div>
                  ) : (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Document Preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleCancelPreview}
                  variant="outline"
                  className="flex-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadFromPreview}
                  className="flex-1 bg-blue-900 hover:bg-blue-900 text-white"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Upload size={16} className="mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
