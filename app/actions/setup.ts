'use server';

import { StudentDatabase } from '@/lib/firestore-database';

export async function createStudentAccountAction({ uid, profileData }: {
  uid: string;
  profileData: any;
}) {
  try {
    // Validate required fields server-side
    const requiredFields = [
      'firstName', 'lastName', 'phoneNumber', 'birthMonth',
      'birthDay', 'birthYear', 'gender', 'civilStatus',
      'streetName', 'province', 'municipality', 'barangay',
      'zipCode', 'guardianName', 'guardianPhone', 'guardianRelationship'
    ];

    const missingFields = requiredFields.filter(field => !profileData[field]?.trim());

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Check if academic data usage agreement is accepted
    if (!profileData.academicDataUsageAgreement) {
      return {
        success: false,
        error: 'Academic data usage agreement must be accepted'
      };
    }

    // Create new student account with complete profile
    const studentData = {
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
      religion: profileData.religion || '',
      placeOfBirth: profileData.placeOfBirth || '',
      citizenship: profileData.citizenship || '',
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
      previousSchoolName: profileData.previousSchoolName || '',
      previousSchoolType: profileData.previousSchoolType || '',
      previousSchoolProvince: profileData.previousSchoolProvince || '',
      previousSchoolMunicipality: profileData.previousSchoolMunicipality || '',
      photoURL: profileData.photoURL || '',
      provider: profileData.provider || 'email',
      academicDataUsageAgreement: profileData.academicDataUsageAgreement,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    const createdUser = await StudentDatabase.createStudent(studentData);

    if (!createdUser) {
      return {
        success: false,
        error: 'Failed to create student account'
      };
    }

    return {
      success: true,
      user: createdUser,
      message: 'Student account created successfully'
    };
  } catch (error: any) {
    console.error('Student account creation server action error:', error.message);
    return {
      success: false,
      error: 'Failed to create student account'
    };
  }
}
