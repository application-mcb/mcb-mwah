import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-server';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export async function GET() {
  try {

    // Get all scholarships
    const scholarshipsRef = collection(db, 'scholarships');
    const q = query(scholarshipsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const scholarships = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true, 
      scholarships 
    });

  } catch (error: any) {
    console.error('Error fetching scholarships:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch scholarships',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, value, minUnit } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json({ 
        error: 'Code and Name are required' 
      }, { status: 400 });
    }

    // Check if scholarship code already exists
    const scholarshipsRef = collection(db, 'scholarships');
    const snapshot = await getDocs(scholarshipsRef);
    const existingScholarship = snapshot.docs.find(doc => 
      doc.data().code.toLowerCase() === code.toLowerCase()
    );

    if (existingScholarship) {
      return NextResponse.json({ 
        error: 'Scholarship code already exists' 
      }, { status: 400 });
    }

    // Create new scholarship
    const scholarshipData = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      value: parseInt(value) || 0,
      minUnit: parseInt(minUnit) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system' // Default creator since we don't have session auth
    };

    const docRef = await addDoc(scholarshipsRef, scholarshipData);

    return NextResponse.json({ 
      success: true, 
      scholarship: {
        id: docRef.id,
        ...scholarshipData
      }
    });

  } catch (error: any) {
    console.error('Error creating scholarship:', error);
    return NextResponse.json({ 
      error: 'Failed to create scholarship',
      details: error.message 
    }, { status: 500 });
  }
}
