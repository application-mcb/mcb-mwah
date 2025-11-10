import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-server';

const METADATA_FIELDS = new Set([
  'studentName',
  'studentSection',
  'studentLevel',
  'studentSemester',
  'createdAt',
  'updatedAt',
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ayCode = searchParams.get('ayCode');
    const yearLevel = searchParams.get('yearLevel');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // If ayCode not provided, return list of available periods
    if (!ayCode) {
      const subcolRef = collection(db, 'students', userId, 'studentGrades');
      const snap = await getDocs(subcolRef);
      
      const periods = await Promise.all(
        snap.docs.map(async (d) => {
          const gradesData = d.data();
          const metadata: Record<string, any> = {};
          
          if (gradesData.studentName !== undefined) metadata.studentName = gradesData.studentName;
          if (gradesData.studentSection !== undefined) metadata.studentSection = gradesData.studentSection;
          if (gradesData.studentLevel !== undefined) metadata.studentLevel = gradesData.studentLevel;
          if (gradesData.studentSemester !== undefined) metadata.studentSemester = gradesData.studentSemester;

          return {
            id: d.id,
            label: d.id,
            ayCode: d.id,
            metadata,
          };
        })
      );

      // Filter by yearLevel if provided
      let filteredPeriods = periods;
      if (yearLevel) {
        const yearLevelLower = yearLevel.toLowerCase().trim();
        filteredPeriods = periods.filter((period) => {
          const level = period.metadata?.studentLevel || '';
          const levelStr = String(level).toLowerCase();
          
          // More flexible matching patterns
          const patterns = [
            yearLevelLower, // Direct match
            `grade ${yearLevelLower}`, // "grade 7"
            `${yearLevelLower} grade`, // "7 grade"
            `grade${yearLevelLower}`, // "grade7"
            `${yearLevelLower}th grade`, // "7th grade"
            `${yearLevelLower} year`, // "first year"
            `year ${yearLevelLower}`, // "year 1"
            `${yearLevelLower}st year`, // "1st year"
            `${yearLevelLower}nd year`, // "2nd year"
            `${yearLevelLower}rd year`, // "3rd year"
            `${yearLevelLower}th year`, // "4th year"
          ];
          
          // Check if any pattern matches
          return patterns.some(pattern => levelStr.includes(pattern));
        });
      }

      // Sort newest first
      filteredPeriods.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));

      return NextResponse.json({
        periods: filteredPeriods,
        count: filteredPeriods.length,
      });
    }

    // Get specific grades for the ayCode
    const gradesRef = doc(db, 'students', userId, 'studentGrades', ayCode);
    const gradesSnap = await getDoc(gradesRef);

    if (!gradesSnap.exists()) {
      return NextResponse.json({
        grades: {},
        ayCode,
        metadata: {},
        message: 'No grades found for this academic year',
      });
    }

    const gradesData = gradesSnap.data();

    // Separate metadata from grades
    const { createdAt, updatedAt, studentName, studentSection, studentLevel, studentSemester, ...grades } = gradesData;
    const metadata: Record<string, any> = {};

    if (studentName !== undefined) metadata.studentName = studentName;
    if (studentSection !== undefined) metadata.studentSection = studentSection;
    if (studentLevel !== undefined) metadata.studentLevel = studentLevel;
    if (studentSemester !== undefined) metadata.studentSemester = studentSemester;

    // Filter out metadata fields from grades object
    const filteredGrades: Record<string, any> = {};
    Object.entries(grades).forEach(([key, value]) => {
      if (!METADATA_FIELDS.has(key)) {
        filteredGrades[key] = value;
      }
    });

    return NextResponse.json({
      grades: filteredGrades,
      ayCode,
      metadata,
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch student grades';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

