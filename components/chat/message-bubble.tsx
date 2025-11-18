'use client'

import { MessageData } from '@/lib/chat-database'
import { Check, Checks, Download, File, Image } from '@phosphor-icons/react'

interface MessageBubbleProps {
  message: MessageData
  isOwn: boolean
  contactName?: string
  contactPhotoURL?: string
}

export default function MessageBubble({ message, isOwn, contactName, contactPhotoURL }: MessageBubbleProps) {
  const isRead = message.readBy && Object.keys(message.readBy).length > 0
  const isImage = message.type === 'image'
  const isFile = message.type === 'file'

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      className={`flex items-start gap-2 ${
        isOwn ? 'justify-end' : 'justify-start'
      }`}
      style={{ fontFamily: 'Poppins' }}
    >
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {contactPhotoURL ? (
            <img
              src={contactPhotoURL}
              alt={contactName || 'Contact'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-xs font-medium">
              {contactName ? contactName.charAt(0).toUpperCase() : 'U'}
            </span>
          )}
        </div>
      )}

      <div
        className={`flex flex-col max-w-[75%] ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`rounded-xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white'
              : 'bg-white text-blue-900 border border-blue-100'
          }`}
        >
          {isImage && message.fileUrl ? (
            <div className="mb-2">
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Image'}
                className="max-w-full h-auto rounded-lg max-h-64 object-contain"
              />
            </div>
          ) : isFile && message.fileUrl ? (
            <div className="flex items-center gap-3 mb-2 p-3 bg-white/10 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <File size={20} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {message.fileName}
                </p>
                {message.fileSize && (
                  <p
                    className="text-xs opacity-80"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {formatFileSize(message.fileSize)}
                  </p>
                )}
              </div>
              <a
                href={message.fileUrl}
                download={message.fileName}
                className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
                aria-label="Download file"
              >
                <Download size={16} weight="fill" />
              </a>
            </div>
          ) : null}

          <p
            className={`text-sm leading-relaxed ${
              isImage || isFile ? 'mt-2' : ''
            }`}
            style={{ fontFamily: 'monospace', fontWeight: 300, color: isOwn ? 'white' : 'black' }}
          >
            {message.content}
          </p>
        </div>

        <div
          className={`flex items-center gap-1 mt-1 ${
            isOwn ? 'flex-row-reverse' : ''
          }`}
        >
          <span
            className="text-[10px] text-black"
            style={{ fontFamily: 'monospace', fontWeight: 300 }}
          >
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <div className="flex items-center">
              {isRead ? (
                <Checks size={12} className="text-blue-900" weight="fill" />
              ) : (
                <Check size={12} className="text-blue-900/60" weight="fill" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
