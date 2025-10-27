'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import SubjectColorPicker from '@/components/subject-color-picker';
import { SubjectColor, SUBJECT_COLORS, SubjectData } from '@/lib/subject-database';
import { GradeData } from '@/lib/grade-section-database';
import { Plus, X, Pencil, Hash, BookOpen, FileText, Palette, Calculator, Check, Users } from '@phosphor-icons/react';

interface SubjectSetFormData {
  name: string;
  description: string;
  gradeLevels: number[]; // Array of grade levels (7, 8, 9, 10, 11, 12)
  courseSelections: { code: string; year: number; semester: 'first-sem' | 'second-sem' }[]; // College course selections with year and semester
  color: SubjectColor;
  subjects: string[]; // Array of subject IDs
}

interface SubjectSetFormErrors {
  name?: string;
  description?: string;
  gradeLevels?: string;
  courseSelections?: string;
  subjects?: string;
}

interface SubjectSetFormProps {
  onSubmit: (subjectSetData: SubjectSetFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<SubjectSetFormData>;
  isEditing?: boolean;
  loading?: boolean;
  onSubjectsRefresh?: () => void; // Callback to refresh subjects
}

interface SubjectSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: SubjectSetFormData;
  onFormDataChange: (field: keyof SubjectSetFormData, value: string | number | string[] | number[] | { code: string; year: number; semester: 'first-sem' | 'second-sem' }[]) => void;
  errors: SubjectSetFormErrors;
  grades: GradeData[];
  courses: any[];
  availableSubjects: SubjectData[];
  loadingGrades: boolean;
  loadingCourses: boolean;
  loadingSubjects: boolean;
  loading: boolean;
  isEditing: boolean;
  onLoadSubjects: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onSubjectsRefresh?: () => void;
}

