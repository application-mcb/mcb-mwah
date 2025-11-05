'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import SubjectSetForm from '@/components/subject-set-form';
import { LoaderOverlay } from '@/components/loader-overlay';
import { SubjectSetData, SubjectData } from '@/lib/subject-database';
import { useAuth } from '@/lib/auth-context';
import { Trash, X, Warning, Check, Eye, BookOpen, Plus, Pencil } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SubjectSetManagementProps {
  registrarUid: string;
}

// Helper function to get actual color value from subject set color
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-700': '#1e40af',
    'blue-800': '#1e3a8a',
    'red-700': '#b91c1c',
    'red-800': '#991b1b',
    'emerald-700': '#047857',
    'emerald-800': '#065f46',
    'yellow-700': '#a16207',
    'yellow-800': '#92400e',
    'orange-700': '#c2410c',
    'orange-800': '#9a3412',
    'violet-700': '#7c3aed',
    'violet-800': '#5b21b6',
    'purple-700': '#8b5cf6',
    'purple-800': '#6b21a8',
    'indigo-700': '#4338ca',
    'indigo-800': '#312e81'
  };
  return colorMap[color] || '#1e3a8a'; // Default to blue-800 if color not found
};

const colorMap = {
  'blue-700': { bg: 'bg-blue-700', name: 'Blue 700' },
  'blue-800': { bg: 'bg-blue-800', name: 'Blue 800' },
  'red-700': { bg: 'bg-red-700', name: 'Red 700' },
  'red-800': { bg: 'bg-red-800', name: 'Red 800' },
  'emerald-700': { bg: 'bg-emerald-700', name: 'Emerald 700' },
  'emerald-800': { bg: 'bg-emerald-800', name: 'Emerald 800' },
  'yellow-700': { bg: 'bg-yellow-700', name: 'Yellow 700' },
  'yellow-800': { bg: 'bg-yellow-800', name: 'Yellow 800' },
  'orange-700': { bg: 'bg-orange-700', name: 'Orange 700' },
  'orange-800': { bg: 'bg-orange-800', name: 'Orange 800' },
  'violet-700': { bg: 'bg-violet-700', name: 'Violet 700' },
  'violet-800': { bg: 'bg-violet-800', name: 'Violet 800' },
  'purple-700': { bg: 'bg-purple-700', name: 'Purple 700' },
  'purple-800': { bg: 'bg-purple-800', name: 'Purple 800' },
  'indigo-700': { bg: 'bg-indigo-700', name: 'Indigo 700' },
  'indigo-800': { bg: 'bg-indigo-800', name: 'Indigo 800' },
};

