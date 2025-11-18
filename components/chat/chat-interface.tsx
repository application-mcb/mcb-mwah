'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ChatCircleDots,
  CaretRight,
  PaperPlaneTilt,
  X,
  Paperclip,
} from '@phosphor-icons/react'
import { ContactData, MessageData } from '@/lib/chat-database'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import MessageBubble from './message-bubble'
import FileUpload from './file-upload'
import { toast } from 'react-toastify'

interface ChatInterfaceProps {
  chatId: string
  userId: string
  contact: ContactData
  onBack: () => void
  onToggleCollapse: () => void
}

export default function ChatInterface({
  chatId,
  userId,
  contact,
  onBack,
  onToggleCollapse,
}: ChatInterfaceProps) {
  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-blue-900">Chat not found</p>
      </div>
    )
  }
  const [messages, setMessages] = useState<MessageData[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${chatId}/messages?limit=50`)
        const data = await response.json()

        if (data.success) {
          setMessages(data.messages)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
        toast.error('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    // Set up real-time listener for new messages
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: MessageData[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newMessages.push({
          id: doc.id,
          chatId,
          senderId: data.senderId,
          content: data.content,
          type: data.type || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          readBy: data.readBy || {},
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt,
        } as MessageData)
      })

      // Reverse to get chronological order
      setMessages(newMessages.reverse())

      // Mark new messages as read
      newMessages.forEach((message) => {
        if (message.senderId !== userId && !message.readBy[userId]) {
          markAsRead(message.id)
        }
      })
    })

    return () => unsubscribe()
  }, [chatId, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/chat/${chatId}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !sending) return

    const content = inputValue.trim()
    setInputValue('')
    setSending(true)

    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: userId,
          content,
          type: 'text',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to send message')
        setInputValue(content) // Restore input on error
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      setInputValue(content) // Restore input on error
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleFileUploadComplete = async (fileData: {
    fileUrl: string
    fileName: string
    fileSize: number
    fileType: string
  }) => {
    setShowFileUpload(false)
    setSending(true)

    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: userId,
          content: fileData.fileName,
          type: fileData.fileType === 'image' ? 'image' : 'file',
          fileData: {
            fileUrl: fileData.fileUrl,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
          },
        }),
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to send file')
      }
    } catch (error) {
      console.error('Error sending file:', error)
      toast.error('Failed to send file')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900 text-white flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white transition-all duration-200 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white flex-shrink-0"
            aria-label="Back to contacts"
            tabIndex={0}
          >
            <X
              size={16}
              className="sm:w-[18px] sm:h-[18px] text-blue-800"
              weight="bold"
            />
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {contact.photoURL ? (
              <img
                src={contact.photoURL}
                alt={contact.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-medium">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h2
              className="text-xs sm:text-sm font-medium truncate text-white"
              style={{ fontFamily: 'monospace', fontWeight: 500 }}
            >
              {contact.name}
            </h2>
            <p
              className="text-[10px] sm:text-xs opacity-90 truncate text-white"
              style={{ fontFamily: 'monospace', fontWeight: 300 }}
            >
              {contact.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white transition-all duration-200 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white flex-shrink-0"
          aria-label="Collapse chat panel"
          tabIndex={0}
        >
          <CaretRight
            size={16}
            className="sm:w-[18px] sm:h-[18px] text-blue-800"
            weight="bold"
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={`flex items-end gap-2 ${
                  index % 2 === 0 ? 'justify-end' : 'justify-start'
                }`}
              >
                {index % 2 !== 0 && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 animate-pulse flex-shrink-0"></div>
                )}
                <div
                  className={`flex flex-col max-w-[75%] ${
                    index % 2 === 0 ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-xl px-4 py-2 animate-pulse ${
                      index % 2 === 0
                        ? 'bg-blue-100'
                        : 'bg-blue-50 border border-blue-100'
                    }`}
                  >
                    <div className="h-4 bg-blue-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-blue-200 rounded w-24"></div>
                  </div>
                  <div className="h-2 bg-blue-50 rounded w-16 mt-1 animate-pulse"></div>
                </div>
                {index % 2 === 0 && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 animate-pulse flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ChatCircleDots
                size={32}
                className="text-white"
                weight="duotone"
              />
            </div>
            <p
              className="text-sm text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === userId}
              contactName={
                message.senderId === userId ? undefined : contact.name
              }
              contactPhotoURL={
                message.senderId === userId ? undefined : contact.photoURL
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showFileUpload && (
        <FileUpload
          chatId={chatId}
          onComplete={handleFileUploadComplete}
          onCancel={() => setShowFileUpload(false)}
        />
      )}

      <div className="px-4 py-3 border-t border-blue-100 bg-white/80 flex-shrink-0">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowFileUpload(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-900 flex-shrink-0"
            aria-label="Attach file"
            tabIndex={0}
          >
            <Paperclip size={20} weight="fill" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
            style={{ fontFamily: 'monospace', fontWeight: 300 }}
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !sending) || sending}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send message"
            tabIndex={0}
          >
            <PaperPlaneTilt size={20} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  )
}
