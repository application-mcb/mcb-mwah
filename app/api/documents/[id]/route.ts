import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

// Helper function to get document type names
function getDocumentTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    reportCard: 'Report Card (Form 138)',
    certificateOfGoodMoral: 'Certificate of Good Moral Character',
    birthCertificate: 'Birth Certificate',
    idPicture: 'ID Picture',
    form137: 'Form 137 (Permanent Record)',
    certificateOfCompletion: 'Certificate of Completion',
    marriageCertificate: 'Marriage Certificate',
  }

  return typeNames[type] || type
}

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Document ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get current user document
    const userDocRef = doc(db, 'students', userId)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      )
    }

    const userData = userDocSnap.data()
    const currentDocuments = userData.documents || {}

    // Check if the document exists
    if (!currentDocuments[id]) {
      return NextResponse.json(
        { error: 'Document not found in user profile' },
        { status: 404 }
      )
    }

    // Remove the document from the documents map
    const { [id]: deletedDoc, ...remainingDocuments } = currentDocuments

    await updateDoc(userDocRef, {
      documents: remainingDocuments,
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[id] - Update document status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Document ID and User ID are required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, rejectionReason, registrarUid, validation } = body

    if (!status || !registrarUid) {
      return NextResponse.json(
        { error: 'Status and registrar UID are required' },
        { status: 400 }
      )
    }

    if (
      status !== 'approved' &&
      status !== 'rejected' &&
      status !== 'pending'
    ) {
      return NextResponse.json(
        { error: 'Status must be "approved", "rejected", or "pending"' },
        { status: 400 }
      )
    }

    // If status is rejected, rejectionReason is required
    if (
      status === 'rejected' &&
      (!rejectionReason || !rejectionReason.trim())
    ) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a document' },
        { status: 400 }
      )
    }

    const userDocRef = doc(db, 'students', userId)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      )
    }

    const userData = userDocSnap.data()
    const currentDocuments = userData.documents || {}

    if (!currentDocuments[id]) {
      return NextResponse.json(
        { error: 'Document not found in user profile' },
        { status: 404 }
      )
    }

    // Update the document with new status
    // When approving, remove rejectionReason field; when rejecting, set it; when revoking (pending), keep rejectionReason if it exists
    const existingDoc = currentDocuments[id]

    let updatedDocument: any

    if (status === 'approved') {
      // When approving, create new object without rejectionReason
      const { rejectionReason, ...docWithoutRejection } = existingDoc
      updatedDocument = {
        ...docWithoutRejection,
        status: status,
      }
    } else if (status === 'rejected' && rejectionReason) {
      // When rejecting, include the rejection reason
      updatedDocument = {
        ...existingDoc,
        status: status,
        rejectionReason: rejectionReason.trim(),
      }
    } else if (status === 'pending') {
      // When revoking (setting to pending), keep rejectionReason if it exists
      updatedDocument = {
        ...existingDoc,
        status: status,
      }
    } else {
      // Fallback - just update status
      updatedDocument = {
        ...existingDoc,
        status: status,
      }
    }

    // If validation data is provided, merge it into the document
    if (validation) {
      updatedDocument = {
        ...updatedDocument,
        extractedText: validation.extractedText,
        validationSummary: validation.validationSummary,
        validationStatus: validation.validationStatus,
        validationDetails: validation.validationDetails,
        confidenceScore: validation.confidenceScore,
        keyFindings: validation.keyFindings,
        scannedAt: validation.scannedAt,
        scannedBy: validation.scannedBy,
        scanVersion: validation.scanVersion,
        ocrMethod: validation.ocrMethod,
      }
    }

    await updateDoc(userDocRef, {
      documents: {
        ...currentDocuments,
        [id]: updatedDocument,
      },
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: `Document ${status} successfully`,
      document: updatedDocument,
    })
  } catch (error) {
    console.error('Error updating document status:', error)
    return NextResponse.json(
      {
        error: 'Failed to update document status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/documents/[id] - Get a specific document
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Document ID and User ID are required' },
        { status: 400 }
      )
    }

    const userDocRef = doc(db, 'students', userId)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      )
    }

    const userData = userDocSnap.data()
    const documents = userData.documents || {}

    if (!documents[id]) {
      return NextResponse.json(
        { error: 'Document not found in user profile' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document: {
        id: id,
        type: id,
        name: getDocumentTypeName(id),
        ...documents[id],
      },
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