export default function SubjectSetManagement({ registrarUid }: SubjectSetManagementProps) {
  const [subjectSets, setSubjectSets] = useState<SubjectSetData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSubjectSet, setEditingSubjectSet] = useState<SubjectSetData | null>(null);
  const [deletingSubjectSet, setDeletingSubjectSet] = useState<SubjectSetData | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSubjectSet, setViewingSubjectSet] = useState<SubjectSetData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | null>(null);
  const { user } = useAuth();

  // Load subject sets and subjects on component mount
  useEffect(() => {
    loadSubjectSets();
    loadSubjects();
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

  const loadSubjectSets = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/subject-sets');

      if (!response.ok) {
        throw new Error('Failed to load subject sets');
      }

      const data = await response.json();
      setSubjectSets(data.subjectSets || []);
    } catch (error: any) {
      setError('Failed to load subject sets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error);
    }
  };

  // Filter subject sets based on search query and grade level
  const filteredSubjectSets = useMemo(() => {
    let filtered = subjectSets;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter((subjectSet) => (
        subjectSet.name.toLowerCase().includes(searchTerm) ||
        subjectSet.description.toLowerCase().includes(searchTerm)
      ));
    }

    // Apply grade level filter
    if (selectedGradeLevel) {
      filtered = filtered.filter((subjectSet) => subjectSet.gradeLevel === selectedGradeLevel);
    }

    return filtered;
  }, [subjectSets, searchQuery, selectedGradeLevel]);

  const handleCreateSubjectSet = async (subjectSetData: { name: string; description: string; gradeLevels: number[]; courseSelections: { code: string; year: number; semester: 'first-sem' | 'second-sem' }[]; color: any; subjects: string[] }) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/subject-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subjectSetData,
          registrarUid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subject set');
      }

      setSubjectSets(prev => [...prev, data.subjectSet]);
      setSuccess('Subject set created successfully!');
      setShowCreateModal(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubjectSet = async (subjectSetData: { name: string; description: string; gradeLevels: number[]; courseSelections: { code: string; year: number; semester: 'first-sem' | 'second-sem' }[]; color: any; subjects: string[] }) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      if (!editingSubjectSet) return;

      const response = await fetch(`/api/subject-sets/${editingSubjectSet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subjectSetData,
          registrarUid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subject set');
      }

      setSubjectSets(prev =>
        prev.map(subjectSet =>
          subjectSet.id === editingSubjectSet.id ? data.subjectSet : subjectSet
        )
      );
      setSuccess('Subject set updated successfully!');
      setShowEditModal(false);
      setEditingSubjectSet(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubjectSet = (subjectSet: SubjectSetData) => {
    setDeletingSubjectSet(subjectSet);
    setShowDeleteModal(true);
    setCountdown(5);
    setIsConfirmed(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSubjectSet) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/subject-sets/${deletingSubjectSet.id}?registrarUid=${registrarUid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete subject set');
      }

      setSubjectSets(prev => prev.filter(s => s.id !== deletingSubjectSet.id));
      toast.success(`Subject set "${deletingSubjectSet.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setDeletingSubjectSet(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject set');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
    setEditingSubjectSet(null);
    setError('');
    setSuccess('');
  };

  const handleEditSubjectSet = (subjectSet: SubjectSetData) => {
    setEditingSubjectSet(subjectSet);
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleViewSubjectSet = (subjectSet: SubjectSetData) => {
    setViewingSubjectSet(subjectSet);
    setShowViewModal(true);
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setEditingSubjectSet(null);
    setDeletingSubjectSet(null);
    setViewingSubjectSet(null);
    setCountdown(5);
    setIsConfirmed(false);
    setError('');
    setSuccess('');
  };

  const getSubjectDetails = (subjectId: string) => {
    return subjects.find(subject => subject.id === subjectId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGradeLevel(null);
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

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
              <BookOpen size={20} className="text-white" weight="fill" />
            </div>
            <div>
              <h1
                className="text-2xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Subject Set Management
              </h1>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Create and manage groups of related subjects
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateNew}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <Plus size={16} className="mr-2" />
            Create Subject Set
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search subject sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <select
                value={selectedGradeLevel || ''}
                onChange={(e) => setSelectedGradeLevel(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                <option value="">All Grades</option>
                {[7, 8, 9, 10, 11, 12].map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>

            {(searchQuery || selectedGradeLevel) && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
          <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Showing {filteredSubjectSets.length} of {subjectSets.length} subject sets
          </span>
        </div>

        {/* Subject Sets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 bg-gray-50 border-0 border-r-0 border-b-0">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredSubjectSets.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" weight="duotone" />
            <h3
              className="text-lg font-medium text-gray-900 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              No subject sets found
            </h3>
            <p
              className="text-sm text-gray-600 mb-6"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {searchQuery || selectedGradeLevel
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first subject set'
              }
            </p>
            <Button
              onClick={handleCreateNew}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <Plus size={16} className="mr-2" />
              Create Subject Set
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjectSets.map((subjectSet) => (
              <Card
                key={subjectSet.id}
                className={`group p-6 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm bg-${subjectSet.color} text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4`}
              >
                <div className="space-y-4 flex flex-col justify-between h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">

                      <div className={`w-10 h-10 bg-white flex items-center justify-center` }>
                        <BookOpen size={20} style={{ color: getColorValue(subjectSet.color) }} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-medium text-white truncate"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {subjectSet.name}
                        </h3>
                        <p
                          className="text-sm text-white/90"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {(() => {
                            // Check if this is a college subject set (has courseSelections)
                            if (subjectSet.courseSelections && Array.isArray(subjectSet.courseSelections) && subjectSet.courseSelections.length > 0) {
                              // Extract unique course codes
                              const uniqueCourseCodes = Array.from(new Set(subjectSet.courseSelections.map(sel => sel.code)));
                              return `${uniqueCourseCodes.join(', ')} • ${subjectSet.subjects.length} subject${subjectSet.subjects.length !== 1 ? 's' : ''}`;
                            }
                            // Check if this is a high school subject set (has gradeLevels)
                            else if (subjectSet.gradeLevels && Array.isArray(subjectSet.gradeLevels) && subjectSet.gradeLevels.length > 0) {
                              const gradeLabels = subjectSet.gradeLevels.map(level => `Grade ${level}`).join(', ');
                              return `${gradeLabels} • ${subjectSet.subjects.length} subject${subjectSet.subjects.length !== 1 ? 's' : ''}`;
                            }
                            // Fallback to deprecated gradeLevel field
                            else {
                              return `Grade ${subjectSet.gradeLevel || 7} • ${subjectSet.subjects.length} subject${subjectSet.subjects.length !== 1 ? 's' : ''}`;
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm text-white/80 line-clamp-3"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {subjectSet.description}
                  </p>

                  {/* Subjects Preview */}
                  <div className="space-y-2">
                    <p
                      className="text-xs font-medium text-white/90 uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Subjects in this set:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {subjectSet.subjects.slice(0, 3).map((subjectId) => {
                        const subject = getSubjectDetails(subjectId);
                        return (
                          <span
                            key={subjectId}
                            className="inline-flex items-center px-2 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {subject?.name || 'Unknown Subject'}
                          </span>
                        );
                      })}
                      {subjectSet.subjects.length > 3 && (
                        <span
                          className="inline-flex items-center px-2 py-1 bg-white/30 text-white text-xs rounded-full border border-white/40"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          +{subjectSet.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2 pt-2 border-t border-white/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSubjectSet(subjectSet)}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSubjectSet(subjectSet)}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubjectSet(subjectSet)}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Subject Set Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <SubjectSetForm
              onSubmit={handleCreateSubjectSet}
              onCancel={handleCancel}
              initialData={undefined}
              isEditing={false}
              loading={actionLoading}
            />
          </div>
        </div>
      )}

      {/* Edit Subject Set Modal */}
      {showEditModal && editingSubjectSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <SubjectSetForm
              onSubmit={handleUpdateSubjectSet}
              onCancel={handleCancel}
              initialData={editingSubjectSet}
              isEditing={true}
              loading={actionLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Subject Set Modal */}
      {showDeleteModal && deletingSubjectSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <div className="bg-white shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
                    <Warning size={20} className="text-red-600" weight="fill" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    Delete Subject Set
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
                <div className="p-4 bg-red-50 border-1 shadow-sm border-red-600">
                  <p className="text-sm text-red-800 font-medium mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    You are about to delete:
                  </p>
                  <p className="text-sm text-red-700 font-semibold" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    {deletingSubjectSet.name}
                  </p>
                  <p className="text-xs text-red-600 mt-2" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    This action cannot be undone and will permanently remove the subject set from the system.
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
                      Delete Subject Set {countdown > 0 && `(${countdown})`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Subject Set Details Modal */}
      {showViewModal && viewingSubjectSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !actionLoading && handleCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <div className="bg-white shadow-lg max-w-4xl h-[80vh] overflow-auto w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${colorMap[viewingSubjectSet.color]?.bg || 'bg-gray-400'} flex items-center justify-center`}>
                    <BookOpen size={20} className='text-white' weight="fill" />
                  </div>
                  <h3
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Subject Set Details
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
                {/* Subject Set Name and Grade Level */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Subject Set Name
                    </label>
                    <div className={`px-3 py-2 bg-gray-100 border-1 shadow-sm border-blue-900`}>
                      <span
                        className="text-sm text-gray-900 font-medium"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {viewingSubjectSet.name}
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
                    <div className={`px-3 py-2 bg-gray-100 border-1 shadow-sm border-blue-900`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Grade {viewingSubjectSet.gradeLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject Set Description */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Description
                  </label>
                  <div className={`px-4 py-3 bg-gray-100 border-1 shadow-sm border-blue-900 min-h-[120px]`}>
                    <p
                      className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {viewingSubjectSet.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Subjects in the Set */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-3"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Subjects in this Set ({viewingSubjectSet.subjects.length})
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingSubjectSet.subjects.map((subjectId) => {
                      const subject = getSubjectDetails(subjectId);
                      return (
                        <div
                          key={subjectId}
                          className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 "
                        >
                          <div className={`w-8 h-8 ${subject ? `bg-${subject.color}` : 'bg-gray-400'} flex items-center justify-center`}>
                            <BookOpen size={14} className="text-white" weight="fill" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium text-gray-900 truncate"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {subject?.name || 'Unknown Subject'}
                            </p>
                            <p
                              className="text-xs text-gray-600"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {subject ? `${subject.totalUnits} unit${subject.totalUnits !== 1 ? 's' : ''}` : 'Subject details unavailable'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subject Set Color and Metadata */}
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
                        className={`w-10 h-10 max-h-10 flex items-center justify-center ${colorMap[viewingSubjectSet.color]?.bg || 'bg-gray-400'}`}
                      >
                        <BookOpen size={16} className="text-white" weight="fill" />
                      </div>
                      <span
                        className="text-sm text-gray-700 capitalize"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {viewingSubjectSet.color.replace('-', ' ')}
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
                    <div className={`px-3 py-2 bg-gray-100 border-1 shadow-sm border-blue-900`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {new Date(viewingSubjectSet.createdAt).toLocaleDateString('en-US', {
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
                    <div className={`px-3 py-2 bg-gray-100 border-1 shadow-sm border-blue-900`}>
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {new Date(viewingSubjectSet.updatedAt).toLocaleDateString('en-US', {
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
        message="Processing subject set..."
      />
    </>
  );
}
