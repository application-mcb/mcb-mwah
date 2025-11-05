import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { subjectName, subjectCode, selectedSubjects } = await request.json();

    if (!subjectName && !subjectCode) {
      return NextResponse.json({ error: 'Subject name or code is required' }, { status: 400 });
    }

    // Initialize Gemini 2.0 Flash-Lite model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite'
    });

    // Build prompt based on whether this is a subject set or individual subject
    let prompt = '';
    
    if (selectedSubjects && Array.isArray(selectedSubjects) && selectedSubjects.length > 0) {
      // This is a subject set - include selected subjects
      const subjectsList = selectedSubjects.join(', ');
      prompt = `Generate a concise description for a subject set named "${subjectName || subjectCode}" that includes the following subjects: ${subjectsList}. The description should be exactly 30 words. The description should:
- Explain what this subject set covers
- Mention the included subjects and their educational purpose
- Be suitable for an academic subject set in a college/high school setting
- Be professional and educational

Subject Set Name: ${subjectName || subjectCode}
Included Subjects: ${subjectsList}

Generate ONLY the description text, nothing else. Exactly 30 words.`;
    } else {
      // This is an individual subject
      prompt = `Generate a concise subject description for "${subjectName || subjectCode}" in exactly 30 words or less. The description should be:
- Clear and informative
- Suitable for an academic subject in a college/high school setting
- Professional and educational
- Focus on what students will learn or cover

Subject: ${subjectName || subjectCode}
Code: ${subjectCode || 'N/A'}

Generate ONLY the description text, nothing else. Maximum 30 words.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return NextResponse.json({ description: text });

  } catch (error) {
    console.error('AI Description Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}

