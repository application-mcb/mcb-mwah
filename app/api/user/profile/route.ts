import { NextRequest, NextResponse } from 'next/server';
import { serverTimestamp } from 'firebase/firestore';
import { StudentDatabase, CreateStudentData } from '@/lib/firestore-database';

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const uids = searchParams.get('uids');

    // Handle batch profile requests
    if (uids) {
      const uidArray = uids.split(',').map(id => id.trim()).filter(id => id);
      const profilePromises = uidArray.map(id => StudentDatabase.getStudent(id));

      const profiles = await Promise.all(profilePromises);

      // Filter out null results
      const validProfiles = profiles.filter(profile => profile !== null);

      return NextResponse.json({
        success: true,
        users: validProfiles,
        count: validProfiles.length
      });
    }

    // Handle single profile request
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID (uid) or User IDs (uids) parameter is required' },
        { status: 400 }
      );
    }

    const userData = await StudentDatabase.getStudent(uid);

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error: any) {
    console.error('Get user profile error:', error.message);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

// Update user profile and create student account
export async function PUT(request: NextRequest) {
  try {
    const { uid, profileData, createStudentAccount = false } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'phoneNumber', 'birthMonth',
      'birthDay', 'birthYear', 'gender', 'civilStatus',
      'streetName', 'province', 'municipality', 'barangay',
      'zipCode', 'guardianName', 'guardianPhone', 'guardianRelationship'
    ];

    const missingFields = requiredFields.filter(field => !profileData[field]?.trim());

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if academic data usage agreement is accepted
    if (!profileData.academicDataUsageAgreement) {
      return NextResponse.json(
        { error: 'Academic data usage agreement must be accepted' },
        { status: 400 }
      );
    }

    let updatedUser;

    if (createStudentAccount) {
      // Create new student account with complete profile
      const studentData: CreateStudentData = {
        uid,
        email: profileData.email || '',
        firstName: profileData.firstName,
        middleName: profileData.middleName || '',
        lastName: profileData.lastName,
        nameExtension: profileData.nameExtension || '',
        phoneNumber: profileData.phoneNumber,
        birthMonth: profileData.birthMonth,
        birthDay: profileData.birthDay,
        birthYear: profileData.birthYear,
        gender: profileData.gender,
        civilStatus: profileData.civilStatus,
        streetName: profileData.streetName,
        province: profileData.province,
        municipality: profileData.municipality,
        barangay: profileData.barangay,
        zipCode: profileData.zipCode,
        guardianName: profileData.guardianName,
        guardianPhone: profileData.guardianPhone,
        guardianEmail: profileData.guardianEmail || '',
        guardianRelationship: profileData.guardianRelationship,
        emergencyContact: profileData.emergencyContact || '',
        photoURL: profileData.photoURL || '',
        provider: profileData.provider || 'email',
        academicDataUsageAgreement: profileData.academicDataUsageAgreement,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      updatedUser = await StudentDatabase.createStudent(studentData);
    } else {
      // Update existing student profile
      updatedUser = await StudentDatabase.updateStudent(uid, profileData);
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: createStudentAccount ? 'Failed to create student account' : 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: createStudentAccount ? 'Student account created successfully' : 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('Update user profile error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
