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

// Helper function to get sections
async function getSections(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/sections`);
    const data = await response.json();

    if (response.ok && data.sections) {
      return data.sections;
    }
    return [];
  } catch (error) {
    console.error('Error loading sections:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const name = searchParams.get('name');
    const gradeLevel = searchParams.get('gradeLevel');
    const status = searchParams.get('status');

    // Get base URL from request
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    const ayCode = await getCurrentAYCode(baseUrl);

    // Get only enrolled students for current academic year (or filtered)
    const enrollmentsRef = collection(db, 'enrollments');
    let q;

    if (status) {
      q = query(
        enrollmentsRef,
        where('ayCode', '==', ayCode),
        where('enrollmentData.enrollmentInfo.status', '==', status)
      );
    } else {
      q = query(
        enrollmentsRef,
        where('ayCode', '==', ayCode),
        where('enrollmentData.enrollmentInfo.status', '==', 'enrolled')
      );
    }

    const snapshot = await getDocs(q);

    const enrolledStudents: any[] = [];
    const userIds: string[] = [];

    for (const doc of snapshot.docs) {
      const enrollmentDoc = doc.data();
      if (enrollmentDoc.enrollmentData) {
        const student = {
          ...enrollmentDoc.enrollmentData,
          id: doc.id
        };

        // Apply additional filters if specified
        let includeStudent = true;

        if (studentId && student.userId !== studentId) {
          includeStudent = false;
        }

        if (name && includeStudent) {
          const fullName = `${student.personalInfo?.firstName || ''} ${student.personalInfo?.middleName || ''} ${student.personalInfo?.lastName || ''}`.toLowerCase();
          if (!fullName.includes(name.toLowerCase())) {
            includeStudent = false;
          }
        }

        if (gradeLevel && includeStudent) {
          if (student.enrollmentInfo?.gradeLevel !== gradeLevel) {
            includeStudent = false;
          }
        }

        if (includeStudent) {
          enrolledStudents.push(student);
          userIds.push(student.userId);
        }
      }
    }

    // Sort enrolled students by updatedAt (most recent first)
    enrolledStudents.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    // Get related data
    const [studentProfiles, studentDocuments, subjects, subjectSets, grades, sections] = await Promise.all([
      getStudentProfiles(userIds, baseUrl),
      getStudentDocuments(userIds, baseUrl),
      getSubjects(baseUrl),
      getSubjectSets(baseUrl),
      getGrades(baseUrl),
      getSections(baseUrl)
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

    // Group sections by grade level
    const sectionsByGrade: Record<string, any[]> = {};
    sections.forEach((section: any) => {
      const gradeLevel = section.grade.replace('Grade ', '');
      if (!sectionsByGrade[gradeLevel]) {
        sectionsByGrade[gradeLevel] = [];
      }
      sectionsByGrade[gradeLevel].push(section);
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
      enrolledStudents,
      studentProfiles,
      studentDocuments,
      subjects: subjectsMap,
      subjectSets: subjectSetsByGrade,
      grades: gradesMap,
      sections: sectionsByGrade,
      totalEnrolledStudents: enrolledStudents.length,
      gradeDistribution: enrolledStudents.reduce((acc: Record<string, number>, student) => {
        const grade = student.enrollmentInfo?.gradeLevel || 'Unknown';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {}),
      statusDistribution: enrolledStudents.reduce((acc: Record<string, number>, student) => {
        const status = student.enrollmentInfo?.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Error fetching student data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student data' },
      { status: 500 }
    );
  }
}
