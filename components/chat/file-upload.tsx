'use client'

import { useState, useRef } from 'react'
import { X, Upload, Image, File, CheckCircle, Warning } from '@phosphor-icons/react'
import { toast } from 'react-toastify'

interface FileUploadProps {
  chatId: string
  onComplete: (fileData: {
    fileUrl: string
    fileName: string
    fileSize: number
    fileType: string
  }) => void
  onCancel: () => void
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function FileUpload({ chatId, onComplete, onCancel }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('File type not allowed. Only images, PDFs, and documents are allowed.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 5MB limit')
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)

    try {
      // Generate a temporary message ID for the file path
      const messageId = `temp_${Date.now()}`

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('chatId', chatId)
      formData.append('messageId', messageId)

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to upload file')
        setUploading(false)
        return
      }

      const fileType = ALLOWED_IMAGE_TYPES.includes(selectedFile.type) ? 'image' : 'file'

      onComplete({
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType,
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="absolute bottom-full left-0 right-0 bg-white border-t border-blue-100 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-medium text-blue-900"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          Upload File
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-900 hover:bg-blue-50 transition-colors"
          aria-label="Close"
          tabIndex={0}
        >
          <X size={18} weight="bold" />
        </button>
      </div>

      {!selectedFile ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload-input"
          />
          <label
            htmlFor="file-upload-input"
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
            style={{ fontFamily: 'Poppins' }}
          >
            <Upload size={32} className="text-blue-900 mb-2" weight="duotone" />
            <p
              className="text-sm text-blue-900 mb-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Click to select a file
            </p>
            <p
              className="text-xs text-blue-900/60"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Images, PDFs, and documents up to 5MB
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-contain rounded-lg border border-blue-100"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-50 transition-colors"
                aria-label="Remove"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-12 h-12 rounded-lg bg-blue-900 flex items-center justify-center flex-shrink-0">
                <File size={24} className="text-white" weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-blue-900 truncate"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {selectedFile.name}
                </p>
                <p
                  className="text-xs text-blue-900/60"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-900 hover:bg-blue-100 transition-colors"
                aria-label="Remove"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div
                  className="bg-blue-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p
                className="text-xs text-blue-900/60 text-center"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Uploading...
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-blue-200 text-blue-900 hover:bg-blue-50 transition-colors text-sm"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

