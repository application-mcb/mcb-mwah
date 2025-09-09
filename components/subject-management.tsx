'use client';

import { useState, useEffect, useMemo } from 'react';
import SubjectForm from '@/components/subject-form';
import SubjectList from '@/components/subject-list';
import { LoaderOverlay } from '@/components/loader-overlay';
import { SubjectData, SubjectColor } from '@/lib/subject-database';
import { GradeData } from '@/lib/grade-section-database';
import { useAuth } from '@/lib/auth-context';
import { Trash, X, Warning, Check, Eye, BookOpen } from '@phosphor-icons/react';

interface SubjectManagementProps {
  registrarUid: string;
}

export default function SubjectManagement({ registrarUid }: SubjectManagementProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectData | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSubject, setViewingSubject] = useState<SubjectData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | undefined>(undefined);
  const [grades, setGrades] = useState<GradeData[]>([]);
  const { user } = useAuth();

  // Load subjects and grades on component mount
  useEffect(() => {
    loadSubjects();
    loadGrades();
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

  // Handle grade level selection/deselection
  const handleGradeLevelChange = (gradeLevel: number | undefined) => {
    setSelectedGradeLevel(gradeLevel);
  };


  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/subjects');

      if (!response.ok) {
        throw new Error('Failed to load subjects');
      }

      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error: any) {
      setError('Failed to load subjects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      const response = await fetch('/api/grades');
      if (response.ok) {
        const data = await response.json();
        setGrades(data.grades || []);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const handleCreateSubject = async (subjectData: { name: string; description: string; gradeLevel: number; color: SubjectColor; lectureUnits: number; labUnits: number }) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subjectData,
          registrarUid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subject');
      }

      setSubjects(prev => [...prev, data.subject]);
      setSuccess('Subject created successfully!');
      setShowCreateModal(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubject = async (subjectData: { name: string; description: string; gradeLevel: number; color: SubjectColor; lectureUnits: number; labUnits: number }) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      if (!editingSubject) return;

      const response = await fetch(`/api/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subjectData,
          registrarUid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subject');
      }

      setSubjects(prev =>
        prev.map(subject =>
          subject.id === editingSubject.id ? data.subject : subject
        )
      );
      setSuccess('Subject updated successfully!');
      setShowEditModal(false);
      setEditingSubject(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubject = (subject: SubjectData) => {
    setDeletingSubject(subject);
    setShowDeleteModal(true);
    setCountdown(5);
    setIsConfirmed(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSubject) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/subjects/${deletingSubject.id}?registrarUid=${registrarUid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete subject');
      }

      setSubjects(prev => prev.filter(s => s.id !== deletingSubject.id));
      setSuccess(`Subject "${deletingSubject.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setDeletingSubject(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete subject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
    setEditingSubject(null);
    setError('');
    setSuccess('');
  };

  const handleEditSubject = (subject: SubjectData) => {
    setEditingSubject({
      ...subject,
      gradeLevel: subject.gradeLevel.toString(),
      lectureUnits: subject.lectureUnits.toString(),
      labUnits: subject.labUnits.toString()
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleViewSubject = (subject: SubjectData) => {
    setViewingSubject(subject);
    setShowViewModal(true);
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setEditingSubject(null);
    setDeletingSubject(null);
    setViewingSubject(null);
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
      <div className="p-6">
        {renderMessages()}

        <SubjectList
          subjects={subjects}
          grades={grades}
          onEditSubject={handleEditSubject}
          onDeleteSubject={handleDeleteSubject}
          onViewSubject={handleViewSubject}
          onCreateNew={handleCreateNew}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalSubjectsCount={subjects.length}
          selectedGradeLevel={selectedGradeLevel}
          onGradeLevelChange={handleGradeLevelChange}
        />
      </div>

      {/* Create Subject Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <SubjectForm
              onSubmit={handleCreateSubject}
              onCancel={handleCancel}
              initialData={undefined}
              isEditing={false}
              loading={actionLoading}
            />
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {showEditModal && editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <SubjectForm
              onSubmit={handleUpdateSubject}
              onCancel={handleCancel}
              initialData={editingSubject}
              isEditing={true}
              loading={actionLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Subject Modal */}
      {showDeleteModal && deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <div className="bg-white shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
                    <Warning size={20} className="text-red-600" weight="fill" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    Delete Subject
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-50 border-l-5 border-red-600">
                  <p className="text-sm text-red-800 font-medium mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    You are about to delete:
                  </p>
                  <p className="text-sm text-red-700 font-semibold" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    {deletingSubject.name} (Grade {deletingSubject.gradeLevel})
                  </p>
                  <p className="text-xs text-red-600 mt-2" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    This action cannot be undone and will permanently remove the subject from the system.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="confirm-delete"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={actionLoading}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={countdown > 0 || !isConfirmed || actionLoading}
                  className={`px-4 py-2 text-sm font-medium text-white transition-colors ${
                    countdown > 0 || !isConfirmed || actionLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash size={16} className="mr-2 inline" />
                      Delete Subject {countdown > 0 && `(${countdown})`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Subject Details Modal */}
      {showViewModal && viewingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <div className="bg-white shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-${viewingSubject.color} flex items-center justify-center`}>
                    <BookOpen size={20} className="text-white" weight="fill" />
                  </div>
                  <h3
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Subject Details
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={actionLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Subject Name and Grade Level */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Subject Name
                    </label>
                    <div className={`px-3 py-2 bg-gray-100 border-l-5 border-blue-900`}>
                      <span
                        className="text-sm text-gray-900 font-medium"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {viewingSubject.name}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Grade Level
                    </label>
                    <div className={`px-3 py-2 bg-gray-100 border-l-5 border-blue-900`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Grade {viewingSubject.gradeLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject Description */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Description
                  </label>
                  <div className={`px-4 py-3 bg-gray-100 border-l-5 border-blue-900 min-h-[120px]`}>
                    <p
                      className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {viewingSubject.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Subject Color, Units, and Metadata */}
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
                        className={`w-10 h-10 max-h-10 flex items-center justify-center bg-${viewingSubject.color}`}
                      >
                        <BookOpen size={16} className="text-white" weight="fill" />
                      </div>
                      <span
                        className="text-sm text-gray-700 capitalize"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {viewingSubject.color.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Units
                    </label>
                    <div className={`px-3 py-2 bg-gray-100 border-l-5 border-blue-900`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {viewingSubject.totalUnits} unit{viewingSubject.totalUnits !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Created Date
                    </label>
                    <div className={`px-3 py-2 bg-gray-100 border-l-5 border-blue-900`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {new Date(viewingSubject.createdAt).toLocaleDateString('en-US', {
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
        message="Processing subject..."
      />
    </>
  );
}
