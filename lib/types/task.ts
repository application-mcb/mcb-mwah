// Task color options (matching design requirements)
export const TASK_COLORS = [
  'blue-900',
  'green-600',
  'yellow-600',
  'orange-600',
  'red-600',
  'purple-600',
  'pink-600',
  'teal-600',
] as const

export type TaskColor = (typeof TASK_COLORS)[number]

export type TaskStatus = 'pending' | 'completed'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  registrarUid: string
  title: string
  description?: string
  status: TaskStatus
  priority?: TaskPriority
  dueDate?: string // ISO string
  color: TaskColor
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

export interface CreateTaskData
  extends Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt?: any // Can be FieldValue or Date
  updatedAt?: any // Can be FieldValue or Date
}

export interface UpdateTaskData extends Partial<Omit<Task, 'id' | 'registrarUid' | 'createdAt'>> {
  updatedAt?: any // Can be FieldValue or Date
}

