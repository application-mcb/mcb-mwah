import { NextRequest, NextResponse } from 'next/server';
import { serverTimestamp } from 'firebase/firestore';
import { StudentDatabase, StudentData, CreateStudentData } from '@/lib/firestore-database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'uid', 'email', 'firstName', 'lastName', 'phoneNumber',
      'birthMonth', 'birthDay', 'birthYear', 'gender', 'civilStatus',
      'streetName', 'province', 'municipality', 'barangay', 'zipCode',
      'guardianName', 'guardianPhone', 'guardianRelationship'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if student already exists
    const existingStudent = await StudentDatabase.getStudent(body.uid);
    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student account already exists' },
        { status: 409 }
      );
    }

    // Create student data object
    const studentData: CreateStudentData = {
      uid: body.uid,
      email: body.email,
      firstName: body.firstName,
      middleName: body.middleName || '',
      lastName: body.lastName,
      nameExtension: body.nameExtension || '',
      phoneNumber: body.phoneNumber,
      birthMonth: body.birthMonth,
      birthDay: body.birthDay,
      birthYear: body.birthYear,
      gender: body.gender,
      civilStatus: body.civilStatus,
      streetName: body.streetName,
      province: body.province,
      municipality: body.municipality,
      barangay: body.barangay,
      zipCode: body.zipCode,
      guardianName: body.guardianName,
      guardianPhone: body.guardianPhone,
      guardianEmail: body.guardianEmail,
      guardianRelationship: body.guardianRelationship,
      emergencyContact: body.emergencyContact || '',
      photoURL: body.photoURL || '',
      provider: body.provider || 'email',
      academicDataUsageAgreement: body.academicDataUsageAgreement || true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    // Create student in Firestore
    const createdStudent = await StudentDatabase.createStudent(studentData);

    return NextResponse.json({
      success: true,
      student: createdStudent,
      message: 'Student account created successfully'
    });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student account' },
      { status: 500 }
    );
  }
}
