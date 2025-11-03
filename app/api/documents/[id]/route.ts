import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Helper function to get document type names
function getDocumentTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    reportCard: 'Report Card (Form 138)',
    certificateOfGoodMoral: 'Certificate of Good Moral Character',
    birthCertificate: 'Birth Certificate',
    idPicture: 'ID Picture',
    form137: 'Form 137 (Permanent Record)',
    certificateOfCompletion: 'Certificate of Completion',
    marriageCertificate: 'Marriage Certificate'
  };

  return typeNames[type] || type;
}

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Document ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get current user document
    const userDocRef = doc(db, 'students', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      );
    }

    const userData = userDocSnap.data();
    const currentDocuments = userData.documents || {};

    // Check if the document exists
    if (!currentDocuments[id]) {
      return NextResponse.json(
        { error: 'Document not found in user profile' },
        { status: 404 }
      );
    }

    // Remove the document from the documents map
    const { [id]: deletedDoc, ...remainingDocuments } = currentDocuments;

    await updateDoc(userDocRef, {
      documents: remainingDocuments,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/documents/[id] - Get a specific document
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Document ID and User ID are required' },
        { status: 400 }
      );
    }

    const userDocRef = doc(db, 'students', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      );
    }

    const userData = userDocSnap.data();
    const documents = userData.documents || {};

    if (!documents[id]) {
      return NextResponse.json(
        { error: 'Document not found in user profile' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: id,
        type: id,
        name: getDocumentTypeName(id),
        ...documents[id]
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
