'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import CourseForm from '@/components/course-form';
import CourseList from '@/components/course-list';
import { LoaderOverlay } from '@/components/loader-overlay';
import { Modal } from '@/components/ui/modal';
import { CourseData, CourseColor } from '@/lib/types/course';
import { useAuth } from '@/lib/auth-context';
import { Trash, X, Warning, Check, Eye, GraduationCap } from '@phosphor-icons/react';

interface CourseManagementProps {
  registrarUid: string;
}

export default function CourseManagement({ registrarUid }: CourseManagementProps) {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseData | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<CourseData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const { user } = useAuth();

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Countdown timer for delete confirmation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showDeleteModal && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showDeleteModal, countdown]);

  // Filter courses based on search query and selected colors
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter((course) => (
        course.code.toLowerCase().includes(searchTerm) ||
        course.name.toLowerCase().includes(searchTerm) ||
        (course.description && course.description.toLowerCase().includes(searchTerm))
      ));
    }

    // Apply color filter (if colors are selected)
    if (selectedColors.length > 0) {
      filtered = filtered.filter((course) => selectedColors.includes(course.color));
    }

    return filtered;
  }, [courses, searchQuery, selectedColors]);

  // Handle color selection/deselection
  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => {
      if (prev.includes(color)) {
        return prev.filter(c => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/courses');

      if (!response.ok) {
        throw new Error('Failed to load courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error: any) {
      setError('Failed to load courses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (courseData: { code: string; name: string; description: string; color: CourseColor }) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...courseData,
          registrarUid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      setCourses(prev => [...prev, data.course]);
      setSuccess('Course created successfully!');
      setShowCreateModal(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCourse = async (courseData: { code: string; name: string; description: string; color: CourseColor }) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/courses/${courseData.code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: courseData.name,
          description: courseData.description,
          color: courseData.color,
          registrarUid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update course');
      }

      setCourses(prev =>
        prev.map(course =>
          course.code === courseData.code ? data.course : course
        )
      );
      setSuccess('Course updated successfully!');
      setShowEditModal(false);
      setEditingCourse(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = (course: CourseData) => {
    setDeletingCourse(course);
    setShowDeleteModal(true);
    setCountdown(5);
    setIsConfirmed(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/courses/${deletingCourse.code}?registrarUid=${registrarUid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete course');
      }

      setCourses(prev => prev.filter(c => c.code !== deletingCourse.code));
      toast.success(`Course "${deletingCourse.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setDeletingCourse(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
    setEditingCourse(null);
    setError('');
    setSuccess('');
  };

  const handleEditCourse = (course: CourseData) => {
    setEditingCourse(course);
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleViewCourse = (course: CourseData) => {
    setViewingCourse(course);
    setShowViewModal(true);
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setEditingCourse(null);
    setDeletingCourse(null);
    setViewingCourse(null);
    setCountdown(5);
    setIsConfirmed(false);
    setError('');
    setSuccess('');
  };

  // Show success/error messages
  const renderMessages = () => {
    if (!error && !success) return null;

    return (
      <div className="mb-6">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p
                  className="text-sm text-red-800"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p
                  className="text-sm text-green-800"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {success}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="p-6 space-y-6 w-full max-w-full overflow-x-hidden">
        {renderMessages()}

        <CourseList
          courses={filteredCourses}
          onEditCourse={handleEditCourse}
          onDeleteCourse={handleDeleteCourse}
          onViewCourse={handleViewCourse}
          onCreateNew={handleCreateNew}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCoursesCount={courses.length}
          selectedColors={selectedColors}
          onColorToggle={handleColorToggle}
        />
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={handleCancel}
          title="Create New Course"
          size="lg"
        >
          <CourseForm
            onSubmit={handleCreateCourse}
            onCancel={handleCancel}
            initialData={undefined}
            isEditing={false}
            loading={actionLoading}
          />
        </Modal>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <Modal
          isOpen={showEditModal}
          onClose={handleCancel}
          title="Edit Course"
          size="lg"
        >
          <CourseForm
            onSubmit={handleUpdateCourse}
            onCancel={handleCancel}
            initialData={editingCourse}
            isEditing={true}
            loading={actionLoading}
          />
        </Modal>
      )}

      {/* Delete Course Modal */}
      {showDeleteModal && deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <div className="bg-white shadow-lg max-w-md w-full p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-700 to-red-800 rounded-xl flex items-center justify-center">
                    <Warning size={20} className="text-white" weight="fill" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    Delete Course
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white border-1 shadow-sm border-red-600 rounded-xl">
                  <p className="text-sm text-red-800 font-medium mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    You are about to delete:
                  </p>
                  <p className="text-sm text-red-700 font-semibold" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    {deletingCourse.name} ({deletingCourse.code})
                  </p>
                  <p className="text-xs text-red-600 mt-2" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    This action cannot be undone and will permanently remove the course from the system.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="confirm-delete"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 rounded"
                      disabled={countdown > 0}
                    />
                    <label
                      htmlFor="confirm-delete"
                      className={`text-sm ${countdown > 0 ? 'text-gray-400' : 'text-gray-700'}`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      I understand this action cannot be undone
                    </label>
                  </div>

                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors rounded-lg"
                  disabled={actionLoading}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={countdown > 0 || !isConfirmed || actionLoading}
                  className={`px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg ${
                    countdown > 0 || !isConfirmed || actionLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash size={16} className="mr-2 inline" />
                      Delete Course {countdown > 0 && `(${countdown})`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Course Details Modal */}
      {showViewModal && viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <div className="bg-white shadow-lg max-w-2xl w-full p-6 rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: viewingCourse.color === 'blue-900' 
                        ? 'linear-gradient(to bottom right, #1e3a8a, #1e40af)'
                        : viewingCourse.color === 'red-800'
                        ? 'linear-gradient(to bottom right, #991b1b, #b91c1c)'
                        : viewingCourse.color === 'emerald-800'
                        ? 'linear-gradient(to bottom right, #047857, #065f46)'
                        : viewingCourse.color === 'yellow-800'
                        ? 'linear-gradient(to bottom right, #a16207, #854d0e)'
                        : viewingCourse.color === 'orange-800'
                        ? 'linear-gradient(to bottom right, #c2410c, #9a3412)'
                        : viewingCourse.color === 'violet-800'
                        ? 'linear-gradient(to bottom right, #7c3aed, #6b21a8)'
                        : viewingCourse.color === 'purple-800'
                        ? 'linear-gradient(to bottom right, #7e22ce, #6b21a8)'
                        : 'linear-gradient(to bottom right, #1e3a8a, #1e40af)'
                    }}
                  >
                    <GraduationCap size={20} className="text-white" weight="fill" />
                  </div>
                  <h3
                    className="text-lg font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Course Details
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Course Code and Name */}
                <div className="flex flex-col gap-4">
                
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Course Code
                    </label>
                    <div className={`px-3 py-2 bg-white border-1 shadow-sm border-blue-900 rounded-lg`}>
                      <span
                        className="text-sm text-gray-900 font-medium"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {viewingCourse.code}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Course Name
                    </label>
                    <div className={`px-3 py-2 bg-white border-1 shadow-sm border-blue-900 rounded-lg`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {viewingCourse.name}
                      </span>
                    </div>
                  </div>
                
                </div>
                {/* Course Description */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Description
                  </label>
                  <div className={`px-4 py-3 bg-white border-1 shadow-sm border-blue-900 min-h-[120px] rounded-xl`}>
                    <p
                      className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {viewingCourse.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Course Color and Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Color Theme
                    </label>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-full p-3 flex items-center justify-center rounded-lg"
                        style={{
                          background: viewingCourse.color === 'blue-900' 
                            ? 'linear-gradient(to bottom right, #1e3a8a, #1e40af)'
                            : viewingCourse.color === 'red-800'
                            ? 'linear-gradient(to bottom right, #991b1b, #b91c1c)'
                            : viewingCourse.color === 'emerald-800'
                            ? 'linear-gradient(to bottom right, #047857, #065f46)'
                            : viewingCourse.color === 'yellow-800'
                            ? 'linear-gradient(to bottom right, #a16207, #854d0e)'
                            : viewingCourse.color === 'orange-800'
                            ? 'linear-gradient(to bottom right, #c2410c, #9a3412)'
                            : viewingCourse.color === 'violet-800'
                            ? 'linear-gradient(to bottom right, #7c3aed, #6b21a8)'
                            : viewingCourse.color === 'purple-800'
                            ? 'linear-gradient(to bottom right, #7e22ce, #6b21a8)'
                            : 'linear-gradient(to bottom right, #1e3a8a, #1e40af)'
                        }}
                      >
                        <p className="text-sm text-white capitalize" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          {viewingCourse.color.replace('-', ' ').replace('800', '').replace('900', '')}
                        </p>

                      </div>
                     
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Created Date
                    </label>
                    <div className={`px-3 py-2 bg-white border-1 shadow-sm border-blue-900 rounded-lg`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {new Date(viewingCourse.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Last Updated
                    </label>
                    <div className={`px-3 py-2 bg-white border-1 shadow-sm border-blue-900 rounded-lg`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {new Date(viewingCourse.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors rounded-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <LoaderOverlay
        isVisible={actionLoading}
        message="Processing course..."
      />
    </>
  );
}
