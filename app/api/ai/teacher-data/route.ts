import { NextRequest, NextResponse } from 'next/server';

// Helper function to get teachers
async function getTeachers(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/teachers`);
    const data = await response.json();

    if (response.ok && data.teachers) {
      return data.teachers;
    }
    return [];
  } catch (error) {
    console.error('Error loading teachers:', error);
    return [];
  }
}

// Helper function to get teacher assignments
async function getTeacherAssignments(teacherId: string, baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/teacher-assignments?teacherId=${encodeURIComponent(teacherId)}`);
    const data = await response.json();

    if (response.ok && data.assignments) {
      return data.assignments;
    }
    return {};
  } catch (error) {
    console.error('Error loading teacher assignments:', error);
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
    const teacherId = searchParams.get('teacherId');

    // Get base URL from request
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    if (teacherId) {
      // Get specific teacher data
      const teachers = await getTeachers(baseUrl);
      const teacher = teachers.find((t: any) => t.id === teacherId);

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      const [assignments, subjects, sections] = await Promise.all([
        getTeacherAssignments(teacherId, baseUrl),
        getSubjects(baseUrl),
        getSections(baseUrl)
      ]);

      // Create subjects map
      const subjectsMap: Record<string, any> = {};
      subjects.forEach((subject: any) => {
        subjectsMap[subject.id] = subject;
      });

      // Create sections map
      const sectionsMap: Record<string, any> = {};
      sections.forEach((section: any) => {
        sectionsMap[section.id] = section;
      });

      // Get assignment counts
      const subjectsCount = Object.keys(assignments).length;
      const sectionsCount = Object.values(assignments).reduce((total: number, sectionIds: any) => {
        if (Array.isArray(sectionIds)) {
          return total + sectionIds.length;
        }
        return total;
      }, 0);

      return NextResponse.json({
        teacher,
        assignments,
        subjects: subjectsMap,
        sections: sectionsMap,
        assignmentCounts: {
          subjects: subjectsCount,
          sections: sectionsCount
        }
      });
    } else {
      // Get all teachers data
      const teachers = await getTeachers(baseUrl);

      // Get assignment data for all teachers
      const teachersWithAssignments = await Promise.all(
        teachers.map(async (teacher: any) => {
          try {
            const assignments = await getTeacherAssignments(teacher.id, baseUrl);
            const subjectsCount = Object.keys(assignments).length;
            const sectionsCount = Object.values(assignments).reduce((total: number, sectionIds: any) => {
              if (Array.isArray(sectionIds)) {
                return total + sectionIds.length;
              }
              return total;
            }, 0);

            return {
              ...teacher,
              assignmentCounts: {
                subjects: subjectsCount,
                sections: sectionsCount
              }
            };
          } catch (error) {
            console.warn(`Failed to load assignments for teacher ${teacher.id}:`, error);
            return {
              ...teacher,
              assignmentCounts: {
                subjects: 0,
                sections: 0
              }
            };
          }
        })
      );

      // Get related data for context
      const [subjects, sections] = await Promise.all([
        getSubjects(baseUrl),
        getSections(baseUrl)
      ]);

      // Create subjects map
      const subjectsMap: Record<string, any> = {};
      subjects.forEach((subject: any) => {
        subjectsMap[subject.id] = subject;
      });

      // Create sections map
      const sectionsMap: Record<string, any> = {};
      sections.forEach((section: any) => {
        sectionsMap[section.id] = section;
      });

      // Calculate summary statistics
      const activeTeachers = teachersWithAssignments.filter((t: any) => t.status === 'active').length;
      const inactiveTeachers = teachersWithAssignments.filter((t: any) => t.status === 'inactive').length;
      const totalAssignments = teachersWithAssignments.reduce((total: number, teacher: any) => {
        return total + (teacher.assignmentCounts?.subjects || 0);
      }, 0);

      return NextResponse.json({
        teachers: teachersWithAssignments,
        subjects: subjectsMap,
        sections: sectionsMap,
        summary: {
          totalTeachers: teachersWithAssignments.length,
          activeTeachers,
          inactiveTeachers,
          totalAssignments
        }
      });
    }

  } catch (error) {
    console.error('Error fetching teacher data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher data' },
      { status: 500 }
    );
  }
}
