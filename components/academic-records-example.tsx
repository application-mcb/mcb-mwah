// Example usage of AcademicRecords component
// This shows how to integrate the academic records component into your app

import AcademicRecords from './academic-records';

// In a teacher dashboard or student profile page:
function TeacherDashboard() {
  const studentId = "student-user-id"; // Get from props or URL params
  const studentName = "John Doe"; // Optional - shows in header

  return (
    <div>
      <AcademicRecords
        userId={studentId}
        studentName={studentName}
      />
    </div>
  );
}

// In a student dashboard (for viewing their own grades):
function StudentDashboard() {
  const currentUserId = "current-logged-in-student-id";

  return (
    <div>
      <AcademicRecords
        userId={currentUserId}
        // studentName is optional - component will show generic text
      />
    </div>
  );
}

export { TeacherDashboard, StudentDashboard };
