// Server-side only - Firestore database operations for chat
// This file should only be imported in API routes or server-side code

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  addDoc,
} from 'firebase/firestore'
import { db } from './firebase-server'
import { EnrollmentDatabase, EnrollmentData } from './enrollment-database'
import { RegistrarDatabase } from './registrar-database'
import { GradeDatabase } from './grade-section-database'
import { CourseDatabase } from './course-database'

// Utility function to serialize Firestore data for client components
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString()
  }

  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData)
  }

  if (typeof data === 'object') {
    const serialized: any = {}
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value)
    }
    return serialized
  }

  return data
}

export interface ChatData {
  id: string
  participants: string[] // Array of UIDs [studentId, registrarId]
  lastMessage?: string
  lastMessageAt?: string // ISO string
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

export interface MessageData {
  id: string
  chatId: string
  senderId: string
  content: string
  type: 'text' | 'file' | 'image'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  readBy: { [uid: string]: string } // { [uid]: ISO timestamp }
  createdAt: string // ISO string
}

export interface ContactData {
  uid: string
  name: string
  email: string
  photoURL?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  chatId?: string
  // Enrollment info
  gradeLevel?: number
  courseCode?: string
  courseName?: string
  strand?: string
  color?: string
  department?: string
}

export class ChatDatabase {
  private static chatsCollection = 'chats'
  private static messagesCollection = 'messages'

  // Check if student is enrolled in current semester
  static async checkEnrollmentStatus(studentId: string): Promise<boolean> {
    try {
      const systemConfig = await EnrollmentDatabase.getSystemConfig()
      const ayCode = systemConfig.ayCode
      const semester = systemConfig.semester

      if (!ayCode) {
        return false
      }

      // For college and SHS, check by semester
      if (semester) {
        const semesterFormat =
          semester === '1'
            ? 'first-sem'
            : semester === '2'
            ? 'second-sem'
            : null

        if (semesterFormat) {
          const enrollment = await EnrollmentDatabase.getEnrollment(
            studentId,
            ayCode,
            semesterFormat
          )

          if (enrollment.success && enrollment.data) {
            const eData: any = enrollment.data
            return (
              eData.enrollmentInfo?.status === 'enrolled' &&
              eData.enrollmentInfo?.schoolYear === ayCode &&
              eData.enrollmentInfo?.semester === semesterFormat
            )
          }
        }
      }

      // For JHS (no semester), check by AY only
      const enrollment = await EnrollmentDatabase.getEnrollment(
        studentId,
        ayCode
      )
      if (enrollment.success && enrollment.data) {
        const eData: any = enrollment.data
        return (
          eData.enrollmentInfo?.status === 'enrolled' &&
          eData.enrollmentInfo?.schoolYear === ayCode &&
          eData.enrollmentInfo?.level === 'high-school' &&
          eData.enrollmentInfo?.department === 'JHS'
        )
      }

      return false
    } catch (error) {
      console.error('Error checking enrollment status:', error)
      return false
    }
  }

  // Create a new chat between student and registrar
  static async createChat(
    studentId: string,
    registrarId: string
  ): Promise<{ success: boolean; chatId?: string; error?: string }> {
    try {
      // Check if chat already exists
      const existingChat = await this.findExistingChat(studentId, registrarId)
      if (existingChat) {
        return {
          success: true,
          chatId: existingChat.id,
        }
      }

      // Create new chat
      const chatRef = doc(collection(db, this.chatsCollection))
      const chatData = {
        participants: [studentId, registrarId].sort(),
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(chatRef, chatData)

      return {
        success: true,
        chatId: chatRef.id,
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create chat',
      }
    }
  }

  // Find existing chat between two users
  static async findExistingChat(
    userId1: string,
    userId2: string
  ): Promise<ChatData | null> {
    try {
      const participants = [userId1, userId2].sort()
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', '==', participants)
      )

      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data()
        return {
          id: doc.id,
          ...serializeFirestoreData(data),
        } as ChatData
      }

      return null
    } catch (error) {
      console.error('Error finding existing chat:', error)
      return null
    }
  }

  // Get chat by ID
  static async getChat(chatId: string): Promise<ChatData | null> {
    try {
      const chatRef = doc(db, this.chatsCollection, chatId)
      const chatSnap = await getDoc(chatRef)

      if (chatSnap.exists()) {
        const data = chatSnap.data()
        return {
          id: chatSnap.id,
          ...serializeFirestoreData(data),
        } as ChatData
      }

      return null
    } catch (error) {
      console.error('Error getting chat:', error)
      return null
    }
  }

  // Get all chats for a user
  static async getUserChats(userId: string): Promise<ChatData[]> {
    try {
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const chats: ChatData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        chats.push({
          id: doc.id,
          ...serializeFirestoreData(data),
        } as ChatData)
      })

