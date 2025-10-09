import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase-server';
import { SubjectDatabase } from './subject-database';
import { SectionDatabase } from './grade-section-database';

export interface EnrollmentData {
  id?: string; // Document ID from Firestore
  userId: string;
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    nameExtension?: string;
    email: string;
    phone: string;
    birthDay: string;
    birthMonth: string;
    birthYear: string;
    citizenship: string;
    civilStatus: string;
    gender: string;
    placeOfBirth: string;
    religion?: string;
  };
  enrollmentInfo: {
    gradeLevel: string;
    schoolYear: string;
    enrollmentDate: string;
    status: string;
    orNumber?: string;
    scholarship?: string;
    studentId?: string;
    sectionId?: string;
    studentType?: 'regular' | 'irregular';
  };
  selectedSubjects?: string[];
  documents: {
    [key: string]: {
      name: string;
      url: string;
      uploadedAt: string;
    };
  };
  submittedAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  ayCode: string;
  currentAY?: string;
  academicYear?: string;
  AYCode?: string;
  activeAY?: string;
}

export class EnrollmentDatabase {

  // Get system configuration (academic year, etc.)
  static async getSystemConfig(): Promise<SystemConfig> {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'system'));

      if (!configDoc.exists()) {
        // Return default config if not found
        return {
          ayCode: 'AY2526',
          currentAY: 'AY2526'
        };
      }

      const configData = configDoc.data() || {};

      // Try to find AY code from various possible fields
      let ayCode = configData.currentAY || configData.academicYear || configData.AYCode || configData.activeAY || configData.AY;

      if (!ayCode) {
        // Look for any field that matches AY pattern
        const ayKey = Object.keys(configData).find((k) => /^AY\d{2}\d{2}$/.test(k));
        if (ayKey) ayCode = ayKey;
      }

      if (!ayCode || !/^AY\d{2}\d{2}$/.test(ayCode)) {
        ayCode = 'AY2526'; // fallback
      }

      return {
        ayCode,
        currentAY: configData.currentAY,
        academicYear: configData.academicYear,
        AYCode: configData.AYCode,
        activeAY: configData.activeAY
      };
    } catch (error) {
      console.error('Error fetching system config:', error);
      return {
        ayCode: 'AY2526',
        currentAY: 'AY2526'
      };
    }
  }

  // Submit enrollment data
  static async submitEnrollment(userId: string, enrollmentData: Partial<EnrollmentData>): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for dynamic AY code
      const systemConfig = await this.getSystemConfig();
      const ayCode = systemConfig.ayCode;

      // Create the enrollment document
      const enrollmentRef = doc(db, 'students', userId, 'enrollment', ayCode);

      const completeEnrollmentData = {
        userId,
        ...enrollmentData,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(enrollmentRef, completeEnrollmentData);

      // Also save to top-level enrollments collection
      const topLevelEnrollmentRef = doc(db, 'enrollments', `${userId}_${ayCode}`);
      await setDoc(topLevelEnrollmentRef, {
        userId,
        ayCode,
        enrollmentData: completeEnrollmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Enrollment submitted successfully for user ${userId} in ${ayCode}`);
      return { success: true };
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get user's enrollment status
  static async getEnrollment(userId: string, ayCode?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!ayCode) {
        const systemConfig = await this.getSystemConfig();
        ayCode = systemConfig.ayCode;
      }

      const enrollmentRef = doc(db, 'students', userId, 'enrollment', ayCode);
      const enrollmentDoc = await getDoc(enrollmentRef);

      if (!enrollmentDoc.exists()) {
        return {
          success: false,
          error: 'No enrollment found for this user'
        };
      }

      const enrollmentData = enrollmentDoc.data();
      return {
        success: true,
        data: enrollmentData
      };
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Check if student exists
  static async getStudent(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const studentRef = doc(db, 'students', userId);
      const studentDoc = await getDoc(studentRef);

      if (!studentDoc.exists()) {
        return {
          success: false,
          error: 'Student not found'
        };
      }

      return {
        success: true,
        data: studentDoc.data()
      };
    } catch (error) {
      console.error('Error fetching student:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get all enrollments for registrar view
  static async getAllEnrollments(ayCode?: string): Promise<{ success: boolean; data?: EnrollmentData[]; error?: string }> {
    try {
      if (!ayCode) {
        const systemConfig = await this.getSystemConfig();
        ayCode = systemConfig.ayCode;
      }

      // Get all enrollments from the top-level enrollments collection
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('ayCode', '==', ayCode)
        // Note: ordering removed to avoid composite index requirement
        // orderBy('updatedAt', 'desc')
      );

      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrollments: EnrollmentData[] = [];

      for (const doc of enrollmentsSnapshot.docs) {
        const enrollmentDoc = doc.data();
        if (enrollmentDoc.enrollmentData) {
          enrollments.push({
            ...enrollmentDoc.enrollmentData,
            // Add document ID for reference
            id: doc.id
          });
        }
      }

      // Sort enrollments by updatedAt in descending order (most recent first)
      enrollments.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA; // Descending order
      });

      return {
        success: true,
        data: enrollments
      };
    } catch (error) {
      console.error('Error fetching all enrollments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Enroll student - update status and create studentGrades subcollection
  static async enrollStudent(userId: string, selectedSubjects: string[], orNumber?: string, scholarship?: string, studentId?: string, studentType?: 'regular' | 'irregular'): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig();
      const ayCode = systemConfig.ayCode;

      // Check if enrollment document exists, if not create it
      const enrollmentRef = doc(db, 'students', userId, 'enrollment', ayCode);
      const enrollmentDoc = await getDoc(enrollmentRef);

      if (!enrollmentDoc.exists()) {
        // Create the enrollment document first
        const enrollmentData = {
          userId,
          personalInfo: {}, // Will be filled from top-level enrollment
          enrollmentInfo: {
            gradeLevel: '',
            schoolYear: ayCode,
            enrollmentDate: new Date().toISOString(),
            status: 'enrolled',
            orNumber: orNumber || '',
            scholarship: scholarship || '',
            studentId: studentId || ''
          },
          selectedSubjects,
          documents: {},
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Try to get data from top-level enrollment
        const topLevelEnrollmentRef = doc(db, 'enrollments', `${userId}_${ayCode}`);
        const topLevelDoc = await getDoc(topLevelEnrollmentRef);

        if (topLevelDoc.exists()) {
          const topLevelData = topLevelDoc.data();
          if (topLevelData?.enrollmentData) {
            enrollmentData.personalInfo = topLevelData.enrollmentData.personalInfo || {};
            enrollmentData.enrollmentInfo.gradeLevel = topLevelData.enrollmentData.enrollmentInfo?.gradeLevel || '';
            enrollmentData.documents = topLevelData.enrollmentData.documents || {};
            enrollmentData.submittedAt = topLevelData.enrollmentData.submittedAt || serverTimestamp();
          }
        }

        await setDoc(enrollmentRef, enrollmentData);
      } else {
        // Update existing enrollment status
        const enrollmentUpdate = {
          'enrollmentInfo.status': 'enrolled',
          'enrollmentInfo.enrollmentDate': new Date().toISOString(),
          'enrollmentInfo.orNumber': orNumber || '',
          'enrollmentInfo.scholarship': scholarship || '',
          'enrollmentInfo.studentType': studentType || 'regular',
          selectedSubjects: selectedSubjects,
          updatedAt: serverTimestamp()
        };

        await updateDoc(enrollmentRef, enrollmentUpdate);
      }

      // Update student document with studentId
      if (studentId) {
        const studentRef = doc(db, 'students', userId);
        await updateDoc(studentRef, {
          studentId: studentId,
          updatedAt: serverTimestamp()
        });
      }

      // Create studentGrades subcollection
      const studentGradesRef = collection(db, 'students', userId, 'studentGrades');

      // Get subject details for each selected subject
      const subjectDetails: { [subjectId: string]: { subjectName: string; period1: null; period2: null; period3: null; period4: null } } = {};

      for (const subjectId of selectedSubjects) {
        try {
          const subject = await SubjectDatabase.getSubject(subjectId);
          if (subject) {
            subjectDetails[subjectId] = {
              subjectName: subject.name,
              period1: null,
              period2: null,
              period3: null,
              period4: null
            };
          }
        } catch (error) {
          console.warn(`Failed to get details for subject ${subjectId}:`, error);
          // Still include the subject with just the ID as name if we can't fetch details
          subjectDetails[subjectId] = {
            subjectName: subjectId,
            period1: null,
            period2: null,
            period3: null,
            period4: null
          };
        }
      }

      // Create the studentGrades document using the ayCode as document ID
      const gradesDocRef = doc(studentGradesRef, ayCode);
      await setDoc(gradesDocRef, {
        ...subjectDetails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Also update the top-level enrollments collection
      const topLevelEnrollmentRef = doc(db, 'enrollments', `${userId}_${ayCode}`);
      const topLevelDoc = await getDoc(topLevelEnrollmentRef);

      if (topLevelDoc.exists()) {
        // Update existing document
        await updateDoc(topLevelEnrollmentRef, {
          'enrollmentData.enrollmentInfo.status': 'enrolled',
          'enrollmentData.enrollmentInfo.enrollmentDate': new Date().toISOString(),
          'enrollmentData.enrollmentInfo.orNumber': orNumber || '',
          'enrollmentData.enrollmentInfo.scholarship': scholarship || '',
          'enrollmentData.enrollmentInfo.studentType': studentType || 'regular',
          updatedAt: serverTimestamp()
        });

        // Update student document with studentId
        if (studentId) {
          const studentRef = doc(db, 'students', userId);
          await updateDoc(studentRef, {
            studentId: studentId,
            updatedAt: serverTimestamp()
          });
        }
      } else {
        // Create the document if it doesn't exist
        const enrollmentData = {
          userId,
          ayCode,
          enrollmentData: {
            userId,
            personalInfo: {},
            enrollmentInfo: {
              gradeLevel: '',
              schoolYear: ayCode,
              enrollmentDate: new Date().toISOString(),
              status: 'enrolled',
              orNumber: orNumber || '',
              scholarship: scholarship || '',
              studentType: studentType || 'regular'
            },
            documents: {},
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(topLevelEnrollmentRef, enrollmentData);
      }

      console.log(`✅ Student ${userId} enrolled successfully in ${ayCode} with ${selectedSubjects.length} subjects`);
      return { success: true };
    } catch (error) {
      console.error('Error enrolling student:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Revoke student enrollment - delete subcollections and reset status
  static async revokeEnrollment(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig();
      const ayCode = systemConfig.ayCode;

      // Delete the studentGrades document
      const studentGradesRef = doc(db, 'students', userId, 'studentGrades', ayCode);
      try {
        await deleteDoc(studentGradesRef);
      } catch (error) {
        console.warn(`Could not delete studentGrades document (might not exist):`, error);
      }

      // Reset enrollment status to 'pending' and remove enrollment date
      const enrollmentRef = doc(db, 'students', userId, 'enrollment', ayCode);
      const enrollmentUpdate = {
        'enrollmentInfo.status': 'pending',
        'enrollmentInfo.enrollmentDate': deleteField(), // Remove the enrollment date
        updatedAt: serverTimestamp()
      };

      await updateDoc(enrollmentRef, enrollmentUpdate);

      // Also update the top-level enrollments collection status
      const topLevelEnrollmentRef = doc(db, 'enrollments', `${userId}_${ayCode}`);
      const topLevelUpdate = {
        'enrollmentData.enrollmentInfo.status': 'pending',
        'enrollmentData.enrollmentInfo.enrollmentDate': deleteField(), // Remove the enrollment date
        updatedAt: serverTimestamp()
      };

      await updateDoc(topLevelEnrollmentRef, topLevelUpdate);

      return { success: true };
    } catch (error) {
      console.error('Error revoking enrollment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Assign section to student enrollment
  static async assignSection(userId: string, sectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig();
      const ayCode = systemConfig.ayCode;

      // Get current enrollment to check if student is already assigned to a different section
      const currentEnrollment = await this.getEnrollment(userId, ayCode);
      const currentSectionId = currentEnrollment.success && currentEnrollment.data?.enrollmentInfo?.sectionId;

      // If student is currently assigned to a different section, remove them from that section's students array
      if (currentSectionId && currentSectionId !== sectionId) {
        const oldSectionRef = doc(db, 'sections', currentSectionId);
        const oldSectionUpdate = {
          students: arrayRemove(userId),
          updatedAt: serverTimestamp()
        };
        await updateDoc(oldSectionRef, oldSectionUpdate);
        console.log(`✅ Removed student ${userId} from old section ${currentSectionId}`);
      }

      // Update the enrollment document with section assignment
      const enrollmentRef = doc(db, 'students', userId, 'enrollment', ayCode);
      const enrollmentUpdate = {
        'enrollmentInfo.sectionId': sectionId,
        updatedAt: serverTimestamp()
      };

      await updateDoc(enrollmentRef, enrollmentUpdate);

      // Also update the top-level enrollments collection
      const topLevelEnrollmentRef = doc(db, 'enrollments', `${userId}_${ayCode}`);
      const topLevelUpdate = {
        'enrollmentData.enrollmentInfo.sectionId': sectionId,
        updatedAt: serverTimestamp()
      };

      await updateDoc(topLevelEnrollmentRef, topLevelUpdate);

      // Add student to new section's students array
      const sectionRef = doc(db, 'sections', sectionId);
      const sectionUpdate = {
        students: arrayUnion(userId),
        updatedAt: serverTimestamp()
      };

      await updateDoc(sectionRef, sectionUpdate);

      console.log(`✅ Section ${sectionId} assigned to student ${userId} in ${ayCode}`);
      return { success: true };
    } catch (error) {
      console.error('Error assigning section:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Unassign section from student enrollment
  static async unassignSection(userId: string, sectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get system config for current AY code
      const systemConfig = await this.getSystemConfig();
      const ayCode = systemConfig.ayCode;

      // Update the enrollment document to remove section assignment
      const enrollmentRef = doc(db, 'students', userId, 'enrollment', ayCode);
      const enrollmentUpdate = {
        'enrollmentInfo.sectionId': deleteField(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(enrollmentRef, enrollmentUpdate);

      // Also update the top-level enrollments collection
      const topLevelEnrollmentRef = doc(db, 'enrollments', `${userId}_${ayCode}`);
      const topLevelUpdate = {
        'enrollmentData.enrollmentInfo.sectionId': deleteField(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(topLevelEnrollmentRef, topLevelUpdate);

      // Remove student from section's students array
      const sectionRef = doc(db, 'sections', sectionId);
      const sectionUpdate = {
        students: arrayRemove(userId),
        updatedAt: serverTimestamp()
      };

      await updateDoc(sectionRef, sectionUpdate);

      console.log(`✅ Section ${sectionId} unassigned from student ${userId} in ${ayCode}`);
      return { success: true };
    } catch (error) {
      console.error('Error unassigning section:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get the latest student ID from config
  static async getLatestStudentId(): Promise<{ success: boolean; latestId?: string; error?: string }> {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'system'));

      if (!configDoc.exists()) {
        return {
          success: false,
          error: 'System configuration not found'
        };
      }

      const configData = configDoc.data() || {};
      const latestId = configData.latestId;

      if (!latestId) {
        return {
          success: false,
          error: 'latestId field not found in system configuration'
        };
      }

      return {
        success: true,
        latestId: latestId as string
      };
    } catch (error) {
      console.error('Error fetching latest student ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Update the latest student ID in config
  static async updateLatestStudentId(newLatestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const configRef = doc(db, 'config', 'system');
      await updateDoc(configRef, {
        latestId: newLatestId,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Latest student ID updated to: ${newLatestId}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating latest student ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Test Firebase connection
  static async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Try to access the config collection
      const configCollection = collection(db, 'config');
      const configQuery = query(configCollection);
      const configSnapshot = await getDocs(configQuery);

      return {
        success: true,
        message: `Firebase connection working. Found ${configSnapshot.size} documents in config collection.`
      };
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return {
        success: false,
        message: 'Firebase connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
