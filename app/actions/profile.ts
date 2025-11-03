'use server';

import { StudentDatabase } from '@/lib/firestore-database';

export async function getProfileAction({ uid }: { uid: string }) {
  try {
    const userData = await StudentDatabase.getStudent(uid);

    if (!userData) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user: userData
    };
  } catch (error: any) {
    console.error('Profile read server action error:', error.message);
    return {
      success: false,
      error: 'Failed to get profile'
    };
  }
}

export async function updateProfileAction({ uid, profileData }: {
  uid: string;
  profileData: any;
}) {
  try {
    // Validate required fields server-side
    const requiredFields = [
      'firstName', 'lastName', 'phoneNumber', 'birthMonth',
      'birthDay', 'birthYear', 'gender', 'civilStatus',
      'streetName', 'province', 'municipality', 'barangay',
      'zipCode', 'guardianName', 'guardianPhone', 'guardianRelationship',
      'previousSchoolName', 'previousSchoolType', 'previousSchoolProvince', 'previousSchoolMunicipality'
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

    // Update the student profile
    const updatedUser = await StudentDatabase.updateStudent(uid, profileData);

    if (!updatedUser) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user: updatedUser
    };
  } catch (error: any) {
    console.error('Profile update server action error:', error.message);
    return {
      success: false,
      error: 'Failed to update profile'
    };
  }
}
