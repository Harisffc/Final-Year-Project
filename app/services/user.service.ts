import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  arrayUnion, Timestamp, increment, query, 
  where, getDocs, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import NetInfo from '@react-native-community/netinfo';

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

// Cache for user data
let cachedProfiles: { [userId: string]: UserProfile } = {};
let cachedStats: { [userId: string]: UserStats } = {};
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

// Default user stats
const getDefaultStats = (): UserStats => ({
  ecoPoints: 0,
  totalTasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  taskCompletionsByCategory: {},
  lastActive: null
});

export const UserService = {
  // Initialize user profile when a user registers
  async initializeUserProfile(userId: string, email: string, displayName: string): Promise<void> {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip user profile initialization while offline');
        return;
      }
      
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
        
        // Cache the new profile
        cachedProfiles[userId] = initialData;
        cachedStats[userId] = initialData.stats;
        cachedTimestamps[userId] = Date.now();
      }
    } catch (error) {
      console.error('Error initializing user profile:', error);
      // Don't throw - just log the error
    }
  },
  
  // Get user profile data
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check for cached data
      if (cachedProfiles[userId] && 
          cachedTimestamps[userId] && 
          Date.now() - cachedTimestamps[userId] < CACHE_DURATION) {
        console.log('Using cached user profile');
        return cachedProfiles[userId];
      }
      
      // Check if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Device is offline, returning cached profile or null');
        return cachedProfiles[userId] || null;
      }
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const profile = userDoc.data() as UserProfile;
      
      // Update cache
      cachedProfiles[userId] = profile;
      cachedStats[userId] = profile.stats;
      cachedTimestamps[userId] = Date.now();
      
      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      
      // Return cached data if available
      if (cachedProfiles[userId]) {
        return cachedProfiles[userId];
      }
      
      return null;
    }
  },
  
  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Check for cached data
      if (cachedStats[userId] && 
          cachedTimestamps[userId] && 
          Date.now() - cachedTimestamps[userId] < CACHE_DURATION) {
        console.log('Using cached user stats');
        return cachedStats[userId];
      }
      
      // Check if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Device is offline, returning cached stats or defaults');
        return cachedStats[userId] || getDefaultStats();
      }
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return getDefaultStats();
      }
      
      const userData = userDoc.data() as UserProfile;
      
      // Update cache
      cachedStats[userId] = userData.stats;
      cachedTimestamps[userId] = Date.now();
      
      return userData.stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      
      // Return cached data if available
      if (cachedStats[userId]) {
        return cachedStats[userId];
      }
      
      return getDefaultStats();
    }
  },
  
  // Update a user's eco points
  async updateEcoPoints(userId: string, pointsToAdd: number): Promise<number> {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip updating eco points while offline');
        return cachedStats[userId]?.ecoPoints || 0;
      }
      
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        'stats.ecoPoints': increment(pointsToAdd),
        'stats.lastActive': Timestamp.now()
      });
      
      // Update cache if it exists
      if (cachedStats[userId]) {
        cachedStats[userId].ecoPoints += pointsToAdd;
        cachedStats[userId].lastActive = Timestamp.now();
        cachedTimestamps[userId] = Date.now();
      }
      
      const updatedProfile = await this.getUserProfile(userId);
      return updatedProfile?.stats.ecoPoints || 0;
    } catch (error) {
      console.error('Error updating eco points:', error);
      return cachedStats[userId]?.ecoPoints || 0;
    }
  },
  
  // Update user's streak on daily login
  async updateLoginStreak(userId: string): Promise<void> {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip updating login streak while offline');
        return;
      }
      
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
      
      // Update cache if it exists
      if (cachedStats[userId]) {
        cachedStats[userId].currentStreak = currentStreak;
        cachedStats[userId].longestStreak = longestStreak;
        cachedStats[userId].lastActive = Timestamp.now();
        cachedTimestamps[userId] = Date.now();
      }
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  },
  
  // Increment completed tasks count when a task is completed
  async incrementTaskCompletion(userId: string, category: string): Promise<void> {
    try {
      // Skip if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Skip incrementing task completion while offline');
        return;
      }
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      // Update both total tasks and category-specific tasks
      await updateDoc(userRef, {
        'stats.totalTasksCompleted': increment(1),
        [`stats.taskCompletionsByCategory.${category}`]: increment(1),
        'stats.lastActive': Timestamp.now()
      });
      
      // Update cache if it exists
      if (cachedStats[userId]) {
        cachedStats[userId].totalTasksCompleted += 1;
        
        if (!cachedStats[userId].taskCompletionsByCategory) {
          cachedStats[userId].taskCompletionsByCategory = {};
        }
        
        if (!cachedStats[userId].taskCompletionsByCategory[category]) {
          cachedStats[userId].taskCompletionsByCategory[category] = 0;
        }
        
        cachedStats[userId].taskCompletionsByCategory[category] += 1;
        cachedStats[userId].lastActive = Timestamp.now();
        cachedTimestamps[userId] = Date.now();
      }
    } catch (error) {
      console.error('Error incrementing task completion:', error);
    }
  },
  
  // Get leaderboard of users by eco points
  async getLeaderboard(limitCount = 10): Promise<Array<{ userId: string; displayName: string; ecoPoints: number }>> {
    try {
      // Check if offline
      const offline = await isOffline();
      if (offline) {
        console.log('Device is offline, cannot retrieve leaderboard');
        return [];
      }
      
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
  },
  
  // Clear cache for a user
  clearCache(userId: string): void {
    delete cachedProfiles[userId];
    delete cachedStats[userId];
    delete cachedTimestamps[userId];
  }
}; 