function SubjectSelectionModal({
  isOpen,
  onClose,
  formData,
  onFormDataChange,
  errors,
  grades,
  courses,
  availableSubjects,
  loadingGrades,
  loadingCourses,
  loadingSubjects,
  loading,
  isEditing,
  onLoadSubjects,
  onSubmit,
  onCancel,
  onSubjectsRefresh
}: SubjectSelectionModalProps) {
  const getGradeDisplayName = (grade: GradeData) => {
    if (grade.department === 'SHS' && grade.strand) {
      return `Grade ${grade.gradeLevel} - ${grade.strand}`;
    }
    return `Grade ${grade.gradeLevel} (${grade.department})`;
  };

  const getSelectedSubjects = () => {
    return availableSubjects.filter(subject => formData.subjects.includes(subject.id));
  };

  const handleGradeLevelToggle = (gradeLevel: number) => {
    onFormDataChange('gradeLevels', formData.gradeLevels.includes(gradeLevel)
      ? formData.gradeLevels.filter(level => level !== gradeLevel)
      : [...formData.gradeLevels, gradeLevel]
    );
    // Clear error when user makes a selection
    if (errors.gradeLevels) {
      // Note: Error clearing would need to be handled by parent component
    }
  };

  const handleCourseSelectionToggle = (courseCode: string, year: number, semester: 'first-sem' | 'second-sem') => {
    const selection = { code: courseCode, year, semester };
    const selectionExists = formData.courseSelections.some(
      sel => sel.code === courseCode && sel.year === year && sel.semester === semester
    );

    if (selectionExists) {
      onFormDataChange('courseSelections',
        formData.courseSelections.filter(
          sel => !(sel.code === courseCode && sel.year === year && sel.semester === semester)
        )
      );
    } else {
      onFormDataChange('courseSelections', [...formData.courseSelections, selection]);
    }
    // Clear error when user makes a selection
    if (errors.courseSelections) {
      // Note: Error clearing would need to be handled by parent component
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    onFormDataChange('subjects', formData.subjects.includes(subjectId)
      ? formData.subjects.filter(id => id !== subjectId)
      : [...formData.subjects, subjectId]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subject Set' : 'Create New Subject Set'}
      size="full"
    >
      <div className="flex h-[75vh]">
        {/* Left Panel - Form Details (30%) */}
        <div className="w-[30%] p-6 bg-gray-50 border-r border-gray-200 overflow-y-auto">

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Subject Set Name */}
            <div className="space-y-2">
              <label
                htmlFor="modal-subject-set-name"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Subject Set Name *
              </label>
              <div className="relative">
                <Input
                  id="modal-subject-set-name"
                  type="text"
                  placeholder="e.g., Grade 10 Core Subjects"
                  value={formData.name}
                  onChange={(e) => onFormDataChange('name', e.target.value)}
                  disabled={loading}
                  className={`pl-10 border-1 shadow-xl border-blue-900 rounded-none ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <BookOpen
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  weight="duotone"
                />
              </div>
              {errors.name && (
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Grade Levels */}
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Applicable Grade Levels *
              </label>
              <div className="flex flex-wrap gap-2">
                {loadingGrades ? (
                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    Loading grade levels...
                  </div>
                ) : grades.length > 0 ? (
                  grades.map((grade) => {
                    const isSelected = formData.gradeLevels.includes(grade.gradeLevel);
                    return (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() => handleGradeLevelToggle(grade.gradeLevel)}
                        disabled={loading}
                        className={`px-3 py-2 text-sm font-medium rounded-full border-2 transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {getGradeDisplayName(grade)}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    No grade levels available
                  </div>
                )}
              </div>
              {formData.gradeLevels.length > 0 && (
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  Selected: {formData.gradeLevels.sort().map(level => {
                    const grade = grades.find(g => g.gradeLevel === level);
                    return grade ? getGradeDisplayName(grade) : `Grade ${level}`;
                  }).join(', ')}
                </p>
              )}
              {errors.gradeLevels && (
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.gradeLevels}
                </p>
              )}
            </div>

            {/* College Courses */}
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Applicable College Courses & Year Levels
              </label>
              <div className="space-y-3">
                {loadingCourses ? (
                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    Loading courses...
                  </div>
                ) : courses.length > 0 ? (
                  courses.map((course: any) => {
                    const courseColor = course.color || 'emerald-800';
                    return (
                      <div key={course.code} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 bg-${courseColor} rounded-full mr-2`}></div>
                            <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                              {course.code} - {course.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const allSelections = [];
                              for (let year = 1; year <= 4; year++) {
                                for (const semester of ['first-sem', 'second-sem'] as const) {
                                  allSelections.push({ code: course.code, year, semester });
                                }
                              }
                              // Check if all selections are already selected
                              const allSelected = allSelections.every(selection =>
                                formData.courseSelections.some(existing =>
                                  existing.code === selection.code &&
                                  existing.year === selection.year &&
                                  existing.semester === selection.semester
                                )
                              );

                              if (allSelected) {
                                // Deselect all
                                onFormDataChange('courseSelections',
                                  formData.courseSelections.filter(existing => existing.code !== course.code)
                                );
                              } else {
                                // Select all missing ones
                                const newSelections = allSelections.filter(selection =>
                                  !formData.courseSelections.some(existing =>
                                    existing.code === selection.code &&
                                    existing.year === selection.year &&
                                    existing.semester === selection.semester
                                  )
                                );
                                onFormDataChange('courseSelections', [...formData.courseSelections, ...newSelections]);
                              }
                            }}
                            disabled={loading}
                            className={`px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              (() => {
                                const allSelections = [];
                                for (let year = 1; year <= 4; year++) {
                                  for (const semester of ['first-sem', 'second-sem'] as const) {
                                    allSelections.push({ code: course.code, year, semester });
                                  }
                                }
                                const allSelected = allSelections.every(selection =>
                                  formData.courseSelections.some(existing =>
                                    existing.code === selection.code &&
                                    existing.year === selection.year &&
                                    existing.semester === selection.semester
                                  )
                                );
                                return allSelected
                                  ? `bg-${courseColor} text-white border border-${courseColor} hover:opacity-80`
                                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200';
                              })()
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            All
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[1, 2, 3, 4].map(year => (
                            <div key={year} className="space-y-1">
                              <span className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                                Year {year}
                              </span>
                              <div className="flex gap-1">
                                {(['first-sem', 'second-sem'] as const).map(semester => {
                                  const isSelected = formData.courseSelections.some(
                                    sel => sel.code === course.code && sel.year === year && sel.semester === semester
                                  );
                                  const semesterLabel = semester === 'first-sem' ? '1st Sem' : '2nd Sem';
                                  return (
                                    <button
                                      key={semester}
                                      type="button"
                                      onClick={() => handleCourseSelectionToggle(course.code, year, semester)}
                                      disabled={loading}
                                      className={`px-2 py-1 text-xs font-medium rounded border transition-all duration-200 ${
                                        isSelected
                                          ? `bg-${courseColor} text-white border-${courseColor} shadow-sm`
                                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                    >
                                      {semesterLabel}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    No courses available
                  </div>
                )}
              </div>
             
              {errors.courseSelections && (
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.courseSelections}
                </p>
              )}
            </div>


            {/* Subject Set Description */}
            <div className="space-y-2">
              <label
                htmlFor="modal-subject-set-description"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Description *
              </label>
              <div className="relative">
                <textarea
                  id="modal-subject-set-description"
                  placeholder="Describe this subject set..."
                  value={formData.description}
                  onChange={(e) => onFormDataChange('description', e.target.value)}
                  disabled={loading}
                  className={`border-1 shadow-xl border-blue-900 rounded-none flex min-h-[80px] w-full rounded-md bg-white pl-10 pr-3 py-2 text-base shadow-lg placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  maxLength={300}
                  rows={3}
                />
                <FileText
                  size={18}
                  className="absolute left-3 top-4 text-gray-400"
                  weight="duotone"
                />
              </div>
              <div className="flex justify-between items-center">
                {errors.description && (
                  <p
                    className="text-sm text-red-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {errors.description}
                  </p>
                )}
                <p
                  className={`text-xs ml-auto ${formData.description.length > 280 ? 'text-red-500' : 'text-gray-500'}`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {formData.description.length}/300
                </p>
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Palette size={18} className="text-gray-600" weight="duotone" />
                <label
                  className="block text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Color
                </label>
              </div>
              <SubjectColorPicker
                selectedColor={formData.color}
                onColorChange={(color) => onFormDataChange('color', color)}
                disabled={loading}
              />
            </div>

            {/* Selected Subjects Summary */}
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Selected ({getSelectedSubjects().length})
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                {getSelectedSubjects().length === 0 ? (
                  <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    No subjects selected
                  </p>
                ) : (
                  <div className="space-y-1">
                    {getSelectedSubjects().map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <div className={`w-3 h-3 bg-${subject.color}`}></div>
                        <span className="flex-1 truncate" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          {subject.code} {subject.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSubjectToggle(subject.id)}
                          className="text-blue-900 hover:text-blue-900  "
                          disabled={loading}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right Panel - Subject Selection (70%) */}
        <div className="w-[70%] p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users size={24} className="text-blue-900" weight="duotone" />
              <div>
                <h3
                  className="text-lg font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Select Subjects
                </h3>
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Choose subjects for this set
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLoadSubjects();
                onSubjectsRefresh?.();
              }}
              disabled={loadingSubjects}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {loadingSubjects ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loadingSubjects ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  Loading subjects...
                </p>
              </div>
            </div>
          ) : availableSubjects.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-md">
                <BookOpen size={48} className="text-yellow-600 mx-auto mb-4" weight="duotone" />
                <p className="text-sm text-yellow-800" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  No subjects available for selected grade levels and courses
                </p>
                <p className="text-xs text-yellow-600 mt-2" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  Create subjects first before adding them to a set
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSubjects.map((subject) => {
                const isSelected = formData.subjects.includes(subject.id);
                return (
                  <div
                    key={subject.id}
                    className={`border p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                    }`}
                    onClick={() => !loading && handleSubjectToggle(subject.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-5 h-5 border-2 aspect-square rounded flex items-center justify-center mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <Check size={12} className="text-white" weight="bold" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span
                            className="font-medium text-gray-900 truncate"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            <p className={`bg-${subject.color} px-2 font-xs text-white py-1 inline-block mb-2`}>{subject.code} </p> {subject.name}
                          </span>
                        </div>
                        <div className={`text-xs text-white bg-${subject.color} px-2 py-1  inline-block mb-2`} style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          Lab: {subject.labUnits} 
                        </div>

                        <div className={`text-xs text-white ml-1 bg-${subject.color} px-2 py-1  inline-block mb-2`} style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          Lecture: {subject.lectureUnits}
                        </div>
                        <p
                          className="text-sm text-gray-600 line-clamp-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {subject.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {errors.subjects && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.subjects}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={loading || !formData.name || !formData.description || formData.subjects.length === 0 || (formData.gradeLevels.length === 0 && formData.courseSelections.length === 0)}
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full aspect-square h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {isEditing ? 'Update Subject Set' : 'Create Subject Set'}
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}

export default function SubjectSetForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false,
  onSubjectsRefresh
}: SubjectSetFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<SubjectSetFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    gradeLevels: Array.isArray(initialData?.gradeLevels) ? initialData.gradeLevels : (initialData?.gradeLevels ? [initialData.gradeLevels as number] : [7]),
    courseSelections: Array.isArray(initialData?.courseSelections) ? initialData.courseSelections : [],
    color: initialData?.color || SUBJECT_COLORS[0],
    subjects: initialData?.subjects || []
  });

  const [errors, setErrors] = useState<SubjectSetFormErrors>({});
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectData[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const initialLoadRef = useRef(true);

  // Load available grades, courses and subjects on component mount
  useEffect(() => {
    loadGrades();
    loadCourses();
    loadSubjects();
  }, []);

  // Reload subjects when grade levels or course selections change
  useEffect(() => {
    if (!initialLoadRef.current && (formData.gradeLevels.length > 0 || formData.courseSelections.length > 0)) {
      loadSubjects();
    }
    initialLoadRef.current = false;
  }, [formData.gradeLevels, formData.courseSelections]);


  // Reload subjects when modal opens to get latest subjects
  useEffect(() => {
    if (isModalOpen) {
      loadSubjects();
    }
  }, [isModalOpen]);

  const loadGrades = async () => {
    try {
      setLoadingGrades(true);
      const response = await fetch('/api/grades');
      if (response.ok) {
        const data = await response.json();
        setGrades(data.grades || []);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      setLoadingGrades(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };


  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true);
      
      // Load all subjects first, then filter client-side to include both grade-level and course-only subjects
      const response = await fetch('/api/subjects');

      if (response.ok) {
        const data = await response.json();
        
        // Filter subjects that are applicable to the selected grade levels or course codes
        const subjects = Array.isArray(data.subjects)
          ? data.subjects.filter((subject: any) => {
              if (!subject || !subject.id || !subject.name) {
                return false;
              }
              
              // If no grade levels or course selections are selected, show all subjects
              if (formData.gradeLevels.length === 0 && formData.courseSelections.length === 0) {
                return true;
              }
              
              // Check if subject applies to any selected grade level
              if (formData.gradeLevels.length > 0) {
                if (subject.gradeLevels && Array.isArray(subject.gradeLevels)) {
                  // New structure: check if gradeLevels includes any selected grade
                  const hasMatchingGrade = subject.gradeLevels.some((gradeLevel: number) => 
                    formData.gradeLevels.includes(gradeLevel)
                  );
                  if (hasMatchingGrade) return true;
                } else if (subject.gradeLevel) {
                  // Old structure: check if gradeLevel matches any selected grade
                  if (formData.gradeLevels.includes(subject.gradeLevel)) return true;
                }
              }
              
              // Check if subject applies to any selected course selection (code, year, semester)
              if (formData.courseSelections.length > 0) {
                // New structure: check if subject has courseSelections array
                if (subject.courseSelections && Array.isArray(subject.courseSelections)) {
                  const hasMatchingSelection = subject.courseSelections.some((subSel: any) =>
                    formData.courseSelections.some(formSel =>
                      formSel.code === subSel.code &&
                      formSel.year === subSel.year &&
                      formSel.semester === subSel.semester
                    )
                  );
                  if (hasMatchingSelection) return true;
                }
                // Old structure: check if subject has courseCodes array (for backward compatibility)
                else if (subject.courseCodes && Array.isArray(subject.courseCodes)) {
                  const hasMatchingCourse = subject.courseCodes.some((courseCode: string) =>
                    formData.courseSelections.some(sel => sel.code === courseCode)
                  );
                  if (hasMatchingCourse) return true;
                }
              }
              
              // If subject doesn't match any selected criteria, don't show it
              return false;
            })
          : [];
        setAvailableSubjects(subjects);
      } else {
        console.error('Failed to load subjects:', response.status, response.statusText);
        setAvailableSubjects([]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      setAvailableSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SubjectSetFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Subject set name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Subject set name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Subject set description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Subject set description must be at least 10 characters';
    } else if (formData.description.trim().length > 300) {
      newErrors.description = 'Subject set description must not exceed 300 characters';
    }

    // Validate that at least one grade level or course selection is made
    if (formData.gradeLevels.length === 0 && formData.courseSelections.length === 0) {
      newErrors.gradeLevels = 'At least one grade level or college course must be selected';
    } else if (formData.gradeLevels.length > 0) {
      // Validate that all grade levels exist in the database
      const invalidGrades = formData.gradeLevels.filter(level => {
        const gradeExists = grades.some(g => g.gradeLevel === level);
        return !gradeExists;
      });
      if (invalidGrades.length > 0) {
        newErrors.gradeLevels = 'Selected grade levels do not exist in the system';
      }
    }

    if (!formData.subjects || formData.subjects.length === 0) {
      newErrors.subjects = 'At least one subject must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const handleInputChange = (field: keyof SubjectSetFormData, value: string | number | string[] | number[] | { code: string; year: number; semester: 'first-sem' | 'second-sem' }[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof SubjectSetFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId]
    }));
    // Clear subjects error when user makes a selection
    if (errors.subjects) {
      setErrors(prev => ({ ...prev, subjects: undefined }));
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim()
      });
      setIsModalOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    onCancel();
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const getGradeDisplayName = (grade: GradeData) => {
    if (grade.department === 'SHS' && grade.strand) {
      return `Grade ${grade.gradeLevel} - ${grade.strand}`;
    }
    return `Grade ${grade.gradeLevel} (${grade.department})`;
  };

  const getSelectedSubjects = () => {
    return availableSubjects.filter(subject => formData.subjects.includes(subject.id));
  };

  return (
    <>
      <Card className="w-full max-w-2xl p-6 bg-gray-50 border-0 border-r-0 border-b-0 border-t-5 border-blue-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-${formData.color} flex items-center justify-center`}>
            {isEditing ? (
              <Pencil size={20} className="text-white" />
            ) : (
              <Plus size={20} className="text-white" />
            )}
          </div>
          <div>
            <h2
              className="text-xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {isEditing ? 'Edit Subject Set' : 'Create New Subject Set'}
            </h2>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {isEditing ? 'Update subject set information' : 'Group subjects together for easy management'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </Button>
      </div>

        <div className="text-center py-12">
          <div className="mb-6">
            <Users size={64} className="text-blue-900 mx-auto mb-4" weight="duotone" />
            <h3
              className="text-lg font-medium text-gray-900 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Set Configuration
            </h3>
            <p
              className="text-sm text-gray-600 max-w-md mx-auto"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Configure your subject set details and select subjects in a dedicated interface optimized for better organization.
            </p>
          </div>

          <Button
            onClick={openModal}
            disabled={loading}
            className="px-8 py-3"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {isEditing ? 'Edit Subject Set' : 'Create Subject Set'}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p
            className="text-sm text-blue-800 text-center"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Subject sets help organize related subjects together for easier curriculum management and student enrollment.
          </p>
        </div>
    </Card>

      <SubjectSelectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        formData={formData}
        onFormDataChange={handleInputChange}
        errors={errors}
        grades={grades}
        courses={courses}
        availableSubjects={availableSubjects}
        loadingGrades={loadingGrades}
        loadingCourses={loadingCourses}
        loadingSubjects={loadingSubjects}
        loading={loading}
        isEditing={isEditing}
        onLoadSubjects={loadSubjects}
        onSubmit={handleModalSubmit}
        onCancel={handleModalClose}
        onSubjectsRefresh={onSubjectsRefresh}
      />
    </>
  );
}
