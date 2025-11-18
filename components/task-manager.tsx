'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  CheckCircle,
  Circle,
  Trash,
  Plus,
  Pencil,
  ListChecks,
  Eye,
  MagnifyingGlass,
  Funnel,
  X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import TaskModal from './task-modal'
import TaskManagerSkeleton from './task-manager-skeleton'
import { Task, TaskColor, TaskStatus, TaskPriority } from '@/lib/types/task'
import { TaskDatabase } from '@/lib/task-database'

interface TaskManagerProps {
  registrarUid: string
}

const gradientMap: Record<TaskColor, string> = {
  'blue-900': 'from-blue-900 to-blue-800',
  'green-600': 'from-green-600 to-green-700',
  'yellow-600': 'from-yellow-600 to-yellow-700',
  'orange-600': 'from-orange-600 to-orange-700',
  'red-600': 'from-red-600 to-red-700',
  'purple-600': 'from-purple-600 to-purple-700',
  'pink-600': 'from-pink-600 to-pink-700',
  'teal-600': 'from-teal-600 to-teal-700',
}

const iconColorMap: Record<TaskColor, string> = {
  'blue-900': 'text-blue-900',
  'green-600': 'text-green-600',
  'yellow-600': 'text-yellow-600',
  'orange-600': 'text-orange-600',
  'red-600': 'text-red-600',
  'purple-600': 'text-purple-600',
  'pink-600': 'text-pink-600',
  'teal-600': 'text-teal-600',
}

// Function to get icon color as hex for inline styles (matching subject-list pattern)
const getTaskIconColor = (color: TaskColor): string => {
  const colorMap: Record<TaskColor, string> = {
    'blue-900': '#1e3a8a',
    'green-600': '#16a34a',
    'yellow-600': '#ca8a04',
    'orange-600': '#ea580c',
    'red-600': '#dc2626',
    'purple-600': '#9333ea',
    'pink-600': '#db2777',
    'teal-600': '#0d9488',
  }
  return colorMap[color] || '#1e3a8a'
}

