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
  serverTimestamp,
  orderBy,
  limit,
  getDoc,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, TaskCategory, UserTaskProgress } from '../types/task.types';

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
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', userId),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    } catch (error) {
      console.error('Error getting tasks by category:', error);
      throw error;
    }
  },
  
  // Get completed tasks
  getCompletedTasks: async (userId: string): Promise<Task[]> => {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', userId),
        where('isCompleted', '==', true),
        orderBy('completedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    } catch (error) {
      console.error('Error getting completed tasks:', error);
      throw error;
    }
  },
  
  // Get available tasks
  getAvailableTasks: async (userId: string): Promise<Task[]> => {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', userId),
        where('isCompleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    } catch (error) {
      console.error('Error getting available tasks:', error);
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
  completeTask: async (taskId: string, userId: string): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const task = taskDoc.data() as Task;
      if (task.userId !== userId) {
        throw new Error('Unauthorized');
      }

      if (task.isCompleted) {
        throw new Error('Task already completed');
      }

      // Update task status
      await updateDoc(taskRef, {
        isCompleted: true,
        completedDate: new Date(),
        updatedAt: new Date()
      });

      // Update user progress
      const progressRef = doc(db, 'userProgress', userId);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        const progress = progressDoc.data() as UserTaskProgress;
        await updateDoc(progressRef, {
          totalTasksCompleted: increment(1),
          totalPointsEarned: increment(task.points),
          [`taskCompletionsByCategory.${task.category}`]: increment(1),
          updatedAt: new Date()
        });
      } else {
        // Create new progress document
        const newProgress: Omit<UserTaskProgress, 'userId'> = {
          totalTasksCompleted: 1,
          totalPointsEarned: task.points,
          taskCompletionsByCategory: {
            Energy: task.category === 'Energy' ? 1 : 0,
            Water: task.category === 'Water' ? 1 : 0,
            Waste: task.category === 'Waste' ? 1 : 0,
            Transport: task.category === 'Transport' ? 1 : 0,
            Food: task.category === 'Food' ? 1 : 0,
            Other: task.category === 'Other' ? 1 : 0
          }
        };
        await setDoc(progressRef, {
          ...newProgress,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
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
  },

  createSampleTasks: async (userId: string): Promise<void> => {
    const sampleTasks: Omit<Task, 'id'>[] = [
      {
        title: 'Turn off lights when leaving a room',
        description: 'Make it a habit to switch off lights when you leave any room to save electricity.',
        category: 'Energy' as TaskCategory,
        points: 10,
        isCompleted: false,
        userId,
        iconName: 'lightbulb',
        iconColor: '#FFD700',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Use reusable water bottle',
        description: 'Carry a reusable water bottle instead of buying plastic bottles.',
        category: 'Waste' as TaskCategory,
        points: 15,
        isCompleted: false,
        userId,
        iconName: 'bottle',
        iconColor: '#4CAF50',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Take shorter showers',
        description: 'Reduce your shower time to 5 minutes to save water.',
        category: 'Water' as TaskCategory,
        points: 20,
        isCompleted: false,
        userId,
        iconName: 'water',
        iconColor: '#2196F3',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Plant a tree',
        description: 'Plant a tree in your garden or participate in a tree planting event.',
        category: 'Other' as TaskCategory,
        points: 50,
        isCompleted: false,
        userId,
        iconName: 'tree',
        iconColor: '#2E7D32',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Use public transport',
        description: 'Take public transport instead of driving your car for a day.',
        category: 'Transport' as TaskCategory,
        points: 30,
        isCompleted: false,
        userId,
        iconName: 'bus',
        iconColor: '#9C27B0',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    try {
      const tasksRef = collection(db, 'tasks');
      for (const task of sampleTasks) {
        await addDoc(tasksRef, task);
      }
    } catch (error) {
      console.error('Error creating sample tasks:', error);
      throw error;
    }
  },

  getUserProgress: async (userId: string): Promise<UserTaskProgress | null> => {
    try {
      const progressRef = doc(db, 'userProgress', userId);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        return progressDoc.data() as UserTaskProgress;
      }
      return null;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }
}; 