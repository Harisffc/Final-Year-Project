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
  setDoc,
  enableNetwork,
  disableNetwork,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, TaskCategory, UserTaskProgress } from '../types/task.types';
import NetInfo from '@react-native-community/netinfo';
import { UserService } from './user.service';
import { AchievementService } from './achievement.service';

// Initialize offline persistence
try {
  enableIndexedDbPersistence(db)
    .then(() => console.log('Offline persistence initialized'))
    .catch((error) => {
      // Only log the error if it's not the "already initialized" error
      if (error.code !== 'failed-precondition') {
        console.error('Error enabling offline persistence:', error);
      }
    });
} catch (error) {
  console.error('Error setting up persistence:', error);
}

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
let isOffline = false;

// Function to check network status and update Firestore accordingly
const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected === true;
    
    // If network state changed
    if (isConnected !== !isOffline) {
      if (isConnected) {
        console.log('Device is online, enabling Firestore network');
        await enableNetwork(db);
        isOffline = false;
      } else {
        console.log('Device is offline, disabling Firestore network');
        await disableNetwork(db);
        isOffline = true;
      }
    }
    
    return isConnected;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
};

// Add network status listener
NetInfo.addEventListener((state: any) => {
  const isConnected = state.isConnected === true;
  if (isConnected && isOffline) {
    console.log('App is back online, enabling Firestore network');
    enableNetwork(db)
      .then(() => {
        isOffline = false;
      })
      .catch(error => {
        console.error('Error enabling network:', error);
      });
  } else if (!isConnected && !isOffline) {
    console.log('App is offline, disabling Firestore network');
    disableNetwork(db)
      .then(() => {
        isOffline = true;
      })
      .catch(error => {
        console.error('Error disabling network:', error);
      });
  }
});

