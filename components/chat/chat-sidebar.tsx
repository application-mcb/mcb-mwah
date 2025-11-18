'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ChatCircleDots,
  CaretRight,
  PaperPlaneTilt,
  X,
} from '@phosphor-icons/react'
import { ContactData } from '@/lib/chat-database'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import ChatInterface from './chat-interface'
import { toast } from 'react-toastify'

interface ChatSidebarProps {
  userId: string
  userRole: 'student' | 'registrar'
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function ChatSidebar({
  userId,
  userRole,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
}: ChatSidebarProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  const isCollapsed =
    externalIsCollapsed !== undefined
      ? externalIsCollapsed
      : internalIsCollapsed
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(
    null
  )
  const [previousContacts, setPreviousContacts] = useState<ContactData[]>([])
  const contactsRef = useRef<ContactData[]>([])

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/chat/contacts?userId=${userId}&role=${userRole}`
        )
        const data = await response.json()

        if (data.success) {
          setPreviousContacts([...contactsRef.current])
          contactsRef.current = data.contacts
          setContacts(data.contacts)
        }
      } catch (error) {
        console.error('Error fetching contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()

    // Set up real-time listener for chats
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(userRole === 'registrar' ? 5 : 100)
    )

    const unsubscribe = onSnapshot(chatsQuery, async () => {
      await fetchContacts()
    })

    return () => unsubscribe()
  }, [userId, userRole])

  const handleToggleCollapse = () => {
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse()
    } else {
      setInternalIsCollapsed((prev) => !prev)
    }
  }

  const handleContactClick = async (contact: ContactData) => {
    // If chat doesn't exist, create it
    if (!contact.chatId) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: userRole === 'student' ? userId : contact.uid,
            registrarId: userRole === 'registrar' ? userId : contact.uid,
          }),
        })

        const data = await response.json()

        if (data.success && data.chatId) {
          setSelectedContact({
            ...contact,
            chatId: data.chatId,
          })
        } else {
          toast.error(data.error || 'Failed to create chat')
        }
      } catch (error) {
        console.error('Error creating chat:', error)
        toast.error('Failed to create chat')
      }
    } else {
      setSelectedContact(contact)
    }
  }

  const handleBackToContacts = () => {
    setSelectedContact(null)
  }

  if (isCollapsed) {
    return (
      <aside className="w-16 sm:w-20 bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed right-16 sm:right-20 top-0 z-20 border-l border-blue-100 overflow-hidden">
        <div className="px-2 sm:px-3 py-3 sm:py-4 border-b border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900 text-white flex flex-col items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Expand chat panel"
          >
            <ChatCircleDots size={18} className="sm:w-5 sm:h-5" weight="fill" />
          </button>
        </div>
      </aside>
    )
  }

  if (selectedContact) {
    return (
      <aside className="w-full sm:w-80 md:w-96 bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed right-16 sm:right-20 md:right-80 lg:right-96 top-0 z-20 border-l border-blue-100">
        <ChatInterface
          chatId={selectedContact.chatId!}
          userId={userId}
          contact={selectedContact}
          onBack={handleBackToContacts}
          onToggleCollapse={handleToggleCollapse}
        />
      </aside>
    )
  }

  return (
    <aside className="w-full sm:w-80 md:w-96 bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed right-16 sm:right-20 md:right-80 lg:right-96 top-0 z-20 border-l border-blue-100">
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl flex-shrink-0">
            <ChatCircleDots size={18} className="sm:w-5 sm:h-5" weight="fill" />
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-white/40 text-white transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white flex-shrink-0"
          aria-label="Collapse chat panel"
          tabIndex={0}
        >
          <CaretRight
            size={16}
            className="sm:w-[18px] sm:h-[18px]"
            weight="bold"
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900"></div>
          </div>
        ) : contacts.length === 0 ? (
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
              {userRole === 'student'
                ? 'No registrars available'
                : 'No enrolled students'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, index) => {
              const isNew =
                userRole === 'registrar' &&
                previousContacts.length > 0 &&
                !previousContacts.find((c) => c.uid === contact.uid)
              const animationDelay = isNew ? 0 : index * 50

              return (
                <div
                  key={contact.uid}
                  className={`bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${
                    isNew ? 'animate-slide-up' : ''
                  }`}
                  style={{
                    animationDelay: `${animationDelay}ms`,
                    fontFamily: 'Poppins',
                  }}
                  onClick={() => handleContactClick(contact)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleContactClick(contact)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Chat with ${contact.name}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center flex-shrink-0">
                      {contact.photoURL ? (
                        <img
                          src={contact.photoURL}
                          alt={contact.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-white text-lg font-medium">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3
                          className="text-sm font-medium text-blue-900 truncate"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {contact.name}
                        </h3>
                        {contact.unreadCount > 0 && (
                          <span className="bg-blue-900 text-white text-xs font-medium px-2 py-0.5 rounded-lg flex-shrink-0">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      {contact.lastMessage && (
                        <p
                          className="text-xs text-blue-900/70 truncate mb-1"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {contact.lastMessage}
                        </p>
                      )}
                      {contact.lastMessageAt && (
                        <p
                          className="text-[10px] text-blue-900/50"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {new Date(contact.lastMessageAt).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </aside>
  )
}