      return chats
    } catch (error) {
      console.error('Error getting user chats:', error)
      return []
    }
  }

  // Send a message
  static async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: 'text' | 'file' | 'image' = 'text',
    fileData?: {
      fileUrl: string
      fileName: string
      fileSize: number
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Verify chat exists and user is participant
      const chat = await this.getChat(chatId)
      if (!chat) {
        return {
          success: false,
          error: 'Chat not found',
        }
      }

      if (!chat.participants.includes(senderId)) {
        return {
          success: false,
          error: 'User is not a participant in this chat',
        }
      }

      // Create message
      const messageRef = doc(
        collection(db, this.chatsCollection, chatId, this.messagesCollection)
      )
      const messageData: any = {
        chatId,
        senderId,
        content,
        type,
        readBy: {},
        createdAt: serverTimestamp(),
      }

      if (fileData) {
        messageData.fileUrl = fileData.fileUrl
        messageData.fileName = fileData.fileName
        messageData.fileSize = fileData.fileSize
      }

      await setDoc(messageRef, messageData)

      // Update chat's last message
      await updateDoc(doc(db, this.chatsCollection, chatId), {
        lastMessage: content,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return {
        success: true,
        messageId: messageRef.id,
      }
    } catch (error) {
      console.error('Error sending message:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to send message',
      }
    }
  }

  // Get messages for a chat
  static async getChatMessages(
    chatId: string,
    messageLimit: number = 50
  ): Promise<MessageData[]> {
    try {
      const q = query(
        collection(db, this.chatsCollection, chatId, this.messagesCollection),
        orderBy('createdAt', 'desc'),
        limit(messageLimit)
      )

      const querySnapshot = await getDocs(q)
      const messages: MessageData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        messages.push({
          id: doc.id,
          ...serializeFirestoreData(data),
        } as MessageData)
      })

      // Reverse to get chronological order
      return messages.reverse()
    } catch (error) {
      console.error('Error getting chat messages:', error)
      return []
    }
  }

  // Mark message as read
  static async markAsRead(
    chatId: string,
    messageId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const messageRef = doc(
        db,
        this.chatsCollection,
        chatId,
        this.messagesCollection,
        messageId
      )
      const messageSnap = await getDoc(messageRef)

      if (!messageSnap.exists()) {
        return {
          success: false,
          error: 'Message not found',
        }
      }

      const readBy = messageSnap.data().readBy || {}
      readBy[userId] = serverTimestamp()

      await updateDoc(messageRef, {
        readBy,
      })

      return {
        success: true,
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to mark message as read',
      }
    }
  }

  // Get contacts for a user
  static async getContacts(
    userId: string,
    role: 'student' | 'registrar'
  ): Promise<ContactData[]> {
    try {
      if (role === 'student') {
        // For students: return all registrars
        const registrars = await RegistrarDatabase.getAllRegistrars()
        const contacts: ContactData[] = []

        for (const registrar of registrars) {
          const chat = await this.findExistingChat(userId, registrar.uid)
          const unreadCount = chat
            ? await this.getUnreadCount(chat.id, userId)
            : 0

          contacts.push({
            uid: registrar.uid,
            name: `${registrar.firstName} ${registrar.lastName}`,
            email: registrar.email,
            photoURL: registrar.photoURL,
            lastMessage: chat?.lastMessage,
            lastMessageAt: chat?.lastMessageAt,
            unreadCount,
            chatId: chat?.id,
          })
        }

        // Sort by lastMessageAt (most recent first)
        return contacts.sort((a, b) => {
          if (!a.lastMessageAt && !b.lastMessageAt) return 0
          if (!a.lastMessageAt) return 1
          if (!b.lastMessageAt) return -1
          return (
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
          )
        })
      } else {
        // For registrars: return max 5 most recent enrolled students
        const systemConfig = await EnrollmentDatabase.getSystemConfig()
        const ayCode = systemConfig.ayCode
        const semester = systemConfig.semester

        if (!ayCode) {
          return []
        }

        // Get all enrollments for current semester
        const enrollmentsResult = await EnrollmentDatabase.getAllEnrollments(
          ayCode
        )

        if (!enrollmentsResult.success || !enrollmentsResult.data) {
          return []
        }

        const allEnrollments = enrollmentsResult.data

        // Filter to only enrolled students for current semester
        const enrolledStudentMap = new Map<string, EnrollmentData>()
        for (const enrollment of allEnrollments) {
          // Check if enrollment matches current semester
          const enrollmentInfo = enrollment.enrollmentInfo
          if (!enrollmentInfo || enrollmentInfo.status !== 'enrolled') continue

          // For college/SHS, check semester match
          if (
            semester &&
            (enrollmentInfo.level === 'college' ||
              (enrollmentInfo.level === 'high-school' &&
                enrollmentInfo.department === 'SHS'))
          ) {
            const semesterFormat =
              semester === '1'
                ? 'first-sem'
                : semester === '2'
                ? 'second-sem'
                : null
            if (enrollmentInfo.semester !== semesterFormat) continue
          }

          // For JHS, no semester check needed
          if (
            enrollmentInfo.level === 'high-school' &&
            enrollmentInfo.department === 'JHS'
          ) {
            // JHS doesn't have semester, so include if enrolled
          }

          // Check if school year matches
          if (enrollmentInfo.schoolYear !== ayCode) continue

          // Store the most recent enrollment for each student
          if (!enrolledStudentMap.has(enrollment.userId)) {
            enrolledStudentMap.set(enrollment.userId, enrollment)
          } else {
            const existing = enrolledStudentMap.get(enrollment.userId)!
            const existingDate = new Date(
              existing.updatedAt || existing.submittedAt || 0
            ).getTime()
            const newDate = new Date(
              enrollment.updatedAt || enrollment.submittedAt || 0
            ).getTime()
            if (newDate > existingDate) {
              enrolledStudentMap.set(enrollment.userId, enrollment)
            }
          }
        }

        // Get all chats for registrar to match with students
        const chats = await this.getUserChats(userId)
        const chatMap = new Map<string, ChatData>()
        for (const chat of chats) {
          const studentId = chat.participants.find((p) => p !== userId)
          if (studentId) {
            chatMap.set(studentId, chat)
          }
        }

        const contacts: ContactData[] = []

        // Process all enrolled students
        for (const [studentId, enrollment] of enrolledStudentMap) {
          // Get student info
          const studentResult = await EnrollmentDatabase.getStudent(studentId)
          if (!studentResult.success || !studentResult.data) continue

          const student = studentResult.data
          const chat = chatMap.get(studentId)
          const unreadCount = chat
            ? await this.getUnreadCount(chat.id, userId)
            : 0

          // Get enrollment date for sorting
          const enrollmentDate = enrollment.updatedAt || enrollment.submittedAt

          // Get enrollment info
          const enrollmentInfo = enrollment.enrollmentInfo
          let gradeLevel: number | undefined
          let courseCode: string | undefined
          let courseName: string | undefined
          let strand: string | undefined
          let color: string | undefined
          let department: string | undefined

          if (enrollmentInfo) {
            department = enrollmentInfo.department || enrollmentInfo.level

            // For high school, get grade info
            if (
              enrollmentInfo.level === 'high-school' &&
              enrollmentInfo.gradeLevel
            ) {
              gradeLevel = parseInt(enrollmentInfo.gradeLevel)
              strand = enrollmentInfo.strand

              // Construct gradeId and fetch grade color
              try {
                const dept = enrollmentInfo.department || 'JHS'
                let gradeId: string

                if (dept === 'SHS' && strand) {
                  gradeId = `grade-${gradeLevel}-${dept.toLowerCase()}-${strand.toLowerCase()}`
                } else {
                  gradeId = `grade-${gradeLevel}-${dept.toLowerCase()}`
                }

                const grade = await GradeDatabase.getGrade(gradeId)
                if (grade) {
                  color = grade.color
                }
              } catch (error) {
                console.error('Error fetching grade color:', error)
              }
            }

            // For college, get course info
            if (
              enrollmentInfo.level === 'college' &&
              enrollmentInfo.courseCode
            ) {
              courseCode = enrollmentInfo.courseCode
              courseName = enrollmentInfo.courseName

              // Get course color
              try {
                const course = await CourseDatabase.getCourse(
                  enrollmentInfo.courseCode
                )
                if (course) {
                  color = course.color
                }
              } catch (error) {
                console.error('Error fetching course color:', error)
              }
            }
          }

          contacts.push({
            uid: studentId,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            photoURL: student.photoURL,
            lastMessage: chat?.lastMessage,
            lastMessageAt: chat?.lastMessageAt || enrollmentDate,
            unreadCount,
            chatId: chat?.id,
            gradeLevel,
            courseCode,
            courseName,
            strand,
            color,
            department,
          })
        }

        // Sort by lastMessageAt (most recent first), then by enrollment date, and limit to 5
        return contacts
          .sort((a, b) => {
            // Prioritize students with recent messages
            if (a.lastMessageAt && b.lastMessageAt) {
              const aTime = new Date(a.lastMessageAt).getTime()
              const bTime = new Date(b.lastMessageAt).getTime()
              // If both have chats, sort by lastMessageAt
              if (a.chatId && b.chatId) {
                return bTime - aTime
              }
              // If only one has a chat, prioritize the one with chat
              if (a.chatId && !b.chatId) return -1
              if (!a.chatId && b.chatId) return 1
            }
            // If no messages, sort by enrollment date (most recent first)
            if (!a.lastMessageAt && !b.lastMessageAt) return 0
            if (!a.lastMessageAt) return 1
            if (!b.lastMessageAt) return -1
            return (
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime()
            )
          })
          .slice(0, 5)
      }
    } catch (error) {
      console.error('Error getting contacts:', error)
      return []
    }
  }

  // Get unread message count for a chat
  static async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      const messages = await this.getChatMessages(chatId, 100)
      let unreadCount = 0

      for (const message of messages) {
        if (message.senderId !== userId && !message.readBy[userId]) {
          unreadCount++
        }
      }

      return unreadCount
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }
}
