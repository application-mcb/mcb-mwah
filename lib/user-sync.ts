// Client-side user utilities - Type definitions only
// All database operations have been moved to server actions
export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
  phoneNumber: string;
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  gender: string;
  civilStatus: string;
  streetName: string;
  province: string;
  municipality: string;
  barangay: string;
  zipCode: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelationship: string;
  emergencyContact?: string;
  photoURL?: string;
  provider: 'email' | 'google' | 'magic-link';
  studentId?: string;
  academicDataUsageAgreement: boolean;
  createdAt: any;
  updatedAt: any;
  lastLoginAt: any;
}

