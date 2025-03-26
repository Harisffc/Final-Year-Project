import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  Timestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  FirebaseError
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Achievement, 
  AchievementType, 
  ACHIEVEMENT_BADGES, 
  UserAchievements 
} from '../types/achievement.types';
import { TaskCategory } from '../types/task.types';
import { TaskService } from './task.service';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from './user.service';
import { Task } from '../types/task.types';
import NetInfo from '@react-native-community/netinfo';

// Cache for achievement data
let cachedAchievements: { [userId: string]: Achievement[] } = {};
let cachedTimestamps: { [userId: string]: number } = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Check if device is offline
const isOffline = async (): Promise<boolean> => {
  try {
    const netInfo = await NetInfo.fetch();
    return !netInfo.isConnected;
  } catch (error) {
    console.log('Error checking network status:', error);
    return false;
  }
};

export const AchievementService = {
  /**
   * Initialize achievements for a new user
   */
  initializeUserAchievements: async (userId: string): Promise<void> => {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip initializing achievements while offline');
        return;
      }
      
      // Check if achievements already exist for the user
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievementsDoc = await getDoc(userAchievementsRef);
      
      if (!userAchievementsDoc.exists()) {
        // Create achievements array with all badges set to unlocked = false and progress = 0
        const achievements: Achievement[] = ACHIEVEMENT_BADGES.map(badge => ({
          ...badge,
          id: uuidv4(),
          isUnlocked: false,
          progress: 0,
        }));
        
        // Save to Firestore
        await setDoc(userAchievementsRef, { 
          userId,
          achievements,
          lastUpdated: Timestamp.now() 
        });
        
        // Update cache
        cachedAchievements[userId] = achievements;
        cachedTimestamps[userId] = Date.now();
      }
    } catch (error) {
      console.error('Error initializing achievements:', error);
      // Don't throw - just log the error
    }
  },
  
  /**
   * Get all achievements for a user
   */
  getUserAchievements: async (userId: string): Promise<Achievement[]> => {
    try {
      // Check for cached data
      if (cachedAchievements[userId] && 
          cachedTimestamps[userId] && 
          Date.now() - cachedTimestamps[userId] < CACHE_DURATION) {
        console.log('Using cached achievements');
        return cachedAchievements[userId];
      }
      
      // Check if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Device is offline, returning empty achievements');
        // Return empty array or cached data if available
        return cachedAchievements[userId] || [];
      }
      
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievementsDoc = await getDoc(userAchievementsRef);
      
      if (!userAchievementsDoc.exists()) {
        // Initialize if not exists, but only if online
        await this.initializeUserAchievements(userId);
        
        // Return default achievements
        const defaultAchievements = ACHIEVEMENT_BADGES.map(badge => ({
          ...badge,
          id: uuidv4(),
          isUnlocked: false,
          progress: 0,
        }));
        
        // Update cache
        cachedAchievements[userId] = defaultAchievements;
        cachedTimestamps[userId] = Date.now();
        
        return defaultAchievements;
      }
      
      const data = userAchievementsDoc.data() as UserAchievements;
      
      // Update cache
      cachedAchievements[userId] = data.achievements;
      cachedTimestamps[userId] = Date.now();
      
      return data.achievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      
      // Return cached data if available
      if (cachedAchievements[userId]) {
        return cachedAchievements[userId];
      }
      
      // Return empty array as fallback
      return [];
    }
  },
  
  /**
   * Update achievement progress based on user activities
   */
  updateAchievements: async (userId: string): Promise<Achievement[]> => {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip updating achievements while offline');
        return cachedAchievements[userId] || [];
      }
      
      const achievements = await AchievementService.getUserAchievements(userId);
      
      // Skip if no achievements found
      if (!achievements || achievements.length === 0) {
        return [];
      }
      
      // Try to get user stats, but use defaults if fails
      let userStats;
      try {
        userStats = await UserService.getUserStats(userId);
      } catch (error) {
        console.error('Error getting user stats:', error);
        userStats = {
          ecoPoints: 0,
          totalTasksCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          taskCompletionsByCategory: {},
          lastActive: null
        };
      }
      
      // Try to get tasks, but use empty array if fails
      let tasks;
      try {
        tasks = await TaskService.getUserTasks(userId);
      } catch (error) {
        console.error('Error getting user tasks:', error);
        tasks = [];
      }
      
      // Calculate updates for each achievement
      const updatedAchievements = achievements.map(achievement => {
        const { type, requirement, category } = achievement;
        let progress = 0;
        
        switch (type) {
          case AchievementType.TASK_COMPLETION:
            // Progress based on total completed tasks
            progress = Math.min(100, (userStats.totalTasksCompleted / requirement) * 100);
            break;
          
          case AchievementType.CATEGORY_MASTER:
            // Progress based on completed tasks in a specific category
            if (category) {
              const categoryTasks = tasks.filter(
                (task: Task) => task.category === category && task.isCompleted
              );
              progress = Math.min(100, (categoryTasks.length / requirement) * 100);
            }
            break;
          
          case AchievementType.POINTS_MILESTONE:
            // Progress based on total eco-points earned
            progress = Math.min(100, (userStats.ecoPoints / requirement) * 100);
            break;
          
          case AchievementType.STREAK:
            // Progress based on streak days
            progress = Math.min(100, (userStats.currentStreak / requirement) * 100);
            break;
        }
        
        // Round progress to nearest integer
        progress = Math.round(progress);
        
        // Check if the achievement should be unlocked
        const shouldUnlock = progress >= 100 && !achievement.isUnlocked;
        
        return {
          ...achievement,
          progress,
          isUnlocked: shouldUnlock ? true : achievement.isUnlocked,
          unlockedAt: shouldUnlock ? new Date() : achievement.unlockedAt,
        };
      });
      
      // Save updated achievements back to Firestore
      try {
        const userAchievementsRef = doc(db, 'userAchievements', userId);
        await setDoc(userAchievementsRef, { 
          userId,
          achievements: updatedAchievements,
          lastUpdated: Timestamp.now()
        });
        
        // Update cache
        cachedAchievements[userId] = updatedAchievements;
        cachedTimestamps[userId] = Date.now();
      } catch (error) {
        console.error('Error saving updated achievements:', error);
        // Still return the calculated achievements even if saving fails
      }
      
      return updatedAchievements;
    } catch (error) {
      console.error('Error updating achievements:', error);
      return cachedAchievements[userId] || [];
    }
  },
  
  /**
   * Get newly unlocked achievements since last check
   */
  getNewlyUnlockedAchievements: async (userId: string): Promise<Achievement[]> => {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip checking for new achievements while offline');
        return [];
      }
      
      const achievements = await this.getUserAchievements(userId);
      
      // Skip if no achievements
      if (!achievements || achievements.length === 0) {
        return [];
      }
      
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      return achievements.filter(
        achievement => achievement.isUnlocked && 
        achievement.unlockedAt && 
        achievement.unlockedAt > oneHourAgo
      );
    } catch (error) {
      console.error('Error getting newly unlocked achievements:', error);
      return [];
    }
  },
  
  // Trigger achievement updates when a task is completed
  async onTaskCompleted(userId: string, categoryName: string): Promise<Achievement[]> {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip achievement updates for task completion while offline');
        return [];
      }
      
      await AchievementService.updateAchievements(userId);
      return AchievementService.getNewlyUnlockedAchievements(userId);
    } catch (error) {
      console.error('Error handling task completion:', error);
      return [];
    }
  },
  
  // Trigger achievement updates when the user logs in (for streak achievements)
  async onUserLogin(userId: string): Promise<Achievement[]> {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip achievement updates for login while offline');
        return [];
      }
      
      await AchievementService.updateAchievements(userId);
      return AchievementService.getNewlyUnlockedAchievements(userId);
    } catch (error) {
      console.error('Error handling user login:', error);
      return [];
    }
  },
  
  // Trigger achievement updates when the user earns points
  async onPointsEarned(userId: string): Promise<Achievement[]> {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip achievement updates for points earned while offline');
        return [];
      }
      
      await AchievementService.updateAchievements(userId);
      return AchievementService.getNewlyUnlockedAchievements(userId);
    } catch (error) {
      console.error('Error handling points earned:', error);
      return [];
    }
  },
  
  // Clear cached achievements for a user
  clearCache(userId: string): void {
    delete cachedAchievements[userId];
    delete cachedTimestamps[userId];
  }
}; 