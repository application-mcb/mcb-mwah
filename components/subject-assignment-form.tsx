'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Calculator, X, Plus, Trash, Books, GraduationCap } from '@phosphor-icons/react';
import { toast } from 'react-toastify';

interface SubjectAssignmentFormProps {
  onSubmit: (data: {
    level: 'high-school' | 'college';
    gradeLevel?: number;
    courseCode?: string;
    courseName?: string;
    yearLevel?: number;
    semester?: 'first-sem' | 'second-sem';
    subjectSetId: string;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  isEditing: boolean;
  loading: boolean;
}

interface SubjectSet {
  id: string;
  name: string;
  description: string;
  color: string;
  subjects: string[];
}

interface Course {
  code: string;
  name: string;
  color: string;
}

interface Grade {
  id: string;
  gradeLevel: number;
  department: string;
  strand?: string;
  color?: string;
  description?: string;
}

export default function SubjectAssignmentForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing,
  loading
}: SubjectAssignmentFormProps) {
  const [formData, setFormData] = useState({
    level: 'high-school' as 'high-school' | 'college',
    gradeLevel: 7,
    courseCode: '',
    courseName: '',
    yearLevel: 1,
    semester: 'first-sem' as 'first-sem' | 'second-sem',
    subjectSetId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subjectSets, setSubjectSets] = useState<SubjectSet[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadSubjectSets();
    loadCourses();
    loadGrades();
  }, []);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        level: initialData.level || 'high-school',
        gradeLevel: initialData.gradeLevel || 7,
        courseCode: initialData.courseCode || '',
        courseName: initialData.courseName || '',
        yearLevel: initialData.yearLevel || 1,
        semester: initialData.semester || 'first-sem',
        subjectSetId: initialData.subjectSetId || initialData.subjectSetIds?.[0] || ''
      });
    }
  }, [initialData, isEditing]);

  const loadSubjectSets = async () => {
    try {
      const response = await fetch('/api/subject-sets');
      if (response.ok) {
        const data = await response.json();
        setSubjectSets(data.subjectSets || []);
      }
    } catch (error) {
      console.error('Error loading subject sets:', error);
      toast.error('Failed to load subject sets');
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
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
      toast.error('Failed to load grades');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLevelChange = (level: 'high-school' | 'college') => {
    setFormData(prev => ({
      ...prev,
      level,
      // Reset related fields when switching levels
      gradeLevel: level === 'high-school' ? 7 : prev.gradeLevel,
      courseCode: level === 'college' ? prev.courseCode : '',
      courseName: level === 'college' ? prev.courseName : '',
      yearLevel: level === 'college' ? prev.yearLevel : 1,
      semester: level === 'college' ? prev.semester : 'first-sem'
    }));
    if (errors.level) {
      setErrors(prev => ({ ...prev, level: '' }));
    }
  };

  const handleGradeLevelChange = (gradeLevel: number) => {
    setFormData(prev => ({ ...prev, gradeLevel }));
    if (errors.gradeLevel) {
      setErrors(prev => ({ ...prev, gradeLevel: '' }));
    }
  };

  const handleCourseChange = (courseCode: string) => {
    const selectedCourse = courses.find(course => course.code === courseCode);
    setFormData(prev => ({
      ...prev,
      courseCode,
      courseName: selectedCourse?.name || ''
    }));
    if (errors.courseCode) {
      setErrors(prev => ({ ...prev, courseCode: '' }));
    }
  };

  const handleSubjectSetSelect = (subjectSetId: string) => {
    setFormData(prev => ({
      ...prev,
      subjectSetId: prev.subjectSetId === subjectSetId ? '' : subjectSetId
    }));
    if (errors.subjectSetId) {
      setErrors(prev => ({ ...prev, subjectSetId: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.level) {
      newErrors.level = 'Level selection is required';
    }

    if (formData.level === 'high-school') {
      if (!formData.gradeLevel) {
        newErrors.gradeLevel = 'Grade level selection is required';
      }
    } else if (formData.level === 'college') {
      if (!formData.courseCode) {
        newErrors.courseCode = 'Course selection is required';
      }
      if (!formData.yearLevel || formData.yearLevel < 1 || formData.yearLevel > 4) {
        newErrors.yearLevel = 'Year level must be between 1 and 4';
      }
      if (!formData.semester) {
        newErrors.semester = 'Semester selection is required';
      }
    }

    if (!formData.subjectSetId) {
      newErrors.subjectSetId = 'A subject set must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const getCourseColor = (courseCode: string) => {
    const course = courses.find(c => c.code === courseCode);
    return course?.color || 'blue-800';
  };

  if (loadingData) {
    return (
      <div className="bg-white shadow-lg max-w-2xl w-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 w-full"></div>
            <div className="h-4 bg-gray-200 w-2/3"></div>
            <div className="h-4 bg-gray-200 w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg max-w-4xl w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <Calculator size={20} className="text-white" weight="fill" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
            {isEditing ? 'Edit Subject Assignment' : 'Create Subject Assignment'}
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Level Selection */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Level *
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleLevelChange('high-school')}
              disabled={loading}
              className={`px-3 py-2 text-sm font-medium border transition-colors ${
                formData.level === 'high-school'
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              High School
            </button>
            <button
              type="button"
              onClick={() => handleLevelChange('college')}
              disabled={loading}
              className={`px-3 py-2 text-sm font-medium border transition-colors ${
                formData.level === 'college'
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              College
            </button>
          </div>
          {errors.level && (
            <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              {errors.level}
            </p>
          )}
        </div>

        {/* High School Grade Level Selection */}
        {formData.level === 'high-school' && (
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Grade Level * ({grades.length} available)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 p-2">
              {grades.map(grade => {
                const isSelected = formData.gradeLevel === grade.gradeLevel;
                const formatGradeLevel = (grade: Grade) => {
                  if (grade.strand && (grade.gradeLevel === 11 || grade.gradeLevel === 12)) {
                    return `G${grade.gradeLevel}${grade.strand}`;
                  }
                  if (grade.gradeLevel >= 7 && grade.gradeLevel <= 12) {
                    return `G${grade.gradeLevel}`;
                  }
                  return `Grade ${grade.gradeLevel}`;
                };
                
                return (
                  <Card
                    key={grade.id}
                    className={`p-2 cursor-pointer transition-all ${
                      isSelected
                        ? `bg-${grade.color || 'blue-800'} text-white border-${grade.color || 'blue-800'}`
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleGradeLevelChange(grade.gradeLevel)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-6 h-6 ${isSelected ? 'bg-white/20' : `bg-${grade.color || 'blue-800'}`} flex items-center justify-center mb-1`}>
                        <GraduationCap size={12} className={isSelected ? 'text-white' : 'text-white'} weight="fill" />
                      </div>
                      <h4 className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        {formatGradeLevel(grade)}
                      </h4>
                      <p className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        {grade.department === 'JHS' ? 'JHS' :
                         grade.department === 'SHS' ? 'SHS' :
                         'College'}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
            {errors.gradeLevel && (
              <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                {errors.gradeLevel}
              </p>
            )}
          </div>
        )}

        {/* College Course Selection */}
        {formData.level === 'college' && (
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Course *
            </Label>
            <select
              value={formData.courseCode}
              onChange={(e) => handleCourseChange(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.courseCode ? 'border-red-500' : ''}`}
              disabled={loading}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            {errors.courseCode && (
              <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                {errors.courseCode}
              </p>
            )}
          </div>
        )}

        {/* College Year Level and Semester */}
        {formData.level === 'college' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Year Level *
              </Label>
              <select
                value={formData.yearLevel}
                onChange={(e) => handleInputChange('yearLevel', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.yearLevel ? 'border-red-500' : ''}`}
                disabled={loading}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
              {errors.yearLevel && (
                <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  {errors.yearLevel}
                </p>
              )}
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Semester *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('semester', 'first-sem')}
                  disabled={loading}
                  className={`px-3 py-2 text-sm font-medium border transition-colors ${
                    formData.semester === 'first-sem'
                      ? `bg-${getCourseColor(formData.courseCode)} text-white border-${getCourseColor(formData.courseCode)}`
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  First Semester
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('semester', 'second-sem')}
                  disabled={loading}
                  className={`px-3 py-2 text-sm font-medium border transition-colors ${
                    formData.semester === 'second-sem'
                      ? `bg-${getCourseColor(formData.courseCode)} text-white border-${getCourseColor(formData.courseCode)}`
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Second Semester
                </button>
              </div>
              {errors.semester && (
                <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  {errors.semester}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Subject Set Selection */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Subject Set *
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 p-2">
            {subjectSets.map(subjectSet => {
              const isSelected = formData.subjectSetId === subjectSet.id;
              return (
                <Card
                  key={subjectSet.id}
                  className={`p-2 cursor-pointer transition-all ${
                    isSelected
                      ? `bg-${subjectSet.color} text-white border-${subjectSet.color}`
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleSubjectSetSelect(subjectSet.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-6 h-6 ${isSelected ? 'bg-white/20' : `bg-${subjectSet.color}`} flex items-center justify-center mb-1`}>
                      <Books size={12} className={isSelected ? 'text-white' : 'text-white'} weight="fill" />
                    </div>
                    <h4 className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {subjectSet.name}
                    </h4>
                    <p className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-gray-600'}`} style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      {subjectSet.subjects.length} subjects
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
          {errors.subjectSetId && (
            <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              {errors.subjectSetId}
            </p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.subjectSetId}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                {isEditing ? 'Update Assignment' : 'Create Assignment'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
