import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

console.log('  Documents API route loaded');

// GET /api/documents?userId=UID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userRef = doc(db, 'students', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return NextResponse.json({ success: true, documents: [] });
    }

    const data = snap.data() as Record<string, any>;
    const documents = data.documents || {};
    const typeNames: Record<string, string> = {
      reportCard: 'Report Card (Form 138)',
      certificateOfGoodMoral: 'Certificate of Good Moral Character',
      birthCertificate: 'Birth Certificate',
      idPicture: 'ID Picture',
      form137: 'Form 137 (Permanent Record)',
      certificateOfCompletion: 'Certificate of Completion',
      marriageCertificate: 'Marriage Certificate'
    };
    const list = Object.entries(documents).map(([key, value]) => ({
      id: key,
      type: key,
      name: typeNames[key] || key,
      ...(value as Record<string, any>)
    }));
    return NextResponse.json({ success: true, documents: list });
  } catch (e) {
    console.error('GET /api/documents error:', e);
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 });
  }
}

// POST /api/documents
// Body: { userId, type, fileName, downloadURL, size }
export async function POST(request: NextRequest) {
  try {
    const { userId, type, fileName, downloadURL, size } = await request.json();
    if (!userId || !type || !fileName || !downloadURL) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userRef = doc(db, 'students', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const existing = (snap.data() as Record<string, any>).documents || {};
    const nowIso = new Date().toISOString();
    
    // Preserve rejectionReason if document was previously rejected (for reupload scenario)
    const existingDoc = existing[type];
    const preservedRejectionReason = existingDoc?.rejectionReason;
    
    const docInfo = {
      fileType: type,
      fileUrl: downloadURL,
      fileName,
      fileFormat: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'img',
      uploadDate: nowIso,
      uploadedAt: nowIso,
      fileSize: size || 0,
      status: 'pending',
      ...(preservedRejectionReason ? { rejectionReason: preservedRejectionReason } : {})
    };

    await updateDoc(userRef, {
      documents: { ...existing, [type]: docInfo },
      updatedAt: serverTimestamp()
    });

    // Trigger auto-scan in background (don't block response)
    // Fire and forget - scan will update document metadata when complete
    // Use absolute URL for internal API call
    const baseUrl = request.nextUrl.origin
    const scanUrl = `${baseUrl}/api/documents/${type}/scan?userId=${userId}`
    
    // Trigger scan asynchronously (don't await) - use void to explicitly ignore promise
    void fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }).catch((error) => {
      // Log error but don't fail the upload
      console.error('Auto-scan failed for document:', type, error)
    })

    return NextResponse.json({ success: true, message: 'Saved', documentType: type });
  } catch (e) {
    console.error('POST /api/documents error:', e);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}
