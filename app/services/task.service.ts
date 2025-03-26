import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, TaskCategory } from '../types/task.types';

const COLLECTION_NAME = 'tasks';

export const TaskService = {
  // Get all tasks for a user
  getUserTasks: async (userId: string): Promise<Task[]> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamps to JavaScript Date objects
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : new Date(data.createdAt);
        
        const updatedAt = data.updatedAt instanceof Timestamp 
          ? data.updatedAt.toDate() 
          : new Date(data.updatedAt);
        
        const completedDate = data.completedDate instanceof Timestamp 
          ? data.completedDate.toDate() 
          : data.completedDate ? new Date(data.completedDate) : undefined;
          
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          completedDate
        } as Task;
      });
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },
  
  // Get tasks by category
  getTasksByCategory: async (userId: string, category: TaskCategory): Promise<Task[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('userId', '==', userId),
        where('category', '==', category)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          completedDate: data.completedDate ? data.completedDate.toDate() : undefined
        } as Task;
      });
    } catch (error) {
      console.error('Error getting tasks by category:', error);
      throw error;
    }
  },
  
  // Get completed tasks
  getCompletedTasks: async (userId: string): Promise<Task[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('userId', '==', userId),
        where('isCompleted', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          completedDate: data.completedDate.toDate()
        } as Task;
      });
    } catch (error) {
      console.error('Error getting completed tasks:', error);
      throw error;
    }
  },
  
  // Create a new task
  createTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const taskWithTimestamps = {
        ...task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), taskWithTimestamps);
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },
  
  // Update a task
  updateTask: async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    try {
      const taskRef = doc(db, COLLECTION_NAME, taskId);
      
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },
  
  // Mark a task as completed
  completeTask: async (taskId: string): Promise<void> => {
    try {
      const taskRef = doc(db, COLLECTION_NAME, taskId);
      
      await updateDoc(taskRef, {
        isCompleted: true,
        completedDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },
  
  // Delete a task
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
}; 