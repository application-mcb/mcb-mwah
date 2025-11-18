import { NextRequest, NextResponse } from 'next/server'
import { RegistrarDatabase } from '@/lib/registrar-database'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
import { TaskColor, TaskStatus, TaskPriority } from '@/lib/types/task'

// Utility function to serialize Firestore data
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

// GET /api/tasks - Get tasks for a registrar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registrarUid = searchParams.get('registrarUid')

    if (!registrarUid) {
      return NextResponse.json(
        { error: 'Registrar UID is required' },
        { status: 400 }
      )
    }

    // Verify registrar role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can access tasks' },
        { status: 403 }
      )
    }

    const tasksRef = collection(db, 'registrarTasks')
    const q = query(
      tasksRef,
      where('registrarUid', '==', registrarUid),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    const tasks: any[] = []

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      tasks.push({
        id: docSnapshot.id,
        ...serializeFirestoreData(data),
      })
    })

    return NextResponse.json({ tasks, success: true })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch tasks'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const {
      registrarUid,
      title,
      description,
      status,
      priority,
      dueDate,
      color,
    } = requestBody

    // Validate required fields
    if (!registrarUid || !title || !color) {
      return NextResponse.json(
        { error: 'Missing required fields: registrarUid, title, color' },
        { status: 400 }
      )
    }

    // Verify registrar role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can create tasks' },
        { status: 403 }
      )
    }

    // Validate task data
    if (!['pending', 'completed'].includes(status || 'pending')) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "pending" or "completed"' },
        { status: 400 }
      )
    }

    const tasksRef = collection(db, 'registrarTasks')
    const newTaskRef = doc(tasksRef)

    const now = serverTimestamp()
    const taskData: any = {
      registrarUid,
      title: title.trim(),
      description: description?.trim() || null,
      status: (status as TaskStatus) || 'pending',
      priority: priority || null,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      color: color as TaskColor,
      createdAt: now,
      updatedAt: now,
    }

    await setDoc(newTaskRef, taskData)

    const createdDoc = await getDoc(newTaskRef)
    if (!createdDoc.exists()) {
      throw new Error('Failed to create task')
    }

    const task = {
      id: createdDoc.id,
      ...serializeFirestoreData(createdDoc.data()),
    }

    return NextResponse.json({
      task,
      success: true,
      message: 'Task created successfully',
    })
  } catch (error) {
    console.error('Error creating task:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create task'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PATCH /api/tasks - Update a task
export async function PATCH(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { taskId, registrarUid, title, description, status, priority, dueDate, color } =
      requestBody

    if (!taskId || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId, registrarUid' },
        { status: 400 }
      )
    }

    // Verify registrar role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can update tasks' },
        { status: 403 }
      )
    }

    // Verify task ownership
    const taskRef = doc(db, 'registrarTasks', taskId)
    const taskSnap = await getDoc(taskRef)

    if (!taskSnap.exists()) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const taskData = taskSnap.data()
    if (taskData.registrarUid !== registrarUid) {
      return NextResponse.json(
        { error: 'Unauthorized to update this task' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: any = {
      updatedAt: serverTimestamp(),
    }

    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined)
      updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority || null
    if (dueDate !== undefined)
      updateData.dueDate = dueDate
        ? Timestamp.fromDate(new Date(dueDate))
        : null
    if (color !== undefined) updateData.color = color

    await updateDoc(taskRef, updateData)

    const updatedDoc = await getDoc(taskRef)
    const task = {
      id: updatedDoc.id,
      ...serializeFirestoreData(updatedDoc.data()),
    }

    return NextResponse.json({
      task,
      success: true,
      message: 'Task updated successfully',
    })
  } catch (error) {
    console.error('Error updating task:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update task'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const registrarUid = searchParams.get('registrarUid')

    if (!taskId || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required parameters: taskId, registrarUid' },
        { status: 400 }
      )
    }

    // Verify registrar role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can delete tasks' },
        { status: 403 }
      )
    }

    // Verify task ownership
    const taskRef = doc(db, 'registrarTasks', taskId)
    const taskSnap = await getDoc(taskRef)

    if (!taskSnap.exists()) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const taskData = taskSnap.data()
    if (taskData.registrarUid !== registrarUid) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this task' },
        { status: 403 }
      )
    }

    await deleteDoc(taskRef)

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete task'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

