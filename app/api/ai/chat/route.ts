import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Define available tools for the AI agent
const tools = {
  functionDeclarations: [
    {
      name: 'get_enrollment_data',
      description: 'Get comprehensive enrollment data including all enrollments, student profiles, documents, subjects, and subject sets for the current academic year.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: []
      }
    },
    {
      name: 'get_student_data',
      description: 'Get data about enrolled students including profiles, documents, assigned subjects, and sections for the current academic year. Can filter by student ID, name (for natural language queries like "is there a student named X"), grade level, or status.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          studentId: {
            type: SchemaType.STRING,
            description: 'Specific student ID to get detailed information for. If not provided, returns all enrolled students.'
          },
          name: {
            type: SchemaType.STRING,
            description: 'Student name to search for (partial matches allowed)'
          },
          gradeLevel: {
            type: SchemaType.STRING,
            description: 'Grade level to filter students by (e.g., "7", "8", "9")'
          },
          status: {
            type: SchemaType.STRING,
            description: 'Enrollment status to filter by ("enrolled", "pending", "approved", "rejected")'
          }
        },
        required: []
      }
    },
    {
      name: 'get_teacher_data',
      description: 'Get teacher information including profiles, assignments, subjects taught, and sections managed.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          teacherId: {
            type: SchemaType.STRING,
            description: 'Specific teacher ID to get detailed information for. If not provided, returns all teachers.'
          }
        },
        required: []
      }
    },
    {
      name: 'search_enrollments',
      description: 'Search enrollments by student name, email, grade level, or status.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description: 'Search query to match against student names, emails, grade levels, or status'
          }
        },
        required: ['query']
      }
    }
  ]
} as any; // Temporary type assertion to bypass TypeScript issues

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize Gemini 2.0 Flash-Lite model with tools
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      tools: [tools]
    });

    // Create a system prompt for the registrar assistant
    const systemPrompt = `You are an intelligent AI assistant for the Marian College of Baliuag, Inc. registrar system. You have access to various tools that allow you to query and analyze data from the school's databases.

Available tools:
1. get_enrollment_data - Get comprehensive enrollment data for all students
2. get_student_data - Get data about enrolled students (can filter by ID, name, grade, or status)
3. get_teacher_data - Get teacher information and assignments
4. search_enrollments - Search enrollments by various criteria

When a user asks about enrollment statistics, student information, teacher assignments, or any data analysis, you should use the appropriate tools to gather the information before responding.

Always use tools when:
- Asking for enrollment counts or statistics
- Looking up specific student information (by ID or name)
- Getting details about multiple students or filtering by criteria
- Checking teacher assignments or schedules
- Analyzing enrollment trends or patterns
- Providing reports or summaries of data

The get_student_data tool is particularly flexible:
- No parameters: Returns all enrolled students
- studentId: Get a specific student by their user ID
- name: Search students by name (partial matches work)
- gradeLevel: Filter students by grade level
- status: Filter by enrollment status

IMPORTANT: For natural language queries about specific students, use the get_student_data tool with the name parameter:

Examples of queries that should trigger get_student_data with name parameter:
- "Is there a student named [Name]?"
- "Do we have a student called [Name]?"
- "Is [Name] enrolled?"
- "Tell me about student [Name]"
- "What do we know about [Name]?"
- "Show me information for [Name]"
- "Find student [Name]"
- "Look up [Name] in our records"
- "Is [Name] in our school?"

For these types of queries, you should:
1. Extract the name from the query
2. Use get_student_data(name: "[extracted name]")
3. Check if any students match
4. Provide a clear yes/no answer plus details if found

Context: ${context || 'General registrar assistance'}

User message: ${message}

IMPORTANT: If you need to use tools, make sure to call them in your response. The system will execute the tools and provide you with the results to include in your final answer.`;

    // Generate response
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;

    // Check if the response contains tool calls
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      // Execute the tool calls
      const toolResults = await executeToolCalls(functionCalls);

      // Generate final response with tool results
      const followUpPrompt = `Based on the tool execution results, please provide a comprehensive answer to the user's query.

Tool Results:
${JSON.stringify(toolResults, null, 2)}

Original user query: ${message}

Please provide a helpful, accurate response based on this data.`;

      const finalResult = await model.generateContent(followUpPrompt);
      const finalResponse = await finalResult.response;
      const text = finalResponse.text();

      return NextResponse.json({
        response: text,
        toolResults: toolResults
      });
    }

    // No tool calls needed, return regular response
    const text = response.text();
    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

// Execute tool calls and return results
async function executeToolCalls(functionCalls: any[]) {
  const results: any[] = [];

  for (const call of functionCalls) {
    const { name, args } = call;

    try {
      let result;

      switch (name) {
        case 'get_enrollment_data':
          result = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/enrollment-data`);
          const enrollmentData = await result.json();
          results.push({
            functionResponse: {
              name,
              response: enrollmentData
            }
          });
          break;

        case 'get_student_data':
          const studentParams = new URLSearchParams();
          if (args?.studentId) studentParams.append('studentId', args.studentId);
          if (args?.name) studentParams.append('name', args.name);
          if (args?.gradeLevel) studentParams.append('gradeLevel', args.gradeLevel);
          if (args?.status) studentParams.append('status', args.status);

          const studentUrl = studentParams.toString()
            ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/student-data?${studentParams.toString()}`
            : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/student-data`;

          result = await fetch(studentUrl);
          const studentData = await result.json();
          results.push({
            functionResponse: {
              name,
              response: studentData
            }
          });
          break;

        case 'get_teacher_data':
          const teacherId = args?.teacherId;
          const teacherUrl = teacherId
            ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/teacher-data?teacherId=${teacherId}`
            : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/teacher-data`;

          result = await fetch(teacherUrl);
          const teacherData = await result.json();
          results.push({
            functionResponse: {
              name,
              response: teacherData
            }
          });
          break;

        case 'search_enrollments':
          // For search functionality, we'll need to implement this in the enrollment data endpoint
          // For now, return a placeholder
          results.push({
            functionResponse: {
              name,
              response: { message: 'Search functionality not yet implemented' }
            }
          });
          break;

        default:
          results.push({
            functionResponse: {
              name,
              response: { error: `Unknown function: ${name}` }
            }
          });
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      results.push({
        functionResponse: {
          name,
          response: { error: `Failed to execute ${name}: ${error}` }
        }
      });
    }
  }

  return results;
}
