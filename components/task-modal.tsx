'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import TaskColorPicker from './task-color-picker'
import { Task, TaskColor, TaskPriority } from '@/lib/types/task'
import { Sparkle } from '@phosphor-icons/react'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: {
    title: string
    description?: string
    priority: TaskPriority
    dueDate?: string
    color: TaskColor
  }) => Promise<void>
  editingTask: Task | null
  isSaving?: boolean
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  editingTask,
  isSaving = false,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [color, setColor] = useState<TaskColor>('blue-900')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title)
      setDescription(editingTask.description || '')
      setPriority(editingTask.priority || 'medium')
      setDueDate(editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '')
      setColor(editingTask.color)
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
      setColor('blue-900')
    }
  }, [editingTask, isOpen])

  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      toast.error('Please enter a task title first', {
        autoClose: 3000,
      })
      return
    }

    try {
      setIsGenerating(true)
      const response = await fetch('/api/ai/task-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskTitle: title.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description')
      }

      if (data.description) {
        setDescription(data.description)
        toast.success('Description generated successfully', {
          autoClose: 2000,
        })
      }
    } catch (error) {
      console.error('Error generating description:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to generate description. Please try again.',
        {
          autoClose: 3000,
        }
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      return
    }

    await onSave({
      title,
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      color,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? 'Edit Task' : 'Create Task'}
      size="md"
    >
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium text-gray-700 mb-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              disabled={isSaving}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                className="block text-xs font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Description
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating || isSaving || !title.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                title="Generate description with AI"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={14} weight="fill" className="text-white" />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional) or click 'Generate with AI'"
              rows={3}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 resize-none"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                disabled={isSaving}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                disabled={isSaving}
              />
            </div>
          </div>

          <TaskColorPicker
            selectedColor={color}
            onColorChange={setColor}
            disabled={isSaving}
          />

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || isSaving}
              className="flex-1 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <span className="text-xs text-white">
                {isSaving
                  ? 'Saving...'
                  : editingTask
                  ? 'Update Task'
                  : 'Create Task'}
              </span>
            </Button>
            <Button
              onClick={onClose}
              disabled={isSaving}
              variant="outline"
              className="rounded-lg border-blue-200 text-gray-700 hover:bg-gray-50"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <span className="text-xs">Cancel</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

