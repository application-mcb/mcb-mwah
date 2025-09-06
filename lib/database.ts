// User data structure for database storage
export interface UserData {
  uid: string;
  email: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nameExtension?: string;
  phoneNumber?: string;
  birthMonth?: string;
  birthDay?: string;
  birthYear?: string;
  gender?: string;
  civilStatus?: string;
  streetName?: string;
  province?: string;
  municipality?: string;
  barangay?: string;
  zipCode?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  emergencyContact?: string;
  photoURL?: string;
  provider: 'email' | 'google' | 'magic-link';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

// Mock database functions (replace with your actual database)
export class UserDatabase {
  private static users: Map<string, UserData> = new Map();

  // Create or update user data
  static async createOrUpdateUser(userData: Partial<UserData>): Promise<UserData> {
    const now = new Date().toISOString();
    
    const user: UserData = {
      uid: userData.uid!,
      email: userData.email!,
      firstName: userData.firstName || '',
      middleName: userData.middleName || '',
      lastName: userData.lastName || '',
      nameExtension: userData.nameExtension || '',
      phoneNumber: userData.phoneNumber || '',
      birthMonth: userData.birthMonth || '',
      birthDay: userData.birthDay || '',
      birthYear: userData.birthYear || '',
      gender: userData.gender || '',
      civilStatus: userData.civilStatus || '',
      streetName: userData.streetName || '',
      province: userData.province || '',
      municipality: userData.municipality || '',
      barangay: userData.barangay || '',
      zipCode: userData.zipCode || '',
      guardianName: userData.guardianName || '',
      guardianPhone: userData.guardianPhone || '',
      guardianEmail: userData.guardianEmail || '',
      guardianRelationship: userData.guardianRelationship || '',
      emergencyContact: userData.emergencyContact || '',
      photoURL: userData.photoURL || '',
      provider: userData.provider || 'email',
      createdAt: userData.createdAt || now,
      updatedAt: now,
      lastLoginAt: now,
    };

    this.users.set(user.uid, user);
    return user;
  }

  // Get user data by UID
  static async getUser(uid: string): Promise<UserData | null> {
    return this.users.get(uid) || null;
  }

  // Update user profile data
  static async updateUserProfile(uid: string, profileData: Partial<UserData>): Promise<UserData | null> {
    const existingUser = this.users.get(uid);
    if (!existingUser) return null;

    const updatedUser: UserData = {
      ...existingUser,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(uid, updatedUser);
    return updatedUser;
  }

  // Check if user exists by email
  static async getUserByEmail(email: string): Promise<UserData | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  // Sync Firebase user with database
  static async syncFirebaseUser(firebaseUser: any): Promise<UserData> {
    const existingUser = await this.getUser(firebaseUser.uid);
    
    if (existingUser) {
      // Update last login time
      const updatedUser = await this.updateUserProfile(firebaseUser.uid, {
        lastLoginAt: new Date().toISOString(),
        photoURL: firebaseUser.photoURL || existingUser.photoURL,
      });
      
      if (!updatedUser) {
        throw new Error('Failed to update user profile');
      }
      
      return updatedUser;
    } else {
      // Create new user
      const provider = firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email';
      
      // Split displayName into separate fields if available
      const nameParts = (firebaseUser.displayName || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

      return await this.createOrUpdateUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName,
        middleName,
        lastName,
        photoURL: firebaseUser.photoURL || '',
        provider,
      });
    }
  }
}
