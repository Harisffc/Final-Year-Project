import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  arrayUnion, Timestamp, increment, query, 
  where, getDocs, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserStats {
  ecoPoints: number;
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  taskCompletionsByCategory: Record<string, number>;
  lastActive: Timestamp | null;
}

interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  bio: string | null;
  stats: UserStats;
}

export const UserService = {
  // Initialize user profile when a user registers
  async initializeUserProfile(userId: string, email: string, displayName: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const now = Timestamp.now();
      const initialData: UserProfile = {
        displayName,
        email,
        photoURL: null,
        createdAt: now,
        lastLoginAt: now,
        bio: null,
        stats: {
          ecoPoints: 0,
          totalTasksCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          taskCompletionsByCategory: {},
          lastActive: now
        }
      };
      
      await setDoc(userRef, initialData);
    }
  },
  
  // Get user profile data
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },
  
  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return {
          ecoPoints: 0,
          totalTasksCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          taskCompletionsByCategory: {},
          lastActive: null
        };
      }
      
      const userData = userDoc.data() as UserProfile;
      return userData.stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        ecoPoints: 0,
        totalTasksCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        taskCompletionsByCategory: {},
        lastActive: null
      };
    }
  },
  
  // Update a user's eco points
  async updateEcoPoints(userId: string, pointsToAdd: number): Promise<number> {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        'stats.ecoPoints': increment(pointsToAdd),
        'stats.lastActive': Timestamp.now()
      });
      
      const updatedProfile = await this.getUserProfile(userId);
      return updatedProfile?.stats.ecoPoints || 0;
    } catch (error) {
      console.error('Error updating eco points:', error);
      return 0;
    }
  },
  
  // Update user's streak on daily login
  async updateLoginStreak(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data() as UserProfile;
      const { stats } = userData;
      const now = new Date();
      const lastActive = stats.lastActive ? stats.lastActive.toDate() : null;
      
      let { currentStreak, longestStreak } = stats;
      
      // Check if last active was yesterday
      if (lastActive) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastActiveDate = new Date(lastActive);
        
        // Reset streak if more than a day has passed
        if (lastActiveDate < yesterday) {
          currentStreak = 1; // Reset to 1 for today's login
        } else if (
          lastActiveDate.getDate() === yesterday.getDate() &&
          lastActiveDate.getMonth() === yesterday.getMonth() &&
          lastActiveDate.getFullYear() === yesterday.getFullYear()
        ) {
          // Increment streak if last active was yesterday
          currentStreak += 1;
        }
        // If logged in same day, don't change streak
      } else {
        // First time login
        currentStreak = 1;
      }
      
      // Update longest streak if current streak is longer
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      
      await updateDoc(userRef, {
        'stats.currentStreak': currentStreak,
        'stats.longestStreak': longestStreak,
        'stats.lastActive': Timestamp.now(),
        lastLoginAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  },
  
  // Increment completed tasks count when a task is completed
  async incrementTaskCompletion(userId: string, category: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      // Update both total tasks and category-specific tasks
      await updateDoc(userRef, {
        'stats.totalTasksCompleted': increment(1),
        [`stats.taskCompletionsByCategory.${category}`]: increment(1),
        'stats.lastActive': Timestamp.now()
      });
    } catch (error) {
      console.error('Error incrementing task completion:', error);
    }
  },
  
  // Get leaderboard of users by eco points
  async getLeaderboard(limitCount = 10): Promise<Array<{ userId: string; displayName: string; ecoPoints: number }>> {
    try {
      const usersRef = collection(db, 'users');
      const leaderboardQuery = query(
        usersRef,
        orderBy('stats.ecoPoints', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(leaderboardQuery);
      
      return snapshot.docs.map(doc => ({
        userId: doc.id,
        displayName: doc.data().displayName,
        ecoPoints: doc.data().stats.ecoPoints
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
}; 