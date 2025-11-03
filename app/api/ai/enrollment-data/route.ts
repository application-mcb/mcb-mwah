import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-server';

// Helper function to get current academic year config
async function getCurrentAYCode(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/enrollment?getConfig=true`);
    const configData = await response.json();

    if (!response.ok || !configData.ayCode) {
      throw new Error('Failed to get system configuration');
    }

    return configData.ayCode;
  } catch (error) {
    console.error('Error getting AY code:', error);
    throw error;
  }
}

// Helper function to get student profiles
async function getStudentProfiles(userIds: string[], baseUrl: string) {
  try {
    const profiles: Record<string, any> = {};

    for (const userId of userIds) {
      try {
        const response = await fetch(`${baseUrl}/api/user/profile?uid=${userId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          profiles[userId] = data.user;
        }
      } catch (error) {
        console.warn(`Failed to load profile for user ${userId}:`, error);
      }
    }

    return profiles;
  } catch (error) {
    console.error('Error loading student profiles:', error);
    return {};
  }
}

// Helper function to get student documents
async function getStudentDocuments(userIds: string[], baseUrl: string) {
  try {
    const documents: Record<string, any> = {};

    for (const userId of userIds) {
      try {
        const response = await fetch(`${baseUrl}/api/user/profile?uid=${userId}`);
        const data = await response.json();

        if (response.ok && data.success && data.user?.documents) {
          documents[userId] = data.user.documents;
        }
      } catch (error) {
        console.warn(`Failed to load documents for user ${userId}:`, error);
      }
    }

    return documents;
  } catch (error) {
    console.error('Error loading student documents:', error);
    return {};
  }
}

// Helper function to get subjects
async function getSubjects(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/subjects`);
    const data = await response.json();

    if (response.ok && data.subjects) {
      return data.subjects;
    }
    return [];
  } catch (error) {
    console.error('Error loading subjects:', error);
    return [];
  }
}

// Helper function to get subject sets
async function getSubjectSets(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/subject-sets`);
    const data = await response.json();

    if (response.ok && data.subjectSets) {
      return data.subjectSets;
    }
    return [];
  } catch (error) {
    console.error('Error loading subject sets:', error);
    return [];
  }
}

// Helper function to get grades
async function getGrades(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/grades`);
    const data = await response.json();

    if (response.ok && data.grades) {
      return data.grades;
    }
    return [];
  } catch (error) {
    console.error('Error loading grades:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get base URL from request
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    const ayCode = await getCurrentAYCode(baseUrl);

    // Get all enrollments for current academic year
    const enrollmentsRef = collection(db, 'enrollments');
    const q = query(enrollmentsRef, where('ayCode', '==', ayCode));
    const snapshot = await getDocs(q);

    const enrollments: any[] = [];
    const userIds: string[] = [];

    for (const doc of snapshot.docs) {
      const enrollmentDoc = doc.data();
      if (enrollmentDoc.enrollmentData) {
        enrollments.push({
          ...enrollmentDoc.enrollmentData,
          id: doc.id
        });
        userIds.push(enrollmentDoc.enrollmentData.userId);
      }
    }

    // Sort enrollments by updatedAt (most recent first)
    enrollments.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    // Get related data
    const [studentProfiles, studentDocuments, subjects, subjectSets, grades] = await Promise.all([
      getStudentProfiles(userIds, baseUrl),
      getStudentDocuments(userIds, baseUrl),
      getSubjects(baseUrl),
      getSubjectSets(baseUrl),
      getGrades(baseUrl)
    ]);

    // Group subject sets by grade level
    const subjectSetsByGrade: Record<number, any[]> = {};
    subjectSets.forEach((subjectSet: any) => {
      const gradeLevel = subjectSet.gradeLevel;
      if (!subjectSetsByGrade[gradeLevel]) {
        subjectSetsByGrade[gradeLevel] = [];
      }
      subjectSetsByGrade[gradeLevel].push(subjectSet);
    });

    // Create subjects map
    const subjectsMap: Record<string, any> = {};
    subjects.forEach((subject: any) => {
      subjectsMap[subject.id] = subject;
    });

    // Create grades map
    const gradesMap: Record<string, any> = {};
    grades.forEach((grade: any) => {
      gradesMap[grade.id] = grade;
    });

    return NextResponse.json({
      enrollments,
      studentProfiles,
      studentDocuments,
      subjects: subjectsMap,
      subjectSets: subjectSetsByGrade,
      grades: gradesMap,
      totalEnrollments: enrollments.length,
      totalStudents: userIds.length
    });

  } catch (error) {
    console.error('Error fetching enrollment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment data' },
      { status: 500 }
    );
  }
}
