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

// Optimize task fetching with caching
interface CacheMap {
  [key: string]: Task[];
}

interface TimestampMap {
  [key: string]: number;
}

let cachedAvailableTasks: CacheMap = {};
let cachedCompletedTasks: CacheMap = {};
let lastFetchTime: TimestampMap = {};

export const TaskService = {
  // Get all tasks for a user
  getUserTasks: async (userId: string, forceRefresh = false): Promise<Task[]> => {
    try {
      // Create cache keys
      const cacheKey = `user_${userId}`;
      const currentTime = Date.now();
      
      // Check if we have a recent cache (within 5 minutes) and not forced refresh
      if (!forceRefresh && 
          cachedAvailableTasks[cacheKey] && 
          lastFetchTime[cacheKey] && 
          (currentTime - lastFetchTime[cacheKey] < 5 * 60 * 1000)) {
        return [...cachedAvailableTasks[cacheKey], ...cachedCompletedTasks[cacheKey]];
      }
      
      // Fetch all tasks for the user
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      
      // Separate available and completed tasks
      const available = tasks.filter(task => !task.isCompleted);
      const completed = tasks.filter(task => task.isCompleted);
      
      // Update cache
      cachedAvailableTasks[cacheKey] = available;
      cachedCompletedTasks[cacheKey] = completed;
      lastFetchTime[cacheKey] = currentTime;
      
      return tasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
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
  getCompletedTasks: async (userId: string, forceRefresh = false): Promise<Task[]> => {
    try {
      const cacheKey = `user_${userId}`;
      const currentTime = Date.now();
      
      // Use cache if available and recent
      if (!forceRefresh && 
          cachedCompletedTasks[cacheKey] && 
          lastFetchTime[cacheKey] && 
          (currentTime - lastFetchTime[cacheKey] < 5 * 60 * 1000)) {
        return cachedCompletedTasks[cacheKey];
      }
      
      // If we need to fetch
      const tasks = await TaskService.getUserTasks(userId, true);
      return tasks.filter((task: Task) => task.isCompleted);
    } catch (error) {
      console.error('Error getting completed tasks:', error);
      throw error;
    }
  },
  
  // Get available tasks
  getAvailableTasks: async (userId: string, forceRefresh = false): Promise<Task[]> => {
    try {
      const cacheKey = `user_${userId}`;
      const currentTime = Date.now();
      
      // Use cache if available and recent
      if (!forceRefresh && 
          cachedAvailableTasks[cacheKey] && 
          lastFetchTime[cacheKey] && 
          (currentTime - lastFetchTime[cacheKey] < 5 * 60 * 1000)) {
        return cachedAvailableTasks[cacheKey];
      }
      
      // If we need to fetch
      const tasks = await TaskService.getUserTasks(userId, true);
      return tasks.filter((task: Task) => !task.isCompleted);
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
        title: 'Donate food',
        description: 'Donate excess food to those in need instead of wasting it.',
        category: 'Food' as TaskCategory,
        points: 25,
        isCompleted: false,
        userId,
        iconName: 'food-apple',
        iconColor: '#FF6B6B',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Use reusable shopping bags',
        description: 'Carry reusable bags for shopping instead of using plastic bags.',
        category: 'Waste' as TaskCategory,
        points: 15,
        isCompleted: false,
        userId,
        iconName: 'shopping',
        iconColor: '#4CAF50',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Travel by bicycle or walking',
        description: 'Choose environmentally friendly transportation methods for short distances.',
        category: 'Transport' as TaskCategory,
        points: 30,
        isCompleted: false,
        userId,
        iconName: 'bicycle',
        iconColor: '#42A5F5',
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
        iconColor: '#29B6F6',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Use energy-efficient appliances',
        description: 'When replacing appliances, choose ones with high energy efficiency ratings.',
        category: 'Energy' as TaskCategory,
        points: 35,
        isCompleted: false,
        userId,
        iconName: 'flash',
        iconColor: '#FFC107',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    try {
      const batch = [];
      const tasksRef = collection(db, 'tasks');
      for (const task of sampleTasks) {
        batch.push(addDoc(tasksRef, task));
      }
      await Promise.all(batch);
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
  },
  
  // Check if a user has any tasks
  hasAnyTasks: async (userId: string): Promise<boolean> => {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', userId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if user has tasks:', error);
      return false;
    }
  }
}; 