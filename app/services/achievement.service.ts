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
  limit
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

export const AchievementService = {
  /**
   * Initialize achievements for a new user
   */
  initializeUserAchievements: async (userId: string): Promise<void> => {
    try {
      // Check if user already has achievements
      const achievementsRef = doc(db, 'userAchievements', userId);
      const achievementsDoc = await getDoc(achievementsRef);
      
      if (achievementsDoc.exists()) {
        console.log('User already has achievements initialized');
        return;
      }
      
      // Create achievements array with all badges unlocked = false and progress = 0
      const achievements: Achievement[] = ACHIEVEMENT_BADGES.map(badge => ({
        ...badge,
        id: uuidv4(),
        isUnlocked: false,
        progress: 0
      }));
      
      // Save to Firestore
      await setDoc(achievementsRef, {
        userId,
        achievements,
        lastUpdated: Timestamp.now()
      });
      
      console.log('User achievements initialized successfully');
    } catch (error) {
      console.error('Error initializing user achievements:', error);
      throw error;
    }
  },
  
  /**
   * Get all achievements for a user
   */
  getUserAchievements: async (userId: string): Promise<Achievement[]> => {
    try {
      const achievementsRef = doc(db, 'userAchievements', userId);
      const achievementsDoc = await getDoc(achievementsRef);
      
      if (!achievementsDoc.exists()) {
        // Initialize achievements if they don't exist
        await AchievementService.initializeUserAchievements(userId);
        const newDoc = await getDoc(achievementsRef);
        return newDoc.data()?.achievements || [];
      }
      
      return achievementsDoc.data()?.achievements || [];
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  },
  
  /**
   * Update achievement progress based on user activities
   */
  updateAchievements: async (userId: string): Promise<Achievement[]> => {
    const achievements = await AchievementService.getUserAchievements(userId);
    const userStats = await UserService.getUserStats(userId);
    const tasks = await TaskService.getUserTasks(userId);
    
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
    const userAchievementsRef = doc(db, 'userAchievements', userId);
    await setDoc(userAchievementsRef, {
      userId,
      achievements: updatedAchievements,
      lastUpdated: Timestamp.now()
    });
    
    return updatedAchievements;
  },
  
  /**
   * Get newly unlocked achievements since last check
   */
  getNewlyUnlockedAchievements: async (userId: string): Promise<Achievement[]> => {
    try {
      // Get all achievements
      const achievements = await AchievementService.getUserAchievements(userId);
      
      // Filter for recently unlocked achievements (in the last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      return achievements.filter(achievement => 
        achievement.isUnlocked && 
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
    await AchievementService.updateAchievements(userId);
    return AchievementService.getNewlyUnlockedAchievements(userId);
  },
  
  // Trigger achievement updates when the user logs in (for streak achievements)
  async onUserLogin(userId: string): Promise<Achievement[]> {
    await AchievementService.updateAchievements(userId);
    return AchievementService.getNewlyUnlockedAchievements(userId);
  },
  
  // Trigger achievement updates when the user earns points
  async onPointsEarned(userId: string): Promise<Achievement[]> {
    await AchievementService.updateAchievements(userId);
    return AchievementService.getNewlyUnlockedAchievements(userId);
  }
}; 