export const TaskService = {
  // Get all tasks for a user
  getUserTasks: async (userId: string, forceRefresh = false): Promise<Task[]> => {
    try {
      // Check network status first
      await checkNetworkStatus();
      
      // Create cache keys
      const cacheKey = `user_${userId}`;
      const currentTime = Date.now();
      
      // Use cache if offline or within cache period
      if ((!forceRefresh && 
          cachedAvailableTasks[cacheKey] && 
          lastFetchTime[cacheKey] && 
          (currentTime - lastFetchTime[cacheKey] < 5 * 60 * 1000)) || isOffline) {
        
        // If we have cache, use it even if offline
        if (cachedAvailableTasks[cacheKey] && cachedCompletedTasks[cacheKey]) {
          return [...cachedAvailableTasks[cacheKey], ...cachedCompletedTasks[cacheKey]];
        }
        
        // If offline with no cache, return empty array
        if (isOffline) {
          console.log('Device is offline and no cache is available');
          return [];
        }
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
      // If there's an error but we have cached data, use it
      const cacheKey = `user_${userId}`;
      if (cachedAvailableTasks[cacheKey] && cachedCompletedTasks[cacheKey]) {
        console.log('Using cached tasks due to error');
        return [...cachedAvailableTasks[cacheKey], ...cachedCompletedTasks[cacheKey]];
      }
      return [];
    }
  },
  
  // Get tasks by category
  getTasksByCategory: async (userId: string, category: TaskCategory): Promise<Task[]> => {
    try {
      await checkNetworkStatus();
      
      // If offline, filter from cache
      if (isOffline) {
        const cacheKey = `user_${userId}`;
        if (cachedAvailableTasks[cacheKey] && cachedCompletedTasks[cacheKey]) {
          const allTasks = [...cachedAvailableTasks[cacheKey], ...cachedCompletedTasks[cacheKey]];
          return allTasks.filter(task => task.category === category);
        }
        return [];
      }
      
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
      // Try to get from cache on error
      const cacheKey = `user_${userId}`;
      if (cachedAvailableTasks[cacheKey] && cachedCompletedTasks[cacheKey]) {
        const allTasks = [...cachedAvailableTasks[cacheKey], ...cachedCompletedTasks[cacheKey]];
        return allTasks.filter(task => task.category === category);
      }
      return [];
    }
  },
  
  // Get completed tasks
  getCompletedTasks: async (userId: string, forceRefresh = false): Promise<Task[]> => {
    try {
      await checkNetworkStatus();
      
      const cacheKey = `user_${userId}`;
      const currentTime = Date.now();
      
      // Use cache if available and recent or if offline
      if ((!forceRefresh && 
          cachedCompletedTasks[cacheKey] && 
          lastFetchTime[cacheKey] && 
          (currentTime - lastFetchTime[cacheKey] < 5 * 60 * 1000)) || isOffline) {
        
        if (cachedCompletedTasks[cacheKey]) {
          return cachedCompletedTasks[cacheKey];
        }
        
        if (isOffline) {
          return [];
        }
      }
      
      // If we need to fetch
      const tasks = await TaskService.getUserTasks(userId, true);
      return tasks.filter((task: Task) => task.isCompleted);
    } catch (error) {
      console.error('Error getting completed tasks:', error);
      // Try to get from cache on error
      const cacheKey = `user_${userId}`;
      if (cachedCompletedTasks[cacheKey]) {
        return cachedCompletedTasks[cacheKey];
      }
      return [];
    }
  },
  
  // Get available tasks
  getAvailableTasks: async (userId: string, forceRefresh = false): Promise<Task[]> => {
    try {
      await checkNetworkStatus();
      
      const cacheKey = `user_${userId}`;
      const currentTime = Date.now();
      
      // Use cache if available and recent or if offline
      if ((!forceRefresh && 
          cachedAvailableTasks[cacheKey] && 
          lastFetchTime[cacheKey] && 
          (currentTime - lastFetchTime[cacheKey] < 5 * 60 * 1000)) || isOffline) {
        
        if (cachedAvailableTasks[cacheKey]) {
          return cachedAvailableTasks[cacheKey];
        }
        
        if (isOffline) {
          return [];
        }
      }
      
      // If we need to fetch
      const tasks = await TaskService.getUserTasks(userId, true);
      return tasks.filter((task: Task) => !task.isCompleted);
    } catch (error) {
      console.error('Error getting available tasks:', error);
      // Try to get from cache on error
      const cacheKey = `user_${userId}`;
      if (cachedAvailableTasks[cacheKey]) {
        return cachedAvailableTasks[cacheKey];
      }
      return [];
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
        completedDate: Timestamp.now(),
        updatedAt: Timestamp.now()
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
          updatedAt: Timestamp.now()
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
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }

      // Update user statistics
      try {
        // Update user's eco points and task completion counts
        await UserService.updateEcoPoints(userId, task.points);
        await UserService.incrementTaskCompletion(userId, task.category);
      } catch (error) {
        console.error('Error updating user stats:', error);
      }

      // Update achievements
      try {
        // Check for newly unlocked achievements
        const newlyUnlocked = await AchievementService.onTaskCompleted(userId, task.category);
        
        // Log newly unlocked achievements (for debugging)
        if (newlyUnlocked.length > 0) {
          console.log('Newly unlocked achievements:', newlyUnlocked.map(a => a.title));
        }
      } catch (error) {
        console.error('Error updating achievements:', error);
      }

      // Invalidate cache for this user to force refresh
      const cacheKey = `user_${userId}`;
      if (cachedAvailableTasks[cacheKey]) {
        cachedAvailableTasks[cacheKey] = cachedAvailableTasks[cacheKey].filter(t => t.id !== taskId);
      }
      
      // Optional: Move the completed task to the completed tasks cache
      if (cachedCompletedTasks[cacheKey]) {
        const completedTask = { ...task, id: taskId, isCompleted: true, completedDate: new Date() };
        cachedCompletedTasks[cacheKey] = [completedTask, ...cachedCompletedTasks[cacheKey]];
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
      await checkNetworkStatus();
      
      // If offline, calculate from cache
      if (isOffline) {
        const cacheKey = `user_${userId}`;
        if (cachedAvailableTasks[cacheKey] || cachedCompletedTasks[cacheKey]) {
          // Calculate progress from cached tasks
          const completedTasks = cachedCompletedTasks[cacheKey] || [];
          
          // Calculate points
          const totalPointsEarned = completedTasks.reduce((sum, task) => sum + task.points, 0);
          
          // Count completions by category
          const taskCompletionsByCategory = {} as Record<TaskCategory, number>;
          
          // Initialize all categories to 0
          ['Energy', 'Water', 'Waste', 'Transport', 'Food', 'Other'].forEach(cat => {
            taskCompletionsByCategory[cat as TaskCategory] = 0;
          });
          
          // Count completed tasks by category
          completedTasks.forEach(task => {
            taskCompletionsByCategory[task.category] = 
              (taskCompletionsByCategory[task.category] || 0) + 1;
          });
          
          return {
            userId,
            totalTasksCompleted: completedTasks.length,
            totalPointsEarned,
            taskCompletionsByCategory
          };
        }
        return null;
      }
      
      const progressRef = doc(db, 'userProgress', userId);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        return progressDoc.data() as UserTaskProgress;
      }
      return null;
    } catch (error) {
      console.error('Error getting user progress:', error);
      
      // If error, try to calculate from cache
      const cacheKey = `user_${userId}`;
      if (cachedCompletedTasks[cacheKey]) {
        const completedTasks = cachedCompletedTasks[cacheKey];
        const totalPointsEarned = completedTasks.reduce((sum, task) => sum + task.points, 0);
        
        // Initialize task completions by category
        const taskCompletionsByCategory = {} as Record<TaskCategory, number>;
        ['Energy', 'Water', 'Waste', 'Transport', 'Food', 'Other'].forEach(cat => {
          taskCompletionsByCategory[cat as TaskCategory] = 0;
        });
        
        // Count completed tasks by category
        completedTasks.forEach(task => {
          taskCompletionsByCategory[task.category] = 
            (taskCompletionsByCategory[task.category] || 0) + 1;
        });
        
        return {
          userId,
          totalTasksCompleted: completedTasks.length,
          totalPointsEarned,
          taskCompletionsByCategory
        };
      }
      return null;
    }
  },
  
  // Check if a user has any tasks - with offline support
  hasAnyTasks: async (userId: string): Promise<boolean> => {
    try {
      await checkNetworkStatus();
      
      // If offline, check cache
      if (isOffline) {
        const cacheKey = `user_${userId}`;
        if (cachedAvailableTasks[cacheKey] || cachedCompletedTasks[cacheKey]) {
          const availableCount = cachedAvailableTasks[cacheKey]?.length || 0;
          const completedCount = cachedCompletedTasks[cacheKey]?.length || 0;
          return (availableCount + completedCount) > 0;
        }
        
        // If offline with no cache, we cannot determine, so return false
        // This will likely trigger sample task creation when back online
        return false;
      }
      
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
      
      // Check cache as fallback
      const cacheKey = `user_${userId}`;
      if (cachedAvailableTasks[cacheKey] || cachedCompletedTasks[cacheKey]) {
        const availableCount = cachedAvailableTasks[cacheKey]?.length || 0;
        const completedCount = cachedCompletedTasks[cacheKey]?.length || 0;
        return (availableCount + completedCount) > 0;
      }
      
      return false;
    }
  }
}; 