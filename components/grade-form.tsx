'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Department, DEPARTMENTS, GradeColor, GRADE_COLORS } from '@/lib/types/grade-section';
import GradeColorPicker from '@/components/grade-color-picker';
import { Plus, X, Pencil, Hash, Building, FileText } from '@phosphor-icons/react';

interface GradeFormData {
  gradeLevel: string;
  department: Department;
  description: string;
  color: GradeColor;
  gradeLevelNumeric?: number;
  strand?: string;
}

interface GradeFormProps {
  onSubmit: (gradeData: { gradeLevel: number; department: Department; description: string; color: GradeColor; strand?: string }) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<GradeFormData>;
  isEditing?: boolean;
  loading?: boolean;
  existingGrades?: any[];
}

export default function GradeForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false,
  existingGrades = []
}: GradeFormProps) {
  // Grade level options
  const GRADE_LEVEL_OPTIONS = [
    { label: 'G7', value: '7', numeric: 7, department: 'JHS' as Department },
    { label: 'G8', value: '8', numeric: 8, department: 'JHS' as Department },
    { label: 'G9', value: '9', numeric: 9, department: 'JHS' as Department },
    { label: 'G10', value: '10', numeric: 10, department: 'JHS' as Department },
    { label: 'G11ABM', value: '11-abm', numeric: 11, department: 'SHS' as Department, strand: 'ABM' },
    { label: 'G11HUMSS', value: '11-humss', numeric: 11, department: 'SHS' as Department, strand: 'HUMSS' },
    { label: 'G11STEM', value: '11-stem', numeric: 11, department: 'SHS' as Department, strand: 'STEM' },
    { label: 'G11GAS', value: '11-gas', numeric: 11, department: 'SHS' as Department, strand: 'GAS' },
    { label: 'G12ABM', value: '12-abm', numeric: 12, department: 'SHS' as Department, strand: 'ABM' },
    { label: 'G12HUMSS', value: '12-humss', numeric: 12, department: 'SHS' as Department, strand: 'HUMSS' },
    { label: 'G12STEM', value: '12-stem', numeric: 12, department: 'SHS' as Department, strand: 'STEM' },
    { label: 'G12GAS', value: '12-gas', numeric: 12, department: 'SHS' as Department, strand: 'GAS' },
  ];

  // Function to get grade option from numeric value
  const getGradeOptionFromNumeric = (numericValue: number) => {
    return GRADE_LEVEL_OPTIONS.find(option => option.numeric === numericValue);
  };

  // Function to get grade option from string value
  const getGradeOptionFromValue = (value: string) => {
    return GRADE_LEVEL_OPTIONS.find(option => option.value === value);
  };

  // Filter out existing grade levels when creating new grades
  const availableGradeOptions = GRADE_LEVEL_OPTIONS.filter(option => {
    if (isEditing) return true; // Show all options when editing
    return !existingGrades.some((existingGrade: any) => {
      // For SHS grades with strands, check both grade level and strand
      if (option.strand && existingGrade.strand) {
        return existingGrade.gradeLevel === option.numeric && existingGrade.strand === option.strand;
      }
      // For regular grades, just check grade level
      return existingGrade.gradeLevel === option.numeric;
    });
  });

  // Handle initial data - could be from GradeData (with numeric gradeLevel) or GradeFormData
  let initialGradeLevel: string;
  let initialGradeLevelNumeric: number;

  const gradeLevelNum = initialData?.gradeLevel && typeof initialData.gradeLevel === 'number'
    ? initialData.gradeLevel
    : initialData?.gradeLevelNumeric || 7;

  if (isEditing && initialData?.strand && (gradeLevelNum === 11 || gradeLevelNum === 12)) {
    // For editing SHS grades with strands, use the strand-based value
    const strandValue = `${gradeLevelNum}-${initialData.strand.toLowerCase()}`;
    const gradeOption = getGradeOptionFromValue(strandValue);
    initialGradeLevel = strandValue;
    initialGradeLevelNumeric = gradeLevelNum;
  } else {
    // For other cases, use the existing logic
    initialGradeLevel = initialData?.gradeLevel
      ? (typeof initialData.gradeLevel === 'number' ? String(initialData.gradeLevel) : String(initialData.gradeLevel))
      : '7';
    initialGradeLevelNumeric = initialData?.gradeLevelNumeric ||
      (initialData?.gradeLevel && typeof initialData.gradeLevel === 'number' ? initialData.gradeLevel : 7);
  }

  const [formData, setFormData] = useState<GradeFormData>({
    gradeLevel: initialGradeLevel,
    department: initialData?.department || (getGradeOptionFromNumeric(initialGradeLevelNumeric)?.department || 'JHS'),
    description: initialData?.description || '',
    color: initialData?.color || GRADE_COLORS[0],
    gradeLevelNumeric: initialGradeLevelNumeric,
    strand: initialData?.strand
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GradeFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GradeFormData, string>> = {};

    if (!formData.gradeLevel || !availableGradeOptions.find(option => option.value === formData.gradeLevel)) {
      newErrors.gradeLevel = isEditing ? 'Please select a valid grade level' : 'Grade level already exists or is invalid';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Grade description is required';
    } else if (formData.description.trim().length > 150) {
      newErrors.description = 'Grade description must not exceed 150 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if no grades are available and not editing
    if (!isEditing && !hasAvailableGrades) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const selectedOption = GRADE_LEVEL_OPTIONS.find(option => option.value === formData.gradeLevel);
      await onSubmit({
        gradeLevel: formData.gradeLevelNumeric || 7,
        department: formData.department,
        description: formData.description.trim(),
        color: formData.color,
        strand: selectedOption?.strand
      });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: keyof GradeFormData, value: string | number) => {
    if (field === 'gradeLevel') {
      const selectedOption = getGradeOptionFromValue(value as string);
      if (selectedOption) {
        setFormData(prev => ({
          ...prev,
          gradeLevel: value as string,
          gradeLevelNumeric: selectedOption.numeric,
          department: selectedOption.department,
          strand: selectedOption.strand
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Check if there are any available grade levels to create
  const hasAvailableGrades = availableGradeOptions.length > 0;

  return (
    <Card className="w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto bg-gray-50 border-0 border-r-0 border-b-0 border-t-5 border-blue-900">
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
              {isEditing ? 'Edit Grade Level' : 'Create New Grade Level'}
            </h2>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {isEditing ? 'Update grade level information' : 'Add a new grade level to the system'}
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

      {!isEditing && !hasAvailableGrades && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-none">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p
                className="text-sm text-blue-800"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                All grade levels have been created. You cannot add new grade levels at this time.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Grade Level */}
          <div className="space-y-2">
            <label
              htmlFor="grade-level"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Grade Level *
            </label>
            <div className="relative">
              <select
                id="grade-level"
                value={formData.gradeLevel}
                onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
                disabled={loading || isEditing || (!isEditing && !hasAvailableGrades)} // Can't change grade level when editing or no grades available
                className={`w-full pl-10 pr-3 py-2 border-1 shadow-sm border-blue-900 border-r-0 border-t-0 border-b-0 rounded-none bg-white text-base shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${errors.gradeLevel ? 'border-blue-500 focus-visible:ring-blue-500' : ''}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.gradeLevel ? 'grade-level-error' : undefined}
              >
                <option value="">Select Grade Level</option>
                {availableGradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Hash
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                weight="duotone"
              />
            </div>
            {errors.gradeLevel && (
              <p
                id="grade-level-error"
                className="text-sm text-blue-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.gradeLevel}
              </p>
            )}
            {!isEditing && (
              <p
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Select from available grade levels
              </p>
            )}
          </div>

        {/* Auto-selected Department */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-gray-700"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Department
          </label>
          <div className="relative">
            <div className="w-full pl-10 pr-3 py-2 border-1 shadow-sm border-gray-300 bg-gray-100 text-gray-600">
              {formData.department === 'JHS' ? 'Junior High School' :
               formData.department === 'SHS' ? 'Senior High School' :
               'College'}
            </div>
            <Building
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              weight="duotone"
            />
          </div>
          <p
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Automatically selected based on grade level
          </p>
        </div>

        {/* Grade Color Picker */}
        <div className="space-y-2">
          <GradeColorPicker
            selectedColor={formData.color}
            onColorChange={(color) => handleInputChange('color', color)}
            disabled={loading}
          />
        </div>

          {/* Grade Description */}
          <div className="space-y-2">
            <label
              htmlFor="grade-description"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Grade Description *
            </label>
            <div className="relative">
              <textarea
                id="grade-description"
                placeholder="Provide a detailed description of the grade level, including learning objectives and target students..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading || (!isEditing && !hasAvailableGrades)}
                className={`border-1 shadow-sm border-blue-900 border-r-0 border-t-0 border-b-0 rounded-none flex min-h-[100px] w-full bg-white pl-10 pr-3 py-2 text-base shadow-lg placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${errors.description ? 'border-blue-500 focus-visible:ring-blue-500' : ''}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.description ? 'description-error' : undefined}
                maxLength={150}
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
                className={`text-xs ml-auto ${formData.description.length > 135 ? 'text-blue-500' : 'text-gray-500'}`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {formData.description.length}/150 characters
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-800 font-light p-3 bg-blue-100 border-1 shadow-sm border-blue-900 text-justify">
          This form will determine the identity of the grade level in the system. The clearer the description, the easier it will be to identify and manage grade levels.
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
            disabled={loading || !formData.gradeLevel || !formData.department || !formData.description || !formData.color || (!isEditing && !hasAvailableGrades)}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {isEditing ? 'Update Grade Level' : 'Create Grade Level'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