export default function TaskManager({ registrarUid }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'completed'
  >('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>(
    'all'
  )
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!registrarUid) return

    const unsubscribe = TaskDatabase.subscribeToTasks(
      registrarUid,
      (newTasks) => {
        setTasks(newTasks)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [registrarUid])

  const handleOpenAddModal = () => {
    setEditingTask(null)
    setShowTaskModal(true)
  }

  const handleOpenViewModal = (task: Task) => {
    setViewingTask(task)
  }

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task)
    setViewingTask(null)
    setShowTaskModal(true)
  }

  const handleCloseModal = () => {
    setShowTaskModal(false)
    setEditingTask(null)
    setViewingTask(null)
  }

  const handleSaveTask = async (taskData: {
    title: string
    description?: string
    priority: TaskPriority
    dueDate?: string
    color: TaskColor
  }) => {
    if (!taskData.title.trim()) {
      toast.error('Please enter a task title', {
        autoClose: 3000,
      })
      return
    }

    try {
      setIsSaving(true)
      if (editingTask) {
        await TaskDatabase.updateTask(editingTask.id, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          color: taskData.color,
        })
        toast.success('Task updated successfully', {
          autoClose: 3000,
        })
      } else {
        await TaskDatabase.createTask(registrarUid, {
          title: taskData.title,
          description: taskData.description,
          status: 'pending',
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          color: taskData.color,
        })
        toast.success('Task created successfully', {
          autoClose: 3000,
        })
      }
      handleCloseModal()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(
        editingTask ? 'Failed to update task' : 'Failed to create task',
        {
          autoClose: 3000,
        }
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus: TaskStatus =
        task.status === 'pending' ? 'completed' : 'pending'
      await TaskDatabase.updateTask(task.id, {
        status: newStatus,
      })
      toast.success(
        newStatus === 'completed'
          ? 'Task marked as completed'
          : 'Task marked as pending',
        {
          autoClose: 2000,
        }
      )
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status', {
        autoClose: 3000,
      })
    }
  }

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return

    try {
      setIsDeleting(true)
      await TaskDatabase.deleteTask(deleteTaskId)
      toast.success('Task deleted successfully', {
        autoClose: 3000,
      })
      setDeleteTaskId(null)
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task', {
        autoClose: 3000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false
    }

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false
    }

    return true
  })

  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending')
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed')

  const hasActiveFilters =
    searchQuery.trim() || statusFilter !== 'all' || priorityFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  return (
    <div className="flex-1 flex flex-col p-5 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-medium text-gray-900"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          Task Manager
        </h2>
        <Button
          onClick={handleOpenAddModal}
          className="rounded-lg bg-blue-900 hover:bg-blue-800 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <Plus size={16} weight="bold" className="text-white" />
          <span className="text-xs text-white">Add Task</span>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 pr-10 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} weight="bold" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? 'border-blue-900 bg-blue-900 text-white'
                : 'border-blue-200 text-gray-700 hover:bg-blue-50'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            aria-label="Toggle filters"
          >
            <Funnel size={16} weight={hasActiveFilters ? 'fill' : 'regular'} />
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white"></span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-900 hover:text-blue-700 flex items-center gap-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <X size={12} weight="bold" />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Status Filter */}
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as 'all' | 'pending' | 'completed'
                    )
                  }
                  className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as 'all' | TaskPriority)
                  }
                  className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Task Modal */}
      {viewingTask && (
        <Modal
          isOpen={!!viewingTask}
          onClose={() => setViewingTask(null)}
          title="View Task"
          size="md"
        >
          <div className="p-6 space-y-4">
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Title
              </label>
              <p
                className="text-sm text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {viewingTask.title}
              </p>
            </div>

            {viewingTask.description && (
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Description
                </label>
                <p
                  className="text-sm text-gray-600 whitespace-pre-wrap"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {viewingTask.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Priority
                </label>
                {viewingTask.priority ? (
                  <span
                    className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                      viewingTask.priority === 'high'
                        ? 'bg-red-600/20 text-red-600'
                        : viewingTask.priority === 'medium'
                        ? 'bg-yellow-600/20 text-yellow-600'
                        : 'bg-green-600/20 text-green-600'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingTask.priority.charAt(0).toUpperCase() +
                      viewingTask.priority.slice(1)}
                  </span>
                ) : (
                  <p
                    className="text-sm text-gray-400"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Not set
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Status
                </label>
                <span
                  className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                    viewingTask.status === 'completed'
                      ? 'bg-green-600/20 text-green-600'
                      : 'bg-blue-600/20 text-blue-600'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingTask.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>

              {viewingTask.dueDate && (
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Due Date
                  </label>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {new Date(viewingTask.dueDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}

              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg ${
                      viewingTask.color === 'blue-900'
                        ? 'bg-blue-900'
                        : viewingTask.color === 'green-600'
                        ? 'bg-green-600'
                        : viewingTask.color === 'yellow-600'
                        ? 'bg-yellow-600'
                        : viewingTask.color === 'orange-600'
                        ? 'bg-orange-600'
                        : viewingTask.color === 'red-600'
                        ? 'bg-red-600'
                        : viewingTask.color === 'purple-600'
                        ? 'bg-purple-600'
                        : viewingTask.color === 'pink-600'
                        ? 'bg-pink-600'
                        : 'bg-teal-600'
                    }`}
                  />
                  <span
                    className="text-sm text-gray-600 capitalize"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {viewingTask.color.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setEditingTask(viewingTask)
                  setViewingTask(null)
                  setShowTaskModal(true)
                }}
                className="flex-1 rounded-lg bg-blue-900 hover:bg-blue-800"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <span className="text-xs text-white">Edit Task</span>
              </Button>
              <Button
                onClick={() => setViewingTask(null)}
                variant="outline"
                className="rounded-lg border-blue-200 text-gray-700 hover:bg-gray-50"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <span className="text-xs">Close</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Task Modal (Edit/Create) */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        editingTask={editingTask}
        isSaving={isSaving}
      />

      {/* Task List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {loading ? (
          <TaskManagerSkeleton />
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ListChecks size={32} className="text-white" weight="duotone" />
            </div>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {tasks.length === 0
                ? 'No tasks yet. Create your first task to get started!'
                : 'No tasks match your search or filters.'}
            </p>
            {hasActiveFilters && tasks.length > 0 && (
              <button
                onClick={clearFilters}
                className="mt-2 text-xs text-blue-900 hover:text-blue-700 underline"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h3
                  className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Pending ({pendingTasks.length})
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleStatus={handleToggleStatus}
                      onView={handleOpenViewModal}
                      onEdit={handleOpenEditModal}
                      onDelete={() => setDeleteTaskId(task.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3
                  className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleStatus={handleToggleStatus}
                      onView={handleOpenViewModal}
                      onEdit={handleOpenEditModal}
                      onDelete={() => setDeleteTaskId(task.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTaskId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3
              className="text-lg font-medium text-gray-900 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Delete Task
            </h3>
            <p
              className="text-sm text-gray-600 mb-4"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <span className="text-xs text-white">
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </span>
              </Button>
              <Button
                onClick={() => setDeleteTaskId(null)}
                disabled={isDeleting}
                variant="outline"
                className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <span className="text-xs">Cancel</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TaskItemProps {
  task: Task
  onToggleStatus: (task: Task) => void
  onView: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: () => void
}

function TaskItem({
  task,
  onToggleStatus,
  onView,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const isCompleted = task.status === 'completed'
  const gradientClass = gradientMap[task.color] || 'from-blue-900 to-blue-800'

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return null
    }
  }

  const getDaysLeft = (dueDateString?: string) => {
    if (!dueDateString) return null
    try {
      const dueDate = new Date(dueDateString)
      const now = new Date()

      // Reset time to midnight for accurate day calculation
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const due = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      )

      const diffTime = due.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        return { text: 'Overdue', days: Math.abs(diffDays), isOverdue: true }
      } else if (diffDays === 0) {
        return { text: 'Due today', days: 0, isOverdue: false }
      } else if (diffDays === 1) {
        return { text: '1 day left', days: 1, isOverdue: false }
      } else {
        return {
          text: `${diffDays} days left`,
          days: diffDays,
          isOverdue: false,
        }
      }
    } catch {
      return null
    }
  }

  const getProgressPercentage = (
    dueDateString?: string,
    createdAtString?: string
  ) => {
    if (!dueDateString) return 100

    try {
      const dueDate = new Date(dueDateString)
      const now = new Date()
      const createdAt = createdAtString ? new Date(createdAtString) : now

      // Reset time to midnight for accurate day calculation
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const due = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      )
      const created = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate()
      )

      const totalDays = Math.ceil(
        (due.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysPassed = Math.ceil(
        (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (totalDays <= 0) {
        // Task is already past due or due date is before creation
        return 0
      }

      // If task is overdue, return 0
      if (today > due) {
        return 0
      }

      // Calculate progress: (days passed / total days) * 100
      // But we want to show remaining time, so invert it
      const progress = Math.max(
        0,
        Math.min(100, (1 - daysPassed / totalDays) * 100)
      )

      return progress
    } catch {
      return 100
    }
  }

  const getPriorityLabel = (priority?: TaskPriority) => {
    switch (priority) {
      case 'high':
        return {
          label: 'High',
          bgColor: 'bg-red-600',
          textColor: 'text-red-600',
        }
      case 'medium':
        return {
          label: 'Medium',
          bgColor: 'bg-yellow-600',
          textColor: 'text-yellow-600',
        }
      case 'low':
        return {
          label: 'Low',
          bgColor: 'bg-green-600',
          textColor: 'text-green-600',
        }
      default:
        return { label: '', bgColor: '', textColor: '' }
    }
  }

  const priorityInfo = getPriorityLabel(task.priority)

  return (
    <div
      className={`p-3 sm:p-4 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <ListChecks
              size={20}
              className="sm:w-6 sm:h-6"
              style={{ color: getTaskIconColor(task.color) }}
              weight="fill"
            />
          </div>
          <h3
            className={`text-xs sm:text-sm font-medium text-white flex-1 min-w-0 ${
              isCompleted ? 'line-through' : ''
            }`}
            style={{
              fontFamily: 'Poppins',
              fontWeight: 500,
            }}
          >
            {task.title}
          </h3>
        </div>
        <button
          onClick={() => onToggleStatus(task)}
          className="flex-shrink-0"
          aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
        >
          {isCompleted ? (
            <CheckCircle
              size={16}
              className="sm:w-5 sm:h-5 text-white"
              weight="fill"
            />
          ) : (
            <Circle size={16} className="sm:w-5 sm:h-5 text-white/60" />
          )}
        </button>
      </div>

      {task.description && (
        <p
          className={`text-[11px] sm:text-xs text-white/90 mb-2 sm:mb-3 line-clamp-2 leading-relaxed ${
            isCompleted ? 'opacity-70' : ''
          }`}
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          {task.description.length > 100
            ? `${task.description.substring(0, 100)}...`
            : task.description}
        </p>
      )}

      {task.priority && (
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
          <div className="flex items-center bg-white backdrop-blur-sm rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-white">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${priorityInfo.bgColor} border border-white/20`}
            />
            <span
              className={`text-[9px] sm:text-[10px] font-medium ${priorityInfo.textColor}`}
            >
              {priorityInfo.label}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onView(task)}
          className="px-2 sm:px-3 py-1 rounded-lg bg-white hover:bg-white/90 transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs"
          style={{
            fontFamily: 'Poppins',
            fontWeight: 400,
            color: getTaskIconColor(task.color),
          }}
        >
          <Eye
            size={12}
            className="sm:w-3 sm:h-3"
            weight="fill"
            style={{ color: getTaskIconColor(task.color) }}
          />
          View
        </button>
        <button
          onClick={() => onEdit(task)}
          className="px-2 sm:px-3 py-1 rounded-lg bg-white hover:bg-white/90 transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs"
          style={{
            fontFamily: 'Poppins',
            fontWeight: 400,
            color: getTaskIconColor(task.color),
          }}
        >
          <Pencil
            size={12}
            className="sm:w-3 sm:h-3"
            weight="fill"
            style={{ color: getTaskIconColor(task.color) }}
          />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-2 sm:px-3 py-1 rounded-lg bg-white hover:bg-white/90 transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs"
          style={{
            fontFamily: 'Poppins',
            fontWeight: 400,
            color: '#dc2626',
          }}
        >
          <Trash
            size={12}
            className="sm:w-3 sm:h-3"
            weight="fill"
            style={{ color: '#dc2626' }}
          />
          Delete
        </button>
      </div>

      {task.dueDate &&
        (() => {
          const daysLeftInfo = getDaysLeft(task.dueDate)
          const progress = getProgressPercentage(task.dueDate, task.createdAt)

          if (!daysLeftInfo) return null

          return (
            <div className="space-y-2">
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden border border-white">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, progress))}%`,
                  }}
                />
              </div>

              {/* Due Date Text */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/80">
                <span
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: 300,
                  }}
                  className={daysLeftInfo.isOverdue ? 'text-red-300' : ''}
                >
                  {daysLeftInfo.text}
                </span>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
