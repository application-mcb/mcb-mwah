'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Department, DEPARTMENTS, SectionRank, SECTION_RANKS, GradeData, SectionData } from '@/lib/types/grade-section';
import { CourseData } from '@/lib/types/course';
import { Plus, X, Pencil, BookOpen, Users, Trophy, FileText, Building, GraduationCap } from '@phosphor-icons/react';

interface SectionFormData {
  sectionType: 'grade' | 'course';
  gradeId: string;
  courseId: string;
  sectionName: string;
  grade: string;
  department: Department;
  rank: SectionRank;
  description: string;
}

interface SectionFormProps {
  onSubmit: (sectionData: { gradeId?: string; courseId?: string; sectionName: string; grade: string; department: Department; rank: SectionRank; description: string }) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<SectionFormData & { courseId?: string }>;
  isEditing?: boolean;
  loading?: boolean;
  availableGrades?: GradeData[];
  availableCourses?: CourseData[];
  existingSections?: SectionData[];
}

export default function SectionForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false,
  availableGrades = [],
  availableCourses = [],
  existingSections = []
}: SectionFormProps) {

  // Helper function to format grade level display
  const formatGradeLevel = (grade: GradeData): string => {
    if (grade.strand && (grade.gradeLevel === 11 || grade.gradeLevel === 12)) {
      return `G${grade.gradeLevel}${grade.strand}`;
    }
    if (grade.gradeLevel >= 7 && grade.gradeLevel <= 12) {
      return `G${grade.gradeLevel}`;
    }
    return `Grade ${grade.gradeLevel}`;
  };

  // Determine initial section type
  const getInitialSectionType = (): 'grade' | 'course' => {
    if (initialData?.courseId) return 'course';
    if (initialData?.gradeId) return 'grade';
    return 'grade'; // Default to grade
  };

  const [formData, setFormData] = useState<SectionFormData>({
    sectionType: getInitialSectionType(),
    gradeId: initialData?.gradeId || '',
    courseId: initialData?.courseId || '',
    sectionName: initialData?.sectionName || '',
    grade: initialData?.grade || '',
    department: initialData?.department || DEPARTMENTS[0],
    rank: initialData?.rank || SECTION_RANKS[0],
    description: initialData?.description || ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SectionFormData, string>>>({});

  // Update department and grade when gradeId changes
  useEffect(() => {
    if (formData.sectionType === 'grade' && formData.gradeId && availableGrades.length > 0) {
      const selectedGrade = availableGrades.find(g => g.id === formData.gradeId);
      if (selectedGrade) {
        setFormData(prev => ({
          ...prev,
          grade: formatGradeLevel(selectedGrade),
          department: selectedGrade.department
        }));
      }
    }
  }, [formData.gradeId, formData.sectionType, availableGrades]);

  // Update department and grade when courseId changes
  useEffect(() => {
    if (formData.sectionType === 'course' && formData.courseId && availableCourses.length > 0) {
      const selectedCourse = availableCourses.find(c => c.code === formData.courseId);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          grade: `${selectedCourse.code} - ${selectedCourse.name}`,
          department: 'COLLEGE'
        }));
      }
    }
  }, [formData.courseId, formData.sectionType, availableCourses]);

  // Get available ranks for the selected grade/course (exclude already taken ranks)
  const getAvailableRanks = (): SectionRank[] => {
    const identifier = formData.sectionType === 'grade' ? formData.gradeId : formData.courseId;
    if (!identifier) return [...SECTION_RANKS];

    // Find sections that belong to the selected grade or course
    const relatedSections = existingSections.filter(section => {
      if (formData.sectionType === 'grade') {
        return section.gradeId === identifier;
      } else {
        return section.courseId === identifier;
      }
    });

    // Get ranks that are already taken
    const takenRanks = relatedSections.map(section => section.rank);

    // Return ranks that are not taken (or include current rank if editing)
    return [...SECTION_RANKS].filter(rank => {
      if (isEditing && initialData?.rank === rank) {
        // Allow the current rank if we're editing this section
        return true;
      }
      return !takenRanks.includes(rank);
    });
  };

  // Auto-select first available rank when grade/course changes
  useEffect(() => {
    const identifier = formData.sectionType === 'grade' ? formData.gradeId : formData.courseId;
    if (identifier) {
      const availableRanks = getAvailableRanks();

      // If current rank is not available, select the first available one
      if (!availableRanks.includes(formData.rank) && availableRanks.length > 0) {
        setFormData(prev => ({
          ...prev,
          rank: availableRanks[0]
        }));
      }
    }
  }, [formData.gradeId, formData.courseId, formData.sectionType, existingSections, isEditing, initialData?.rank]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SectionFormData, string>> = {};

    const identifier = formData.sectionType === 'grade' ? formData.gradeId : formData.courseId;
    if (!identifier) {
      newErrors[formData.sectionType === 'grade' ? 'gradeId' : 'courseId'] = `Please select a ${formData.sectionType === 'grade' ? 'grade level' : 'course'}`;
    }

    if (!formData.sectionName.trim()) {
      newErrors.sectionName = 'Section name is required';
    } else if (formData.sectionName.trim().length < 2) {
      newErrors.sectionName = 'Section name must be at least 2 characters';
    }

    const availableRanks = getAvailableRanks();
    if (!availableRanks.includes(formData.rank)) {
      newErrors.rank = 'Please select an available rank';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Section description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Section description must be at least 10 characters';
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
      const submitData: any = {
        sectionName: formData.sectionName.trim(),
        description: formData.description.trim(),
        grade: formData.grade,
        department: formData.department,
        rank: formData.rank
      };

      if (formData.sectionType === 'grade') {
        submitData.gradeId = formData.gradeId;
      } else {
        submitData.courseId = formData.courseId;
      }

      await onSubmit(submitData);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: keyof SectionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSectionTypeChange = (type: 'grade' | 'course') => {
    setFormData(prev => ({
      ...prev,
      sectionType: type,
      gradeId: '',
      courseId: '',
      grade: '',
      department: DEPARTMENTS[0],
      rank: SECTION_RANKS[0]
    }));
  };

  const handleGradeChange = (gradeId: string) => {
    const selectedGrade = availableGrades.find(g => g.id === gradeId);
    if (selectedGrade) {
      setFormData(prev => ({
        ...prev,
        gradeId,
        grade: formatGradeLevel(selectedGrade),
        department: selectedGrade.department
      }));
    }
    // Clear error when user selects grade
    if (errors.gradeId) {
      setErrors(prev => ({ ...prev, gradeId: undefined }));
    }
  };

  const handleCourseChange = (courseId: string) => {
    const selectedCourse = availableCourses.find(c => c.code === courseId);
    if (selectedCourse) {
      setFormData(prev => ({
        ...prev,
        courseId,
        grade: `${selectedCourse.code} - ${selectedCourse.name}`,
        department: 'COLLEGE'
      }));
    }
    // Clear error when user selects course
    if (errors.courseId) {
      setErrors(prev => ({ ...prev, courseId: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-2xl p-6 bg-gray-50 border-0 border-r-0 border-b-0 border-t-5 border-blue-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-blue-900 flex items-center justify-center`}>
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
              {isEditing ? 'Edit Section' : 'Create New Section'}
            </h2>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {isEditing ? 'Update section information' : 'Add a new section to a grade level or course'}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Section Type Toggle */}
          {!isEditing && (
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Section Type *
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleSectionTypeChange('grade')}
                  className={`flex-1 px-4 py-3 border-2 transition-all ${
                    formData.sectionType === 'grade'
                      ? 'border-blue-900 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <BookOpen size={20} className={formData.sectionType === 'grade' ? 'text-blue-900' : 'text-gray-600'} />
                    <span className={formData.sectionType === 'grade' ? 'text-blue-900 font-medium' : 'text-gray-600'}>
                      Grade Level (JHS/SHS)
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSectionTypeChange('course')}
                  className={`flex-1 px-4 py-3 border-2 transition-all ${
                    formData.sectionType === 'course'
                      ? 'border-blue-900 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <GraduationCap size={20} className={formData.sectionType === 'course' ? 'text-blue-900' : 'text-gray-600'} />
                    <span className={formData.sectionType === 'course' ? 'text-blue-900 font-medium' : 'text-gray-600'}>
                      Course (College)
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Grade Selection */}
          {formData.sectionType === 'grade' && (
            <div className="space-y-2">
              <label
                htmlFor="grade-select"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Select Grade Level *
              </label>
              <div className="relative">
                <select
                  id="grade-select"
                  value={formData.gradeId}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  disabled={loading || isEditing}
                  className={`w-full pl-10 pr-3 py-2 border-1 shadow-sm border-blue-900 rounded-none bg-white text-base shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${errors.gradeId ? 'border-blue-500 focus-visible:ring-blue-500' : ''}`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  aria-describedby={errors.gradeId ? 'grade-error' : undefined}
                >
                  <option value="">Select a Grade Level</option>
                  {availableGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {formatGradeLevel(grade)} - {grade.department}
                    </option>
                  ))}
                </select>
                <BookOpen
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  weight="duotone"
                />
              </div>
              {errors.gradeId && (
                <p
                  id="grade-error"
                  className="text-sm text-blue-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.gradeId}
                </p>
              )}
              {!isEditing && availableGrades.length === 0 && (
                <p
                  className="text-xs text-blue-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No grade levels available. Please create a grade level first.
                </p>
              )}
            </div>
          )}

          {/* Course Selection */}
          {formData.sectionType === 'course' && (
            <div className="space-y-2">
              <label
                htmlFor="course-select"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Select Course *
              </label>
              <div className="relative">
                <select
                  id="course-select"
                  value={formData.courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  disabled={loading || isEditing}
                  className={`w-full pl-10 pr-3 py-2 border-1 shadow-sm border-blue-900 rounded-none bg-white text-base shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${errors.courseId ? 'border-blue-500 focus-visible:ring-blue-500' : ''}`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  aria-describedby={errors.courseId ? 'course-error' : undefined}
                >
                  <option value="">Select a Course</option>
                  {availableCourses.map((course) => (
                    <option key={course.code} value={course.code}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
                <GraduationCap
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  weight="duotone"
                />
              </div>
              {errors.courseId && (
                <p
                  id="course-error"
                  className="text-sm text-blue-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.courseId}
                </p>
              )}
              {!isEditing && availableCourses.length === 0 && (
                <p
                  className="text-xs text-blue-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No courses available. Please create a course first.
                </p>
              )}
            </div>
          )}

          {/* Section Name */}
          <div className="space-y-2">
            <label
              htmlFor="section-name"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Section Name *
            </label>
            <div className="relative">
              <Input
                id="section-name"
                type="text"
                placeholder="e.g., Falcon"
                value={formData.sectionName}
                onChange={(e) => handleInputChange('sectionName', e.target.value)}
                disabled={loading}
                className={`pl-10 border-1 shadow-sm border-blue-900 rounded-none ${errors.sectionName ? 'border-blue-500 focus-visible:ring-blue-500' : ''}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.sectionName ? 'section-name-error' : undefined}
              />
              <Users
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
            </div>
            {errors.sectionName && (
              <p
                id="section-name-error"
                className="text-sm text-blue-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.sectionName}
              </p>
            )}
          </div>

          {/* Section Rank */}
          <div className="space-y-2">
            <label
              htmlFor="section-rank"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Section Rank *
            </label>
            <div className="relative">
              <select
                id="section-rank"
                value={formData.rank}
                onChange={(e) => handleInputChange('rank', e.target.value as SectionRank)}
                disabled={loading || getAvailableRanks().length === 0}
                className={`w-full pl-10 pr-3 py-2 border-1 shadow-sm border-blue-900 rounded-none bg-white text-base shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${errors.rank ? 'border-blue-500 focus-visible:ring-blue-500' : ''}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.rank ? 'rank-error' : undefined}
              >
                {getAvailableRanks().length === 0 ? (
                  <option value="">
                    No ranks available
                  </option>
                ) : (
                  getAvailableRanks().map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))
                )}
              </select>
              <Trophy
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
            </div>
            {getAvailableRanks().length === 0 && (formData.gradeId || formData.courseId) && (
              <p
                className="text-sm text-orange-600 bg-orange-50 border border-orange-200 p-2 rounded-none"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                All ranks (A-H) are already taken. Please select a different {formData.sectionType} or contact an administrator.
              </p>
            )}
            {errors.rank && (
              <p
                id="rank-error"
                className="text-sm text-blue-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.rank}
              </p>
            )}
          </div>

          {/* Auto-populated Grade and Department Display */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {formData.sectionType === 'grade' ? 'Grade' : 'Course'}
            </label>
            <div className="relative">
              <Input
                type="text"
                value={formData.grade}
                disabled
                className="pl-10 border-1 shadow-sm border-gray-300 bg-gray-100 text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
              <BookOpen
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Department
            </label>
            <div className="relative">
              <Input
                type="text"
                value={formData.department === 'JHS' ? 'Junior High School' :
                       formData.department === 'SHS' ? 'Senior High School' :
                       'College'}
                disabled
                className="pl-10 border-1 shadow-sm border-gray-300 bg-gray-100 text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
              <Building
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
            </div>
          </div>

          {/* Section Description */}
          <div className="space-y-2">
            <label
              htmlFor="section-description"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Section Description *
            </label>
            <div className="relative">
              <textarea
                id="section-description"
                placeholder="Provide a detailed description of the section, including class composition, special features, or focus areas..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
                className={`border-1 shadow-sm border-blue-900 rounded-none flex min-h-[100px] w-full bg-white pl-10 pr-3 py-2 text-base shadow-lg placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${errors.description ? 'border-blue-500 focus-visible:ring-blue-500' : ''}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.description ? 'description-error' : undefined}
                maxLength={200}
                rows={4}
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
                  id="description-error"
                  className="text-sm text-blue-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.description}
                </p>
              )}
              <p
                className={`text-xs ml-auto ${formData.description.length > 180 ? 'text-blue-500' : 'text-gray-500'}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {formData.description.length}/200 characters
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-800 font-light p-3 bg-blue-100 border-1 border-blue-900 text-justify">
          This form will determine the identity of the section in the system. Sections are ranked (A-H) to help with organization and student placement.
        </p>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
            disabled={loading || !(formData.gradeId || formData.courseId) || !formData.sectionName || !formData.rank || !formData.description || getAvailableRanks().length === 0}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {isEditing ? 'Update Section' : 'Create Section'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
