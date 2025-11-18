'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'
import { PaperPlaneTilt, Robot } from '@phosphor-icons/react'
import {
  ExtendedEnrollmentData,
  StudentProfile,
  StudentDocuments,
  SubjectSetData,
  SubjectAssignmentData,
  CourseData,
  GradeData,
} from './types'
import { SubjectData } from '@/lib/subject-database'
import { buildStudentContext } from './utils/buildStudentContext'
import AIMessageFormatter from './AIMessageFormatter'

interface AIChatModalProps {
  isOpen: boolean
  onClose: () => void
  enrollment: ExtendedEnrollmentData | null
  studentProfile: StudentProfile | null
  studentDocuments: StudentDocuments | null
  subjects: Record<string, SubjectData>
  subjectSets: Record<number, SubjectSetData[]>
  subjectAssignments: SubjectAssignmentData[]
  grades: Record<string, GradeData>
  courses: CourseData[]
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isTyping?: boolean
  transcript?: any
}

const QUICK_CHAT_TEMPLATES = [
  "May I see this student's transcript?",
  "May I know the student's guardian?",
  'Please give me information about this student',
  'What subjects is this student enrolled in?',
  "What is this student's enrollment status?",
  'Are there any missing documents for this student?',
]

export default function AIChatModal({
  isOpen,
  onClose,
  enrollment,
  studentProfile,
  studentDocuments,
  subjects,
  subjectSets,
  subjectAssignments,
  grades,
  courses,
}: AIChatModalProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [displayedContent, setDisplayedContent] = useState<
    Record<string, string>
  >({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayedContent])

  // Fast typewriter effect using requestAnimationFrame with chunking
  useEffect(() => {
    const aiMessages = messages.filter(
      (msg) =>
        msg.type === 'ai' &&
        msg.content &&
        displayedContent[msg.id] !== msg.content
    )

    const animationFrames: Map<string, number> = new Map()

    aiMessages.forEach((msg) => {
      const currentDisplayed = displayedContent[msg.id] || ''
      if (currentDisplayed.length < msg.content.length) {
        setTypingMessageId(msg.id)
        let currentIndex = currentDisplayed.length
        const fullText = msg.content
        const charsPerFrame = 10 // Show 10 characters per frame for speed

        const animate = () => {
          if (currentIndex < fullText.length) {
            const nextIndex = Math.min(
              currentIndex + charsPerFrame,
              fullText.length
            )
            setDisplayedContent((prev) => ({
              ...prev,
              [msg.id]: fullText.substring(0, nextIndex),
            }))
            currentIndex = nextIndex
            const frameId = requestAnimationFrame(animate)
            animationFrames.set(msg.id, frameId)
          } else {
            setTypingMessageId((prev) => (prev === msg.id ? null : prev))
            animationFrames.delete(msg.id)
          }
        }

        // Start immediately
        const frameId = requestAnimationFrame(animate)
        animationFrames.set(msg.id, frameId)
      }
    })

    return () => {
      // Cancel all animation frames
      animationFrames.forEach((frameId) => {
        cancelAnimationFrame(frameId)
      })
      animationFrames.clear()
    }
  }, [messages, displayedContent])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Reset messages when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([])
      setMessage('')
      setDisplayedContent({})
      setTypingMessageId(null)
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current)
      }
    }
  }, [isOpen])

  const handleQuickChat = (template: string) => {
    setMessage(template)
    // Auto-focus input after setting message
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || loading || !enrollment) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage('')
    setLoading(true)

    try {
      // Build student context
      const studentContext = buildStudentContext(
        enrollment,
        studentProfile,
        studentDocuments,
        subjects,
        subjectSets,
        subjectAssignments,
        grades,
        courses
      )

      if (!studentContext) {
        throw new Error('Failed to build student context')
      }

      // Get last AI message for context (to handle follow-up responses)
      const lastAIMessage =
        messages.filter((msg) => msg.type === 'ai').slice(-1)[0]?.content ||
        null

      // Call chatbot API
      const response = await fetch('/api/ai/student-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          studentContext,
          userId: enrollment.userId,
          lastAIMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to get chatbot response'
        const details = data.details ? `: ${data.details}` : ''
        throw new Error(`${errorMsg}${details}`)
      }

      if (!data.response) {
        throw new Error(data.error || 'No response from chatbot')
      }

      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        isTyping: true,
        transcript: data.transcript || null,
      }

      setMessages((prev) => [...prev, aiMessage])
      // Initialize displayed content as empty for typewriter effect
      setDisplayedContent((prev) => ({ ...prev, [aiMessageId]: '' }))
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to get AI response. Please try again.',
        {
          autoClose: 4000,
        }
      )

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!enrollment) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Assistant"
      size="xl"
    >
      <div className="flex flex-col h-[600px] relative">

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white pb-24">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <h3
                  className="text-xl font-semibold text-gray-900 mb-2"
                  style={{ fontFamily: 'Poppins' }}
                >
                  Ask me anything about this student
                </h3>
                <p
                  className="text-sm text-gray-600 max-w-md mb-6"
                  style={{ fontFamily: 'Poppins' }}
                >
                  I can help you find information about transcripts, guardian details, subjects, enrollment status, documents, and more. You can ask in English or Filipino.
                </p>

                {/* Quick Chat Templates */}
                <div className="w-full max-w-2xl">
                  <p
                    className="text-xs text-gray-500 mb-3 font-medium"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    Quick questions:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_CHAT_TEMPLATES.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickChat(template)}
                        className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* AI Avatar */}
                    {msg.type === 'ai' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-sm">
                        <Robot size={16} weight="fill" className="text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                      style={{
                        opacity:
                          msg.type === 'ai' && typingMessageId === msg.id
                            ? 0.8
                            : 1,
                        transition: 'opacity 0.2s ease-in-out',
                      }}
                    >
                      {msg.type === 'ai' ? (
                        <AIMessageFormatter
                          content={displayedContent[msg.id] || ''}
                          transcript={msg.transcript || null}
                          subjects={
                            enrollment && subjects
                              ? Object.values(subjects)
                                  .filter((subject) => {
                                    // Get assigned subjects for this enrollment
                                    const enrollmentInfo =
                                      enrollment.enrollmentInfo
                                    if (!enrollmentInfo) return false

                                    if (enrollmentInfo.level === 'college') {
                                      const assignment =
                                        subjectAssignments.find(
                                          (a) =>
                                            a.level === 'college' &&
                                            a.courseCode ===
                                              enrollmentInfo.courseCode &&
                                            a.yearLevel ===
                                              parseInt(
                                                enrollmentInfo.yearLevel || '1'
                                              ) &&
                                            a.semester ===
                                              enrollmentInfo.semester
                                        )
                                      if (assignment) {
                                        const subjectSet = Object.values(
                                          subjectSets
                                        )
                                          .flat()
                                          .find(
                                            (set) =>
                                              set.id === assignment.subjectSetId
                                          )
                                        return (
                                          subjectSet?.subjects.includes(
                                            subject.id
                                          ) || false
                                        )
                                      }
                                    } else {
                                      const gradeLevel =
                                        enrollmentInfo.gradeLevel
                                      if (gradeLevel) {
                                        const assignment =
                                          subjectAssignments.find(
                                            (a) =>
                                              a.level === 'high-school' &&
                                              a.gradeLevel ===
                                                parseInt(gradeLevel)
                                          )
                                        if (assignment) {
                                          const subjectSet = Object.values(
                                            subjectSets
                                          )
                                            .flat()
                                            .find(
                                              (set) =>
                                                set.id ===
                                                assignment.subjectSetId
                                            )
                                          return (
                                            subjectSet?.subjects.includes(
                                              subject.id
                                            ) || false
                                          )
                                        }
                                      }
                                    }
                                    return false
                                  })
                                  .map((subject) => ({
                                    id: subject.id,
                                    code: subject.code || '',
                                    name: subject.name || '',
                                    description: subject.description,
                                    lectureUnits: subject.lectureUnits || 0,
                                    labUnits: subject.labUnits || 0,
                                    totalUnits:
                                      (subject.lectureUnits || 0) +
                                      (subject.labUnits || 0),
                                  }))
                              : []
                          }
                        />
                      ) : (
                        <div
                          className="text-sm whitespace-pre-wrap"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {msg.content}
                        </div>
                      )}

                      <div
                        className={`text-xs mt-3 ${
                          msg.type === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-400'
                        }`}
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {msg.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {msg.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-semibold">
                          {enrollment?.personalInfo?.firstName?.[0]?.toUpperCase() ||
                            'U'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            {loading && (
              <div className="flex justify-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-sm">
                  <Robot size={16} weight="fill" className="text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-md animate-spin"></div>
                    <span
                      className="text-sm text-gray-500"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white z-10 pb-10 ">
            {/* Quick templates when no messages */}
            {messages.length === 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_CHAT_TEMPLATES.slice(0, 3).map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickChat(template)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    {template}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about this student..."
                disabled={loading}
                className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading}
                className="rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white shadow-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-md animate-spin"></div>
                ) : (
                  <PaperPlaneTilt size={16} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
  )
}
