'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import SubjectColorPicker from '@/components/subject-color-picker';
import { SubjectColor, SUBJECT_COLORS } from '@/lib/subject-database';
import { GradeData } from '@/lib/grade-section-database';
import { Plus, X, Pencil, Hash, BookOpen, FileText, Palette, Calculator, Presentation, Flask } from '@phosphor-icons/react';

interface SubjectFormData {
  code: string;
  name: string;
  description: string;
  gradeLevels: number[];
  courseCodes: string[];
  courseSelections: { code: string; year: number; semester: 'first-sem' | 'second-sem' }[];
  color: SubjectColor;
  lectureUnits: string;
  labUnits: string;
}

interface SubjectFormErrors {
  code?: string;
  name?: string;
  description?: string;
  gradeLevels?: string;
  courseCodes?: string;
  courseSelections?: string;
  color?: string;
  lectureUnits?: string;
  labUnits?: string;
}

interface SubjectFormProps {
  onSubmit: (subjectData: {
    code: string;
    name: string;
    description: string;
    gradeLevels: number[];
    courseCodes: string[];
    courseSelections: { code: string; year: number; semester: 'first-sem' | 'second-sem' }[];
    color: SubjectColor;
    lectureUnits: number;
    labUnits: number;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<SubjectFormData>;
  isEditing?: boolean;
  loading?: boolean;
}

export default function SubjectForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false
}: SubjectFormProps) {
  const [formData, setFormData] = useState<SubjectFormData>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    gradeLevels: Array.isArray(initialData?.gradeLevels) ? initialData.gradeLevels : (initialData?.gradeLevels ? [initialData.gradeLevels as number] : [7]),
    courseCodes: Array.isArray(initialData?.courseCodes) ? initialData.courseCodes : [],
    courseSelections: Array.isArray(initialData?.courseSelections) ? initialData.courseSelections : [],
    color: initialData?.color || SUBJECT_COLORS[0],
    lectureUnits: (initialData?.lectureUnits || 1).toString(),
    labUnits: (initialData?.labUnits || 0).toString()
  });

  const [errors, setErrors] = useState<SubjectFormErrors>({});
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Load available grades and courses on component mount
  useEffect(() => {
    loadGrades();
    loadCourses();
  }, []);

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
      console.log('Loading courses...');
      const response = await fetch('/api/courses');
      console.log('Courses API response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Courses data:', data);
        setCourses(data.courses || []);
        console.log('Courses set:', data.courses?.length || 0, 'courses');
      } else {
        console.error('Failed to load courses:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SubjectFormErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Subject code is required';
    } else if (!/^[A-Z0-9]{2,10}$/.test(formData.code.toUpperCase())) {
      newErrors.code = 'Subject code must be 2-10 uppercase letters and numbers only';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Subject name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Subject description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Subject description must be at least 10 characters';
    } else if (formData.description.trim().length > 300) {
      newErrors.description = 'Subject description must not exceed 300 characters';
    }

    // Validate grade levels or course selections (at least one must be selected)
    if ((!formData.gradeLevels || formData.gradeLevels.length === 0) &&
        (!formData.courseCodes || formData.courseCodes.length === 0) &&
        (!formData.courseSelections || formData.courseSelections.length === 0)) {
      newErrors.gradeLevels = 'At least one grade level or college course must be selected';
    } else if (formData.gradeLevels && formData.gradeLevels.length > 0) {
      // Validate that all grade levels exist in the database
      const invalidGrades = formData.gradeLevels.filter(level => {
        const gradeExists = grades.some(g => g.gradeLevel === level);
        return !gradeExists;
      });
      if (invalidGrades.length > 0) {
        newErrors.gradeLevels = 'Selected grade levels do not exist in the system';
      }
    }

    const lectureUnitsNum = parseInt(formData.lectureUnits);
    if (formData.lectureUnits === '' || isNaN(lectureUnitsNum) || lectureUnitsNum < 0 || lectureUnitsNum > 10) {
      newErrors.lectureUnits = 'Lecture units must be between 0 and 10';
    }

    const labUnitsNum = parseInt(formData.labUnits);
    if (formData.labUnits === '' || isNaN(labUnitsNum) || labUnitsNum < 0 || labUnitsNum > 10) {
      newErrors.labUnits = 'Lab units must be between 0 and 10';
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
      const submitData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        gradeLevels: formData.gradeLevels,
        courseCodes: formData.courseCodes,
        courseSelections: formData.courseSelections,
        color: formData.color,
        lectureUnits: parseInt(formData.lectureUnits) || 0,
        labUnits: parseInt(formData.labUnits) || 0
      };
      console.log('Submitting subject data:', submitData);
      await onSubmit(submitData);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: keyof SubjectFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGradeLevelToggle = (gradeLevel: number) => {
    setFormData(prev => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(gradeLevel)
        ? prev.gradeLevels.filter(level => level !== gradeLevel)
        : [...prev.gradeLevels, gradeLevel]
    }));
    // Clear error when user makes selection
    if (errors.gradeLevels) {
      setErrors(prev => ({ ...prev, gradeLevels: undefined }));
    }
  };

  const handleCourseToggle = (courseCode: string) => {
    setFormData(prev => ({
      ...prev,
      courseCodes: prev.courseCodes.includes(courseCode)
        ? prev.courseCodes.filter(code => code !== courseCode)
        : [...prev.courseCodes, courseCode]
    }));
  };

  const handleCourseSelectionToggle = (courseCode: string, year: number, semester: 'first-sem' | 'second-sem') => {
    const selection = { code: courseCode, year, semester };
    const selectionExists = formData.courseSelections.some(
      sel => sel.code === courseCode && sel.year === year && sel.semester === semester
    );

    if (selectionExists) {
      setFormData(prev => ({
        ...prev,
        courseSelections: prev.courseSelections.filter(
          sel => !(sel.code === courseCode && sel.year === year && sel.semester === semester)
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        courseSelections: [...prev.courseSelections, selection]
      }));
    }
  };

  const getGradeDisplayName = (grade: GradeData) => {
    if (grade.department === 'SHS' && grade.strand) {
      return `Grade ${grade.gradeLevel} - ${grade.strand}`;
    }
    return `Grade ${grade.gradeLevel} (${grade.department})`;
  };

  return (
    <Card className="w-full max-w-2xl p-6 bg-gray-50 border-l-0 border-r-0 border-b-0 border-t-5 border-blue-900">
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
              {isEditing ? 'Edit Subject' : 'Create New Subject'}
            </h2>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {isEditing ? 'Update subject information' : 'Add a new subject to the system'}
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
        {/* Subject Code and Name Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Subject Code */}
          <div className="space-y-2">
            <label
              htmlFor="subject-code"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Code *
            </label>
            <div className="relative">
              <Input
                id="subject-code"
                type="text"
                placeholder="e.g., MATH101, ENG202"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                disabled={loading || isEditing} // Can't change code when editing
                className={`pl-10 border-1 border-blue-900 rounded-none uppercase ${errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.code ? 'code-error' : undefined}
              />
              <Hash
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
            </div>
            {errors.code && (
              <p
                id="code-error"
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.code}
              </p>
            )}
            {!isEditing && (
              <p
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Use uppercase letters and numbers only
              </p>
            )}
          </div>

          {/* Subject Name */}
          <div className="space-y-2">
            <label
              htmlFor="subject-name"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Name *
            </label>
            <div className="relative">
              <Input
                id="subject-name"
                type="text"
                placeholder="e.g., Mathematics, English, Science"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={loading}
                className={`pl-10 border-1 border-blue-900 rounded-none ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              <BookOpen
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
            </div>
            {errors.name && (
              <p
                id="name-error"
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.name}
              </p>
            )}
          </div>
        </div>

          {/* Grade Levels & Courses */}
          <div className="space-y-4">
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
                        <div className="flex items-center mb-2">
                          <div className={`w-4 h-4 bg-${courseColor} rounded-full mr-2`}></div>
                          <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                            {course.code} - {course.name}
                          </span>
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
                    No courses available (Debug: {courses.length} courses loaded)
                  </div>
                )}
              </div>
              {formData.courseSelections.length > 0 && (
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  Selected: {formData.courseSelections.map(sel => `${sel.code} ${sel.year}${sel.semester === 'first-sem' ? 'Q1' : 'Q2'}`).join(', ')}
                </p>
              )}
              {errors.courseSelections && (
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.courseSelections}
                </p>
              )}
            </div>
          </div>

          {/* Units Row: Lecture | Lab | Total */}
          <div className="flex gap-4">
            {/* Lecture Units */}
            <div className="flex-1 space-y-2">
              <label
                htmlFor="lecture-units"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Lecture Units *
              </label>
              <div className="relative">
                <Input
                  id="lecture-units"
                  type="number"
                  placeholder="e.g., 2"
                  value={formData.lectureUnits}
                  onChange={(e) => handleInputChange('lectureUnits', parseInt(e.target.value) || 0)}
                  disabled={loading}
                  min={0}
                  max={10}
                  className={`pl-10 border-1 border-blue-900 rounded-none w-full ${errors.lectureUnits ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  aria-describedby={errors.lectureUnits ? 'lecture-units-error' : undefined}
                />
                <Presentation
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  weight="duotone"
                />
              </div>
              {errors.lectureUnits && (
                <p
                  id="lecture-units-error"
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.lectureUnits}
                </p>
              )}
            </div>

            {/* Lab Units */}
            <div className="flex-1 space-y-2">
              <label
                htmlFor="lab-units"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Lab Units
              </label>
              <div className="relative">
                <Input
                  id="lab-units"
                  type="number"
                  placeholder="e.g., 1"
                  value={formData.labUnits}
                  onChange={(e) => handleInputChange('labUnits', parseInt(e.target.value) || 0)}
                  disabled={loading}
                  min={0}
                  max={10}
                  className={`pl-10 border-1 border-blue-900 rounded-none w-full ${errors.labUnits ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  aria-describedby={errors.labUnits ? 'lab-units-error' : undefined}
                />
                <Flask
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  weight="duotone"
                />
              </div>
              {errors.labUnits && (
                <p
                  id="lab-units-error"
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.labUnits}
                </p>
              )}
            </div>

            {/* Total Units Display */}
            <div className="flex-1 space-y-2">
              <label
                className="block text-sm font-light medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Total Units
              </label>
              <div className="bg-gray-50 border-1 border-blue-900 p-3 flex items-center justify-center h-9">
                <span
                  className="text-sm font-light text-gray-800"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {(parseInt(formData.lectureUnits) || 0) + (parseInt(formData.labUnits) || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Subject Description */}
          <div className="space-y-2">
            <label
              htmlFor="subject-description"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Description *
            </label>
            <div className="relative">
              <textarea
                id="subject-description"
                placeholder="Provide a detailed description of the subject, including learning objectives, content coverage, and target audience..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
                className={`border-1 border-blue-900 rounded-none flex min-h-[100px] w-full rounded-md bg-white pl-10 pr-3 py-2 text-base shadow-lg placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.description ? 'description-error' : undefined}
                maxLength={300}
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
                {formData.description.length}/300 characters
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
              Subject Color
            </label>
          </div>
          <SubjectColorPicker
            selectedColor={formData.color}
            onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
            disabled={loading}
          />
        </div>

        <p className="text-sm text-gray-800 font-light p-3 bg-green-100 border-l-5 border-green-900 text-justify">
          This form will determine the identity of the subject in the system. The clearer the description, the easier it will be to identify the subject.
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
            disabled={loading || !formData.code || !formData.name || !formData.description ||
              (formData.gradeLevels.length === 0 && formData.courseCodes.length === 0 && formData.courseSelections.length === 0) ||
              (parseInt(formData.lectureUnits) || 0) < 1}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {isEditing ? 'Update Subject' : 'Create Subject'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
