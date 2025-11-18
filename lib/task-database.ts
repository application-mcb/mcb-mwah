// Client-side Firestore database operations for tasks
// This file can be imported in client components

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Task, CreateTaskData, UpdateTaskData } from '@/lib/types/task'

// Utility function to serialize Firestore data for client components
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString()
  }

  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData)
  }

  if (typeof data === 'object') {
    const serialized: any = {}
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value)
    }
    return serialized
  }

  return data
}

export const TaskDatabase = {
  // Get tasks for a registrar with real-time listener
  subscribeToTasks: (
    registrarUid: string,
    callback: (tasks: Task[]) => void
  ): (() => void) => {
    const tasksRef = collection(db, 'registrarTasks')
    const q = query(
      tasksRef,
      where('registrarUid', '==', registrarUid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: Task[] = []
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          const task: Task = {
            id: docSnapshot.id,
            registrarUid: data.registrarUid,
            title: data.title,
            description: data.description || undefined,
            status: data.status || 'pending',
            priority: data.priority || undefined,
            dueDate: data.dueDate
              ? data.dueDate instanceof Timestamp
                ? data.dueDate.toDate().toISOString()
                : data.dueDate
              : undefined,
            color: data.color || 'blue-900',
            createdAt: data.createdAt
              ? data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
              : new Date().toISOString(),
            updatedAt: data.updatedAt
              ? data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate().toISOString()
                : data.updatedAt
              : new Date().toISOString(),
          }
          tasks.push(task)
        })
        callback(tasks)
      },
      (error) => {
        console.error('Error listening to tasks:', error)
        callback([])
      }
    )

    return unsubscribe
  },

  // Create a new task (client-side)
  createTask: async (
    registrarUid: string,
    taskData: Omit<CreateTaskData, 'registrarUid' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> => {
    const tasksRef = collection(db, 'registrarTasks')
    const newTaskRef = doc(tasksRef)

    const now = serverTimestamp()
    const taskDoc: any = {
      registrarUid,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || null,
      status: taskData.status || 'pending',
      priority: taskData.priority || null,
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      color: taskData.color || 'blue-900',
      createdAt: now,
      updatedAt: now,
    }

    await setDoc(newTaskRef, taskDoc)

    const createdDoc = await getDoc(newTaskRef)
    if (!createdDoc.exists()) {
      throw new Error('Failed to create task')
    }

    const data = createdDoc.data()
    return {
      id: createdDoc.id,
      registrarUid: data.registrarUid,
      title: data.title,
      description: data.description || undefined,
      status: data.status || 'pending',
      priority: data.priority || undefined,
      dueDate: data.dueDate
        ? data.dueDate instanceof Timestamp
          ? data.dueDate.toDate().toISOString()
          : data.dueDate
        : undefined,
      color: data.color || 'blue-900',
      createdAt: data.createdAt
        ? data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt
        : new Date().toISOString(),
      updatedAt: data.updatedAt
        ? data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt
        : new Date().toISOString(),
    }
  },

  // Update a task (client-side)
  updateTask: async (
    taskId: string,
    updates: Omit<UpdateTaskData, 'id' | 'registrarUid' | 'createdAt'>
  ): Promise<void> => {
    const taskRef = doc(db, 'registrarTasks', taskId)
    const updateData: any = {
      updatedAt: serverTimestamp(),
    }

    if (updates.title !== undefined) {
      updateData.title = updates.title.trim()
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status
    }
    if (updates.priority !== undefined) {
      updateData.priority = updates.priority || null
    }
    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate
        ? Timestamp.fromDate(new Date(updates.dueDate))
        : null
    }
    if (updates.color !== undefined) {
      updateData.color = updates.color
    }

    await updateDoc(taskRef, updateData)
  },

  // Delete a task (client-side)
  deleteTask: async (taskId: string): Promise<void> => {
    const taskRef = doc(db, 'registrarTasks', taskId)
    await deleteDoc(taskRef)
  },
}

