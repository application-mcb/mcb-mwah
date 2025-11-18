import { NextRequest, NextResponse } from 'next/server'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { initializeApp, getApps } from 'firebase/app'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase app if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const storage = getStorage(app)

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// POST /api/chat/upload - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const chatId = formData.get('chatId') as string
    const messageId = formData.get('messageId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!chatId || !messageId) {
      return NextResponse.json(
        { success: false, error: 'chatId and messageId are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'File type not allowed. Only images, PDFs, and documents are allowed.',
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Determine file type category
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const fileType = isImage ? 'image' : 'file'

    // Upload file to Firebase Storage
    const fileExtension = file.name.split('.').pop()
    const fileName = `${messageId}_${Date.now()}.${fileExtension}`
    const storagePath = `chat-files/${chatId}/${fileName}`
    const storageRef = ref(storage, storagePath)

    const uploadTask = uploadBytesResumable(storageRef, file)

    // Wait for upload to complete
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking can be added here if needed
        },
        (error) => {
          reject(error)
        },
        () => {
          resolve()
        }
      )
    })

    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

    return NextResponse.json({
      success: true,
      fileUrl: downloadURL,
      fileName: file.name,
      fileSize: file.size,
      fileType,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      },
      { status: 500 }
    )
  }
}

