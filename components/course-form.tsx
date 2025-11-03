'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import CourseColorPicker from '@/components/course-color-picker';
import { CourseColor, COURSE_COLORS } from '@/lib/types/course';
import { Plus, X, Pencil, Hash, BookOpen, FileText, Palette } from '@phosphor-icons/react';

interface CourseFormData {
  code: string;
  name: string;
  description: string;
  color: CourseColor;
}

interface CourseFormProps {
  onSubmit: (courseData: CourseFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CourseFormData>;
  isEditing?: boolean;
  loading?: boolean;
}

export default function CourseForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false
}: CourseFormProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    color: initialData?.color || COURSE_COLORS[0]
  });

  const [errors, setErrors] = useState<Partial<CourseFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CourseFormData> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Course code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Course code must contain only uppercase letters and numbers';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Course name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Course description must be at least 10 characters';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'Course description must not exceed 200 characters';
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
      await onSubmit({
        ...formData,
        code: formData.code.toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim()
      });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: keyof CourseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
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
              {isEditing ? 'Edit Course' : 'Create New Course'}
            </h2>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {isEditing ? 'Update course information' : 'Add a new course to the system'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Code */}
          <div className="space-y-2">
            <label
              htmlFor="course-code"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Course Code *
            </label>
            <div className="relative">
              <Input
                id="course-code"
                type="text"
                placeholder="e.g., BSIT"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                disabled={loading || isEditing} // Can't change code when editing
                className={`pl-10 border-1 shadow-sm border-blue-900 border-r-0 border-t-0 border-b-0 rounded-none uppercase capitalize ${errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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

          {/* Course Name */}
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="course-name"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Course Name *
            </label>
            <div className="relative">
              <Input
                id="course-name"
                type="text"
                placeholder="e.g., BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={loading}
                className={`pl-10 border-1 shadow-sm border-blue-900 border-r-0 border-t-0 border-b-0 rounded-none ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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

          {/* Course Description */}
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="course-description"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Course Description *
            </label>
            <div className="relative">
              <textarea
                id="course-description"
                placeholder="Provide a detailed description of the course, including learning objectives, content coverage, and target audience..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
                className={`border-1 shadow-sm border-blue-900 rounded-none flex min-h-[100px] w-full rounded-md bg-white pl-10 pr-3 py-2 text-base shadow-lg placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${
                  errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
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
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.description}
                </p>
              )}
              <p
                className={`text-xs ml-auto ${formData.description.length > 180 ? 'text-red-500' : 'text-gray-500'}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {formData.description.length}/200 characters
              </p>
            </div>
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
              Course Color
            </label>
          </div>
          <CourseColorPicker
            selectedColor={formData.color}
            onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
            disabled={loading}
          />
        </div>

        <p className="text-sm text-gray-800 font-light p-3 bg-green-100 border-1 shadow-sm border-green-900 text-justify"> 
          This form will determine the identity of the course in the system. The clearer the description, the easier it will be to identify the course.
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
            disabled={loading || !formData.code || !formData.name || !formData.description}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full aspect-square h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {isEditing ? 'Update Course' : 'Create Course'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
