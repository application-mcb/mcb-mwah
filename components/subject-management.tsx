'use client';

import { useState, useEffect, useMemo } from 'react';
import SubjectForm from '@/components/subject-form';
import SubjectList from '@/components/subject-list';
import SubjectSetForm from '@/components/subject-set-form';
import SubjectAssignmentForm from '@/components/subject-assignment-form';
import { LoaderOverlay } from '@/components/loader-overlay';
import { SubjectData, SubjectColor, SubjectSetData } from '@/lib/subject-database';
import { GradeData } from '@/lib/grade-section-database';
import { useAuth } from '@/lib/auth-context';
import { Trash, X, Warning, Check, Eye, BookOpen, Pencil, Plus, Calculator, Atom, Globe, Monitor, Palette, MusicNote, Book, Books } from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SubjectManagementProps {
  registrarUid: string;
}

type ActiveTab = 'subjects' | 'subject-sets' | 'subject-assignments';

export default function SubjectManagement({ registrarUid }: SubjectManagementProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('subjects');

  // Subject states
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
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Subject Set states
  const [subjectSets, setSubjectSets] = useState<SubjectSetData[]>([]);
  const [subjectSetLoading, setSubjectSetLoading] = useState(true);
  const [subjectSetActionLoading, setSubjectSetActionLoading] = useState(false);
  const [subjectSetError, setSubjectSetError] = useState('');
  const [subjectSetSuccess, setSubjectSetSuccess] = useState('');
  const [showCreateSubjectSetModal, setShowCreateSubjectSetModal] = useState(false);
  const [showEditSubjectSetModal, setShowEditSubjectSetModal] = useState(false);
  const [showDeleteSubjectSetModal, setShowDeleteSubjectSetModal] = useState(false);
  const [editingSubjectSet, setEditingSubjectSet] = useState<SubjectSetData | null>(null);
  const [deletingSubjectSet, setDeletingSubjectSet] = useState<SubjectSetData | null>(null);
  const [subjectSetCountdown, setSubjectSetCountdown] = useState(5);
  const [subjectSetIsConfirmed, setSubjectSetIsConfirmed] = useState(false);
  const [showViewSubjectSetModal, setShowViewSubjectSetModal] = useState(false);
  const [viewingSubjectSet, setViewingSubjectSet] = useState<SubjectSetData | null>(null);
  const [subjectSetSearchQuery, setSubjectSetSearchQuery] = useState('');
  const [selectedSubjectSetGradeLevel, setSelectedSubjectSetGradeLevel] = useState<number | null>(null);

  // Subject Assignment states
  const [subjectAssignments, setSubjectAssignments] = useState<any[]>([]);
  const [subjectAssignmentLoading, setSubjectAssignmentLoading] = useState(true);
  const [subjectAssignmentActionLoading, setSubjectAssignmentActionLoading] = useState(false);
  const [subjectAssignmentError, setSubjectAssignmentError] = useState('');
  const [subjectAssignmentSuccess, setSubjectAssignmentSuccess] = useState('');
  const [showCreateSubjectAssignmentModal, setShowCreateSubjectAssignmentModal] = useState(false);
  const [showEditSubjectAssignmentModal, setShowEditSubjectAssignmentModal] = useState(false);
  const [showDeleteSubjectAssignmentModal, setShowDeleteSubjectAssignmentModal] = useState(false);
  const [editingSubjectAssignment, setEditingSubjectAssignment] = useState<any>(null);
  const [deletingSubjectAssignment, setDeletingSubjectAssignment] = useState<any>(null);
  const [subjectAssignmentCountdown, setSubjectAssignmentCountdown] = useState(5);
  const [subjectAssignmentIsConfirmed, setSubjectAssignmentIsConfirmed] = useState(false);
  const [showViewSubjectAssignmentModal, setShowViewSubjectAssignmentModal] = useState(false);
  const [viewingSubjectAssignment, setViewingSubjectAssignment] = useState<any>(null);
  const [subjectAssignmentSearchQuery, setSubjectAssignmentSearchQuery] = useState('');
  const [selectedSubjectAssignmentCourse, setSelectedSubjectAssignmentCourse] = useState<string | null>(null);
  const [viewingSubjectDetails, setViewingSubjectDetails] = useState<any[]>([]);
  const [loadingViewingSubjects, setLoadingViewingSubjects] = useState(false);

  const { user } = useAuth();

  // Load subjects, subject sets, grades, courses and subject assignments on component mount
  useEffect(() => {
    loadSubjects();
    loadSubjectSets();
    loadGrades();
    loadCourses();
    loadSubjectAssignments();
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

  // Countdown timer for subject set delete confirmation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showDeleteSubjectSetModal && subjectSetCountdown > 0) {
      timer = setTimeout(() => setSubjectSetCountdown(subjectSetCountdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showDeleteSubjectSetModal, subjectSetCountdown]);

  // Countdown timer for subject assignment delete confirmation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showDeleteSubjectAssignmentModal && subjectAssignmentCountdown > 0) {
      timer = setTimeout(() => setSubjectAssignmentCountdown(subjectAssignmentCountdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showDeleteSubjectAssignmentModal, subjectAssignmentCountdown]);

  // Handle grade level selection/deselection
  const handleGradeLevelChange = (gradeLevel: number | undefined) => {
    setSelectedGradeLevel(gradeLevel);
  };

  // Handle course toggle
  const handleCourseToggle = (courseCode: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseCode)) {
        return prev.filter(code => code !== courseCode);
      } else {
        return [...prev, courseCode];
      }
    });
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

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadSubjectAssignments = async () => {
    try {
      setSubjectAssignmentLoading(true);
      setSubjectAssignmentError('');

      const response = await fetch('/api/subject-assignments');

      if (!response.ok) {
        throw new Error('Failed to load subject assignments');
      }

      const data = await response.json();
      setSubjectAssignments(data.subjectAssignments || []);
    } catch (error: any) {
      setSubjectAssignmentError('Failed to load subject assignments: ' + error.message);
    } finally {
      setSubjectAssignmentLoading(false);
    }
  };

  const loadSubjectSets = async () => {
    try {
      setSubjectSetLoading(true);
      setSubjectSetError('');

      const response = await fetch('/api/subject-sets');

      if (!response.ok) {
        throw new Error('Failed to load subject sets');
      }

      const data = await response.json();
      setSubjectSets(data.subjectSets || []);
    } catch (error: any) {
      setSubjectSetError('Failed to load subject sets: ' + error.message);
    } finally {
      setSubjectSetLoading(false);
    }
  };

  const handleCreateSubject = async (subjectData: { code: string; name: string; description: string; gradeLevels: number[]; courseCodes: string[]; courseSelections: { code: string; year: number; semester: 'first-sem' | 'second-sem' }[]; color: SubjectColor; lectureUnits: number; labUnits: number; prerequisites: string[]; postrequisites: string[] }) => {
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

  const handleUpdateSubject = async (subjectData: { code: string; name: string; description: string; gradeLevels: number[]; courseCodes: string[]; courseSelections: { code: string; year: number; semester: 'first-sem' | 'second-sem' }[]; color: SubjectColor; lectureUnits: number; labUnits: number; prerequisites: string[]; postrequisites: string[] }) => {
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
      gradeLevels: subject.gradeLevels || [subject.gradeLevel || 7], // Fallback for old data
      courseCodes: subject.courseCodes || [],
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

  // Subject Set Handlers
  const handleCreateSubjectSet = async (subjectSetData: { name: string; description: string; gradeLevels: number[]; courseCodes: string[]; color: any; subjects: string[] }) => {
    try {
      setSubjectSetActionLoading(true);
      setSubjectSetError('');
      setSubjectSetSuccess('');

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
      setSubjectSetSuccess('Subject set created successfully!');
      setShowCreateSubjectSetModal(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSubjectSetSuccess(''), 3000);
    } catch (error: any) {
      setSubjectSetError(error.message);
    } finally {
      setSubjectSetActionLoading(false);
    }
  };

  const handleUpdateSubjectSet = async (subjectSetData: { name: string; description: string; gradeLevels: number[]; courseCodes: string[]; color: any; subjects: string[] }) => {
    try {
      setSubjectSetActionLoading(true);
      setSubjectSetError('');
      setSubjectSetSuccess('');

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
      setSubjectSetSuccess('Subject set updated successfully!');
      setShowEditSubjectSetModal(false);
      setEditingSubjectSet(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSubjectSetSuccess(''), 3000);
    } catch (error: any) {
      setSubjectSetError(error.message);
    } finally {
      setSubjectSetActionLoading(false);
    }
  };

  const handleDeleteSubjectSet = (subjectSet: SubjectSetData) => {
    setDeletingSubjectSet(subjectSet);
    setShowDeleteSubjectSetModal(true);
    setSubjectSetCountdown(5);
    setSubjectSetIsConfirmed(false);
  };

  const handleConfirmDeleteSubjectSet = async () => {
    if (!deletingSubjectSet) return;

    try {
      setSubjectSetActionLoading(true);
      setSubjectSetError('');
      setSubjectSetSuccess('');

      const response = await fetch(`/api/subject-sets/${deletingSubjectSet.id}?registrarUid=${registrarUid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete subject set');
      }

      setSubjectSets(prev => prev.filter(s => s.id !== deletingSubjectSet.id));
      toast.success(`Subject set "${deletingSubjectSet.name}" deleted successfully!`);
      setShowDeleteSubjectSetModal(false);
      setDeletingSubjectSet(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject set');
    } finally {
      setSubjectSetActionLoading(false);
    }
  };

  const handleCreateNewSubjectSet = () => {
    setShowCreateSubjectSetModal(true);
    setEditingSubjectSet(null);
    setSubjectSetError('');
    setSubjectSetSuccess('');
  };

  const handleEditSubjectSet = (subjectSet: SubjectSetData) => {
    setEditingSubjectSet(subjectSet);
    setShowEditSubjectSetModal(true);
    setSubjectSetError('');
    setSubjectSetSuccess('');
  };

  const handleViewSubjectSet = (subjectSet: SubjectSetData) => {
    setViewingSubjectSet(subjectSet);
    setShowViewSubjectSetModal(true);
  };

  const handleSubjectSetCancel = () => {
    setShowCreateSubjectSetModal(false);
    setShowEditSubjectSetModal(false);
    setShowDeleteSubjectSetModal(false);
    setShowViewSubjectSetModal(false);
    setEditingSubjectSet(null);
    setDeletingSubjectSet(null);
    setViewingSubjectSet(null);
    setSubjectSetCountdown(5);
    setSubjectSetIsConfirmed(false);
    setSubjectSetError('');
    setSubjectSetSuccess('');
  };

  const getSubjectDetails = (subjectId: string) => {
    return subjects.find(subject => subject.id === subjectId);
  };

  const clearSubjectSetFilters = () => {
    setSubjectSetSearchQuery('');
    setSelectedSubjectSetGradeLevel(null);
  };

  const clearSubjectAssignmentFilters = () => {
    setSubjectAssignmentSearchQuery('');
    setSelectedSubjectAssignmentCourse(null);
  };

  // Subject Assignment Handlers
  const handleCreateSubjectAssignment = async (assignmentData: {
    level: 'high-school' | 'college';
    gradeLevel?: number;
    courseCode?: string;
    courseName?: string;
    yearLevel?: number;
    semester?: 'first-sem' | 'second-sem';
    subjectSetId: string;
  }) => {
    try {
      setSubjectAssignmentActionLoading(true);
      setSubjectAssignmentError('');
      setSubjectAssignmentSuccess('');

      const response = await fetch('/api/subject-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...assignmentData,
          registrarUid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subject assignment');
      }

      setSubjectAssignments(prev => [...prev, data.subjectAssignment]);
      setSubjectAssignmentSuccess('Subject assignment created successfully!');
      setShowCreateSubjectAssignmentModal(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSubjectAssignmentSuccess(''), 3000);
    } catch (error: any) {
      setSubjectAssignmentError(error.message);
    } finally {
      setSubjectAssignmentActionLoading(false);
    }
  };

  const handleUpdateSubjectAssignment = async (assignmentData: {
    level: 'high-school' | 'college';
    gradeLevel?: number;
    courseCode?: string;
    courseName?: string;
    yearLevel?: number;
    semester?: 'first-sem' | 'second-sem';
    subjectSetId: string;
  }) => {
    try {
      setSubjectAssignmentActionLoading(true);
      setSubjectAssignmentError('');
      setSubjectAssignmentSuccess('');

      if (!editingSubjectAssignment) return;

      const response = await fetch(`/api/subject-assignments/${editingSubjectAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...assignmentData,
          registrarUid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subject assignment');
      }

      setSubjectAssignments(prev =>
        prev.map(assignment =>
          assignment.id === editingSubjectAssignment.id ? data.subjectAssignment : assignment
        )
      );
      setSubjectAssignmentSuccess('Subject assignment updated successfully!');
      setShowEditSubjectAssignmentModal(false);
      setEditingSubjectAssignment(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSubjectAssignmentSuccess(''), 3000);
    } catch (error: any) {
      setSubjectAssignmentError(error.message);
    } finally {
      setSubjectAssignmentActionLoading(false);
    }
  };

  const handleDeleteSubjectAssignment = async () => {
    if (!deletingSubjectAssignment) return;

    try {
      setSubjectAssignmentActionLoading(true);
      setSubjectAssignmentError('');
      setSubjectAssignmentSuccess('');

      const response = await fetch(`/api/subject-assignments/${deletingSubjectAssignment.id}?registrarUid=${registrarUid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete subject assignment');
      }

      setSubjectAssignments(prev => prev.filter(a => a.id !== deletingSubjectAssignment.id));
      setSubjectAssignmentSuccess(`Subject assignment "${deletingSubjectAssignment.name}" deleted successfully!`);
      setShowDeleteSubjectAssignmentModal(false);
      setDeletingSubjectAssignment(null);

      setTimeout(() => setSubjectAssignmentSuccess(''), 3000);
    } catch (error: any) {
      setSubjectAssignmentError(error.message || 'Failed to delete subject assignment');
    } finally {
      setSubjectAssignmentActionLoading(false);
    }
  };

  const handleSubjectAssignmentCancel = () => {
    setShowCreateSubjectAssignmentModal(false);
    setShowEditSubjectAssignmentModal(false);
    setShowDeleteSubjectAssignmentModal(false);
    setShowViewSubjectAssignmentModal(false);
    setEditingSubjectAssignment(null);
    setDeletingSubjectAssignment(null);
    setViewingSubjectAssignment(null);
    setSubjectAssignmentCountdown(5);
    setSubjectAssignmentIsConfirmed(false);
    setSubjectAssignmentError('');
    setSubjectAssignmentSuccess('');
  };

  // Function to get appropriate icon based on subject content
  const getSubjectIcon = (subject: SubjectData) => {
    const subjectName = subject.name.toLowerCase();
    const subjectCode = subject.code.toLowerCase();

    // Math-related subjects
    if (subjectName.includes('math') || subjectName.includes('calculus') || subjectName.includes('algebra') ||
        subjectName.includes('geometry') || subjectName.includes('trigonometry') || subjectName.includes('statistics') ||
        subjectCode.includes('math') || subjectCode.includes('calc')) {
      return Calculator;
    }

    // Science-related subjects
    if (subjectName.includes('science') || subjectName.includes('physics') || subjectName.includes('chemistry') ||
        subjectName.includes('biology') || subjectName.includes('geology') || subjectName.includes('astronomy') ||
        subjectCode.includes('sci') || subjectCode.includes('phy') || subjectCode.includes('chem') ||
        subjectCode.includes('bio')) {
      return Atom;
    }

    // Language/English subjects
    if (subjectName.includes('english') || subjectName.includes('language') || subjectName.includes('literature') ||
        subjectName.includes('grammar') || subjectName.includes('reading') || subjectName.includes('writing') ||
        subjectCode.includes('eng') || subjectCode.includes('lang')) {
      return Book;
    }

    // Social Studies/History subjects
    if (subjectName.includes('history') || subjectName.includes('social') || subjectName.includes('geography') ||
        subjectName.includes('civics') || subjectName.includes('economics') || subjectName.includes('government') ||
        subjectCode.includes('hist') || subjectCode.includes('soc') || subjectCode.includes('geo')) {
      return Globe;
    }

    // Computer/Technology subjects
    if (subjectName.includes('computer') || subjectName.includes('technology') || subjectName.includes('programming') ||
        subjectName.includes('coding') || subjectName.includes('ict') || subjectName.includes('digital') ||
        subjectCode.includes('comp') || subjectCode.includes('tech') || subjectCode.includes('prog')) {
      return Monitor;
    }

    // Art subjects
    if (subjectName.includes('art') || subjectName.includes('drawing') || subjectName.includes('painting') ||
        subjectName.includes('visual') || subjectName.includes('design') ||
        subjectCode.includes('art') || subjectCode.includes('draw')) {
      return Palette;
    }

    // Music subjects
    if (subjectName.includes('music') || subjectName.includes('choir') || subjectName.includes('band') ||
        subjectName.includes('orchestra') || subjectCode.includes('music')) {
      return MusicNote;
    }

    // Default icon for other subjects
    return BookOpen;
  };

  // Filter subject sets based on search query and grade level
  const filteredSubjectSets = useMemo(() => {
    let filtered = subjectSets;

    // Apply search filter
    if (subjectSetSearchQuery.trim()) {
      const searchTerm = subjectSetSearchQuery.toLowerCase();
      filtered = filtered.filter((subjectSet) => (
        subjectSet.name.toLowerCase().includes(searchTerm) ||
        subjectSet.description.toLowerCase().includes(searchTerm)
      ));
    }

    // Apply grade level filter
    if (selectedSubjectSetGradeLevel) {
      filtered = filtered.filter((subjectSet) => subjectSet.gradeLevel === selectedSubjectSetGradeLevel);
    }

    return filtered;
  }, [subjectSets, subjectSetSearchQuery, selectedSubjectSetGradeLevel]);

  // Filter subject assignments based on search query and course
  const filteredSubjectAssignments = useMemo(() => {
    let filtered = subjectAssignments;

    // Apply search filter
    if (subjectAssignmentSearchQuery.trim()) {
      const searchTerm = subjectAssignmentSearchQuery.toLowerCase();
      filtered = filtered.filter((assignment) => (
        assignment.courseCode.toLowerCase().includes(searchTerm) ||
        assignment.courseName.toLowerCase().includes(searchTerm) ||
        assignment.name.toLowerCase().includes(searchTerm)
      ));
    }

    // Apply course filter
    if (selectedSubjectAssignmentCourse) {
      filtered = filtered.filter((assignment) => assignment.courseCode === selectedSubjectAssignmentCourse);
    }

    return filtered;
  }, [subjectAssignments, subjectAssignmentSearchQuery, selectedSubjectAssignmentCourse]);

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

  // Helper function to get course color from course code
  const getCourseColorValue = (courseCode: string): string => {
    const course = courses.find(c => c.code === courseCode);
    const color = course?.color || 'blue-800';
    return getColorValue(color);
  };

  // Helper function to get grade color from grade level
  const getGradeColorValue = (gradeLevel: number): string => {
    const grade = grades.find(g => g.gradeLevel === gradeLevel);
    const color = grade?.color || 'blue-800';
    return getColorValue(color);
  };

  // Helper function to get assignment card color
  const getAssignmentCardColor = (assignment: any): string => {
    if (assignment.level === 'college' && assignment.courseCode) {
      return getCourseColorValue(assignment.courseCode);
    } else if (assignment.level === 'high-school' && assignment.gradeLevel) {
      return getGradeColorValue(assignment.gradeLevel);
    }
    return '#1e3a8a'; // Default to blue-800
  };

  // Compute total units for a subject set
  const computeSubjectSetUnits = (subjectSetId: string) => {
    try {
      const subjectSet = subjectSets.find(ss => ss.id === subjectSetId);
      if (!subjectSet) return { lecture: 0, lab: 0, total: 0 };
      const lecture = subjectSet.subjects.reduce((sum: number, id: string) => {
        const subj: any = subjects.find((s: any) => s.id === id);
        return sum + (subj?.lectureUnits || 0);
      }, 0);
      const lab = subjectSet.subjects.reduce((sum: number, id: string) => {
        const subj: any = subjects.find((s: any) => s.id === id);
        return sum + (subj?.labUnits || 0);
      }, 0);
      return { lecture, lab, total: lecture + lab };
    } catch {
      return { lecture: 0, lab: 0, total: 0 };
    }
  };

  // Load subject details for view modal
  const loadSubjectDetailsForView = async (subjectIds: string[]) => {
    try {
      setLoadingViewingSubjects(true);
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        const allSubjects = data.subjects || [];
        // Filter subjects that are in the selected subject set
        const filteredSubjects = allSubjects.filter((subject: any) => 
          subjectIds.includes(subject.id)
        );
        setViewingSubjectDetails(filteredSubjects);
      }
    } catch (error) {
      console.error('Error loading subject details:', error);
      setViewingSubjectDetails([]);
    } finally {
      setLoadingViewingSubjects(false);
    }
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

  // Show success/error messages
  const renderMessages = () => {
    const currentError = activeTab === 'subjects' ? error : activeTab === 'subject-sets' ? subjectSetError : subjectAssignmentError;
    const currentSuccess = activeTab === 'subjects' ? success : activeTab === 'subject-sets' ? subjectSetSuccess : subjectAssignmentSuccess;

    if (!currentError && !currentSuccess) return null;

    return (
      <div className="mb-6">
        {currentError && (
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
                  {currentError}
                </p>
              </div>
            </div>
          </div>
        )}

        {currentSuccess && (
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
                  {currentSuccess}
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

        {/* Tab Header */}
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
                Subject Management
              </h1>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Manage subjects and subject sets for your curriculum
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'subjects'
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <div className={`w-6 h-6 flex items-center justify-center ${
                activeTab === 'subjects' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                <BookOpen
                  size={14}
                  className={activeTab === 'subjects' ? 'text-white' : 'text-gray-600'}
                  weight="fill"
                />
              </div>
              Subjects
              <span className={`ml-1 px-1.5 py-0.5 text-xs font-medium ${
                activeTab === 'subjects'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {subjects.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('subject-sets')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'subject-sets'
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <div className={`w-6 h-6 flex items-center justify-center ${
                activeTab === 'subject-sets' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                <Books
                  size={14}
                  className={activeTab === 'subject-sets' ? 'text-white' : 'text-gray-600'}
                  weight="fill"
                />
              </div>
              Subject Sets
              <span className={`ml-1 px-1.5 py-0.5 text-xs font-medium ${
                activeTab === 'subject-sets'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {subjectSets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('subject-assignments')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'subject-assignments'
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <div className={`w-6 h-6 flex items-center justify-center ${
                activeTab === 'subject-assignments' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                <Calculator
                  size={14}
                  className={activeTab === 'subject-assignments' ? 'text-white' : 'text-gray-600'}
                  weight="fill"
                />
              </div>
              Subject Assignments
              <span className={`ml-1 px-1.5 py-0.5 text-xs font-medium ${
                activeTab === 'subject-assignments'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {subjectAssignments.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'subjects' ? (
          <div className="space-y-6">
            <SubjectList
              subjects={subjects}
              grades={grades}
              courses={courses}
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
              selectedCourses={selectedCourses}
              onCourseToggle={handleCourseToggle}
            />
          </div>
        ) : activeTab === 'subject-sets' ? (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search subject sets..."
                      value={subjectSetSearchQuery}
                      onChange={(e) => setSubjectSetSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300   focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <select
                    value={selectedSubjectSetGradeLevel || ''}
                    onChange={(e) => setSelectedSubjectSetGradeLevel(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300   focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <option value="">All Grades</option>
                    {[7, 8, 9, 10, 11, 12].map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  {(subjectSetSearchQuery || selectedSubjectSetGradeLevel) && (
                    <Button
                      variant="ghost"
                      onClick={clearSubjectSetFilters}
                      className="text-gray-500 hover:text-gray-700"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    onClick={handleCreateNewSubjectSet}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <Plus size={16} className="mr-2" />
                    Create Subject Set
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Showing {filteredSubjectSets.length} of {subjectSets.length} subject sets
              </span>
            </div>

            {/* Subject Sets Grid */}
            {subjectSetLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6 bg-gray-50 border-0 border-r-0 border-b-0">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200  "></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-5 bg-gray-200   w-3/4"></div>
                          <div className="h-4 bg-gray-100   w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100   w-full"></div>
                        <div className="h-4 bg-gray-100   w-2/3"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredSubjectSets.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={64} className="mx-auto text-gray-400 mb-4" weight="duotone" />
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
                  {subjectSetSearchQuery || selectedSubjectSetGradeLevel
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first subject set'
                  }
                </p>
                <Button
                  onClick={handleCreateNewSubjectSet}
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

                          <div className={`w-14 h-14 bg-white flex items-center justify-center` }>
                            <BookOpen size={28} style={{ color: getColorValue(subjectSet.color) }} weight="fill" />
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
                        <div className="flex flex-wrap gap-2">
                          {subjectSet.subjects.slice(0, 3).map((subjectId) => {
                            const subject = getSubjectDetails(subjectId);
                            if (!subject) return null;

                            const IconComponent = getSubjectIcon(subject);
                            return (
                              <div
                                key={subjectId}
                                className="flex items-center gap-2 px-3 py-2 bg-white/20 text-white text-xs  -lg border border-white/30"
                                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                              >
                                <div className="w-4 h-4 bg-white/30 flex items-center justify-center">
                                  <IconComponent size={10} className="text-white" weight="fill" />
                                </div>
                                <span className="truncate">{subject.code} {subject.name}</span>
                              </div>
                            );
                          })}
                          {subjectSet.subjects.length > 3 && (
                            <div
                              className="flex items-center gap-2 px-3 py-2 bg-white/30 text-white text-xs  -lg border border-white/40"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              <div className="w-4 h-4 bg-white/40 flex items-center justify-center">
                                <BookOpen size={10} className="text-white" weight="fill" />
                              </div>
                              <span>+{subjectSet.subjects.length - 3} more</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-white/20">
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSubjectSet(subjectSet)}
                            className="text-white/90 bg-white/15 hover:bg-white/25 rounded-none w-full justify-center"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            <Eye size={16} className="mr-2" /> Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSubjectSet(subjectSet)}
                            className="text-white/90 bg-white/15 hover:bg-white/25 rounded-none w-full justify-center"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            <Pencil size={16} className="mr-2" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubjectSet(subjectSet)}
                            className="text-white/90 bg-white/15 hover:bg-white/25 rounded-none w-full justify-center"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            <Trash size={16} className="mr-2" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search subject assignments..."
                      value={subjectAssignmentSearchQuery}
                      onChange={(e) => setSubjectAssignmentSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <select
                    value={selectedSubjectAssignmentCourse || ''}
                    onChange={(e) => setSelectedSubjectAssignmentCourse(e.target.value || null)}
                    className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course.code} value={course.code}>{course.code} - {course.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  {(subjectAssignmentSearchQuery || selectedSubjectAssignmentCourse) && (
                    <Button
                      variant="ghost"
                      onClick={clearSubjectAssignmentFilters}
                      className="text-gray-500 hover:text-gray-700"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowCreateSubjectAssignmentModal(true)}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <Plus size={16} className="mr-2" />
                    Create Assignment
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Showing {filteredSubjectAssignments.length} of {subjectAssignments.length} subject assignments
              </span>
            </div>

            {/* Subject Assignments Grid */}
            {subjectAssignmentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6 bg-gray-50 border-0 border-r-0 border-b-0">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-5 bg-gray-200 w-3/4"></div>
                          <div className="h-4 bg-gray-100 w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 w-full"></div>
                        <div className="h-4 bg-gray-100 w-2/3"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredSubjectAssignments.length === 0 ? (
              <div className="text-center py-12">
                <Calculator size={64} className="mx-auto text-gray-400 mb-4" weight="duotone" />
                <h3
                  className="text-lg font-medium text-gray-900 mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  No subject assignments found
                </h3>
                <p
                  className="text-sm text-gray-600 mb-6"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {subjectAssignmentSearchQuery || selectedSubjectAssignmentCourse
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first subject assignment'
                  }
                </p>
                <Button
                  onClick={() => setShowCreateSubjectAssignmentModal(true)}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <Plus size={16} className="mr-2" />
                  Create Assignment
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjectAssignments.map((assignment) => {
                  const cardColor = getAssignmentCardColor(assignment);
                  return (
                  <Card
                    key={assignment.id}
                    className="group p-6 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
                    style={{ backgroundColor: cardColor }}
                  >
                    <div className="space-y-4 flex flex-col justify-between h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-14 h-14 bg-white flex items-center justify-center">
                            <Calculator size={28} style={{ color: cardColor }} weight="fill" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-lg font-medium text-white truncate"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {assignment.name}
                            </h3>
                            <p
                              className="text-sm text-white/90"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {assignment.level === 'college' 
                                ? `${assignment.courseCode} Year ${assignment.yearLevel} ${assignment.semester === 'first-sem' ? 'Q1' : 'Q2'}`
                                : (() => {
                                    const grade = grades.find(g => g.gradeLevel === assignment.gradeLevel);
                                    if (grade) {
                                      if (grade.department === 'SHS' && grade.strand) {
                                        return `Grade ${grade.gradeLevel} - ${grade.strand}`;
                                      }
                                      return `Grade ${grade.gradeLevel} (${grade.department})`;
                                    }
                                    return `Grade ${assignment.gradeLevel}`;
                                  })()}
                            </p>
                            {(() => {
                              const units = computeSubjectSetUnits(assignment.subjectSetId);
                              return (
                                <p
                                  className="text-xs text-white/80 mt-1"
                                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                >
                                  Units: {units.total} (Lec: {units.lecture}, Lab: {units.lab})
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      </div>


                      {/* Subject Sets Preview */}
                      <div className="space-y-2">
                    
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const subjectSet = subjectSets.find(ss => ss.id === assignment.subjectSetId);
                            if (!subjectSet) return null;

                            return (
                              <>
                                {/* Subject Set name badge */}
                                <div
                                  className="flex items-center gap-2 px-3 py-2 bg-white/20 text-white text-xs rounded-lg border border-white/30"
                                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                >
                                  <div className="w-4 h-4 bg-white/30 flex items-center justify-center">
                                    <Books size={10} className="text-white" weight="fill" />
                                  </div>
                                  <span className="truncate">{subjectSet.name}</span>
                                </div>

                                {/* Subject codes preview */}
                                {subjectSet.subjects.slice(0, 6).map((subjectId: string, idx: number) => {
                                  const subj: any = subjects.find((s: any) => s.id === subjectId);
                                  if (!subj) return null;
                                  return (
                                    <div
                                      key={`${subjectId}-${idx}`}
                                      className="flex items-center gap-2 px-2 py-1 bg-white/10 text-white text-xs rounded border border-white/20"
                                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                    >
                                      <span className="truncate">{subj.code}</span>
                                    </div>
                                  );
                                })}

                                {/* +N more badge */}
                                {subjectSet.subjects.length > 6 && (
                                  <div
                                    className="flex items-center gap-2 px-2 py-1 bg-white/10 text-white text-xs rounded border border-white/20"
                                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                  >
                                    +{subjectSet.subjects.length - 6} more
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-white/20">
                        <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setViewingSubjectAssignment(assignment);
                            setShowViewSubjectAssignmentModal(true);
                            // Load subject details
                            const subjectSet = subjectSets.find(ss => ss.id === assignment.subjectSetId);
                            if (subjectSet && subjectSet.subjects.length > 0) {
                              await loadSubjectDetailsForView(subjectSet.subjects);
                            } else {
                              setViewingSubjectDetails([]);
                            }
                          }}
                          className="text-white/90 bg-white/15 hover:bg-white/25 rounded-none w-full justify-center"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          <Eye size={16} className="mr-2" /> Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSubjectAssignment(assignment);
                            setShowEditSubjectAssignmentModal(true);
                          }}
                          className="text-white/90 bg-white/15 hover:bg-white/25 rounded-none w-full justify-center"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          <Pencil size={16} className="mr-2" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingSubjectAssignment(assignment);
                            setShowDeleteSubjectAssignmentModal(true);
                            setSubjectAssignmentCountdown(5);
                            setSubjectAssignmentIsConfirmed(false);
                          }}
                          className="text-white/90 bg-white/15 hover:bg-white/25 rounded-none w-full justify-center"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          <Trash size={16} className="mr-2" /> Delete
                        </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );})}
              </div>
            )}
          </div>
        )}

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
            <div className="bg-white shadow-lg max-w-md w-full p-6">
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
                <div className="p-4 bg-red-50 border-1 shadow-sm border-red-600">
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
                      <div className="animate-spin  -full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
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
            <div className="bg-white shadow-lg max-w-2xl w-full p-6">
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
                    <div className={`px-3 py-2 bg-gray-100 border-1 shadow-sm border-blue-900`}>
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
                    <div className={`px-3 py-2 bg-gray-100 border-1 shadow-sm border-blue-900`}>
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
                  <div className={`px-4 py-3 bg-gray-100 border-1 shadow-sm border-blue-900 min-h-[120px]`}>
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
                    <div className={`px-3 py-2 bg-gray-100 border-1 shadow-sm border-blue-900`}>
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
                    <div className={`px-3 py-2 bg-gray-100 border-1 shadow-sm border-blue-900`}>
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

      {/* Create Subject Set Modal */}
      {showCreateSubjectSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !subjectSetActionLoading && handleSubjectSetCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <SubjectSetForm
              onSubmit={handleCreateSubjectSet}
              onCancel={handleSubjectSetCancel}
              initialData={undefined}
              isEditing={false}
              loading={subjectSetActionLoading}
              onSubjectsRefresh={loadSubjects}
            />
          </div>
        </div>
      )}

      {/* Edit Subject Set Modal */}
      {showEditSubjectSetModal && editingSubjectSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !subjectSetActionLoading && handleSubjectSetCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <SubjectSetForm
              onSubmit={handleUpdateSubjectSet}
              onCancel={handleSubjectSetCancel}
              initialData={editingSubjectSet}
              isEditing={true}
              loading={subjectSetActionLoading}
              onSubjectsRefresh={loadSubjects}
            />
          </div>
        </div>
      )}

      {/* Delete Subject Set Modal */}
      {showDeleteSubjectSetModal && deletingSubjectSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !subjectSetActionLoading && handleSubjectSetCancel()}
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
                  onClick={handleSubjectSetCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={subjectSetActionLoading}
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
                      id="confirm-delete-subject-set"
                      checked={subjectSetIsConfirmed}
                      onChange={(e) => setSubjectSetIsConfirmed(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                      disabled={subjectSetCountdown > 0}
                    />
                    <label
                      htmlFor="confirm-delete-subject-set"
                      className={`text-sm ${subjectSetCountdown > 0 ? 'text-gray-400' : 'text-gray-700'}`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      I understand this action cannot be undone
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSubjectSetCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={subjectSetActionLoading}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteSubjectSet}
                  disabled={subjectSetCountdown > 0 || !subjectSetIsConfirmed || subjectSetActionLoading}
                  className={`px-4 py-2 text-sm font-medium text-white transition-colors ${
                    subjectSetCountdown > 0 || !subjectSetIsConfirmed || subjectSetActionLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {subjectSetActionLoading ? (
                    <>
                      <div className="animate-spin  -full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash size={16} className="mr-2 inline" />
                      Delete Subject Set {subjectSetCountdown > 0 && `(${subjectSetCountdown})`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Subject Set Details Modal */}
      {showViewSubjectSetModal && viewingSubjectSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !subjectSetActionLoading && handleSubjectSetCancel()}
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
                  onClick={handleSubjectSetCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={subjectSetActionLoading}
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
                          className="flex items-center space-x-4 p-4 bg-gray-50 border border-gray-200"
                        >
                          <div className={`w-10 h-10 ${subject ? `bg-${subject.color}` : 'bg-gray-400'} flex items-center justify-center`}>
                            {(() => {
                              if (!subject) return <BookOpen size={16} className="text-white" weight="fill" />;
                              const IconComponent = getSubjectIcon(subject);
                              return <IconComponent size={16} className="text-white" weight="fill" />;
                            })()}
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
                  onClick={handleSubjectSetCancel}
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

      {/* Create Subject Assignment Modal */}
      {showCreateSubjectAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !subjectAssignmentActionLoading && handleSubjectAssignmentCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <SubjectAssignmentForm
              onSubmit={handleCreateSubjectAssignment}
              onCancel={handleSubjectAssignmentCancel}
              initialData={undefined}
              isEditing={false}
              loading={subjectAssignmentActionLoading}
            />
          </div>
        </div>
      )}

      {/* Edit Subject Assignment Modal */}
      {showEditSubjectAssignmentModal && editingSubjectAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !subjectAssignmentActionLoading && handleSubjectAssignmentCancel()}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <SubjectAssignmentForm
              onSubmit={handleUpdateSubjectAssignment}
              onCancel={handleSubjectAssignmentCancel}
              initialData={editingSubjectAssignment}
              isEditing={true}
              loading={subjectAssignmentActionLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Subject Assignment Modal */}
      {showDeleteSubjectAssignmentModal && deletingSubjectAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !subjectAssignmentActionLoading && setShowDeleteSubjectAssignmentModal(false)}
          ></div>
          <div className="relative animate-in fade-in duration-300">
            <div className="bg-white shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
                    <Warning size={20} className="text-red-600" weight="fill" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    Delete Subject Assignment
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteSubjectAssignmentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={subjectAssignmentActionLoading}
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
                    {deletingSubjectAssignment.name}
                  </p>
                  <p className="text-xs text-red-600 mt-2" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    This action cannot be undone and will permanently remove the subject assignment from the system.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="confirm-delete-assignment"
                      checked={subjectAssignmentIsConfirmed}
                      onChange={(e) => setSubjectAssignmentIsConfirmed(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                      disabled={subjectAssignmentCountdown > 0}
                    />
                    <label
                      htmlFor="confirm-delete-assignment"
                      className={`text-sm ${subjectAssignmentCountdown > 0 ? 'text-gray-400' : 'text-gray-700'}`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      I understand this action cannot be undone
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSubjectAssignmentCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={subjectAssignmentActionLoading}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubjectAssignment}
                  disabled={subjectAssignmentCountdown > 0 || !subjectAssignmentIsConfirmed || subjectAssignmentActionLoading}
                  className={`px-4 py-2 text-sm font-medium text-white transition-colors ${
                    subjectAssignmentCountdown > 0 || !subjectAssignmentIsConfirmed || subjectAssignmentActionLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {subjectAssignmentActionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash size={16} className="mr-2 inline" />
                      Delete Assignment {subjectAssignmentCountdown > 0 && `(${subjectAssignmentCountdown})`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Subject Assignment Modal */}
      {showViewSubjectAssignmentModal && viewingSubjectAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-sm max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <Calculator size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    Subject Assignment Details
                  </h3>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    View all subjects in this assignment
                  </p>
                </div>
              </div>
              <button
                onClick={handleSubjectAssignmentCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={subjectAssignmentActionLoading}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Assignment Summary */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      Assignment Name
                    </p>
                    <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingSubjectAssignment.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      Level
                    </p>
                    <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingSubjectAssignment.level === 'high-school' ? 'High School' : 'College'}
                    </p>
                  </div>
                  {viewingSubjectAssignment.level === 'high-school' ? (
                    <div>
                      <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        Grade Level
                      </p>
                      <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        {(() => {
                          const selectedGrade = grades.find(g => g.gradeLevel === viewingSubjectAssignment.gradeLevel);
                          if (selectedGrade) {
                            if (selectedGrade.department === 'SHS' && selectedGrade.strand) {
                              return `Grade ${selectedGrade.gradeLevel} - ${selectedGrade.strand}`;
                            }
                            return `Grade ${selectedGrade.gradeLevel} (${selectedGrade.department})`;
                          }
                          return `Grade ${viewingSubjectAssignment.gradeLevel}`;
                        })()}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          Course
                        </p>
                        <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {viewingSubjectAssignment.courseCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          Year Level
                        </p>
                        <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Year {viewingSubjectAssignment.yearLevel}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                          Semester
                        </p>
                        <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          {viewingSubjectAssignment.semester === 'first-sem' ? 'First Semester' : 'Second Semester'}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      Subject Set
                    </p>
                    <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {subjectSets.find(s => s.id === viewingSubjectAssignment.subjectSetId)?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subjects Table */}
              {loadingViewingSubjects ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      Loading subjects...
                    </p>
                  </div>
                </div>
              ) : viewingSubjectDetails.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-md">
                    <Books size={48} className="text-yellow-600 mx-auto mb-4" weight="duotone" />
                    <p className="text-sm text-yellow-800" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                      No subjects found in this subject set
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Subject Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Subject Name
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Lecture Units
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Lab Units
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                          Total Units
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewingSubjectDetails.map((subject, index) => {
                        const totalUnits = (subject.lectureUnits || 0) + (subject.labUnits || 0);
                        return (
                          <tr key={subject.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                              {subject.code || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                              {subject.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-center" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                              {subject.lectureUnits || 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-center" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                              {subject.labUnits || 0}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                              {totalUnits}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900 text-right" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          {viewingSubjectDetails.reduce((sum, s) => sum + (s.lectureUnits || 0), 0)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          {viewingSubjectDetails.reduce((sum, s) => sum + (s.labUnits || 0), 0)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          {viewingSubjectDetails.reduce((sum, s) => sum + (s.lectureUnits || 0) + (s.labUnits || 0), 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSubjectAssignmentCancel}
                disabled={subjectAssignmentActionLoading}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <LoaderOverlay
        isVisible={actionLoading || subjectSetActionLoading || subjectAssignmentActionLoading}
        message={actionLoading ? "Processing subject..." : subjectSetActionLoading ? "Processing subject set..." : "Processing subject assignment..."}
      />
    </div>
  </>
);
}
