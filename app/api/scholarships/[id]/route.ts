import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { doc, updateDoc, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const { id } = params;
    const body = await request.json();
    const { code, name, value, minUnit } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json({ 
        error: 'Code and Name are required' 
      }, { status: 400 });
    }

    // Check if scholarship exists
    const scholarshipRef = doc(db, 'scholarships', id);
    const scholarshipSnap = await getDoc(scholarshipRef);
    
    if (!scholarshipSnap.exists()) {
      return NextResponse.json({ 
        error: 'Scholarship not found' 
      }, { status: 404 });
    }

    // Check if scholarship code already exists (excluding current scholarship)
    const scholarshipsRef = collection(db, 'scholarships');
    const snapshot = await getDocs(scholarshipsRef);
    const existingScholarship = snapshot.docs.find(doc => 
      doc.id !== id && doc.data().code.toLowerCase() === code.toLowerCase()
    );

    if (existingScholarship) {
      return NextResponse.json({ 
        error: 'Scholarship code already exists' 
      }, { status: 400 });
    }

    // Update scholarship
    const updateData = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      value: parseInt(value) || 0,
      minUnit: parseInt(minUnit) || 0,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(scholarshipRef, updateData);

    return NextResponse.json({ 
      success: true, 
      scholarship: {
        id,
        ...updateData,
        createdAt: scholarshipSnap.data().createdAt,
        createdBy: scholarshipSnap.data().createdBy
      }
    });

  } catch (error: any) {
    console.error('Error updating scholarship:', error);
    return NextResponse.json({ 
      error: 'Failed to update scholarship',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const { id } = params;

    // Check if scholarship exists
    const scholarshipRef = doc(db, 'scholarships', id);
    const scholarshipSnap = await getDoc(scholarshipRef);
    
    if (!scholarshipSnap.exists()) {
      return NextResponse.json({ 
        error: 'Scholarship not found' 
      }, { status: 404 });
    }

    // Delete scholarship
    await deleteDoc(scholarshipRef);

    return NextResponse.json({ 
      success: true, 
      message: 'Scholarship deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting scholarship:', error);
    return NextResponse.json({ 
      error: 'Failed to delete scholarship',
      details: error.message 
    }, { status: 500 });
  }
}
