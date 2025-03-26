import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Achievement } from '../types/achievement.types';
import { useAuth } from './AuthContext';
import { AchievementService } from '../services/achievement.service';
import AchievementNotification from '../components/AchievementNotification';
import NetInfo from '@react-native-community/netinfo';

interface AchievementContextType {
  checkForNewAchievements: () => Promise<void>;
  clearAchievementQueue: () => void;
  isLoading: boolean;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

interface AchievementProviderProps {
  children: ReactNode;
}

export const AchievementProvider = ({ children }: AchievementProviderProps) => {
  const { currentUser } = useAuth();
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Listen for network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    // Initial check
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Check if there are any new achievements to display
  const checkForNewAchievements = async () => {
    if (!currentUser) return;
    
    // Skip if offline
    if (isOffline) {
      console.log('Achievement checks skipped while offline');
      return;
    }
    
    setIsLoading(true);
    try {
      const newAchievements = await AchievementService.getNewlyUnlockedAchievements(currentUser.uid);
      
      if (newAchievements.length > 0) {
        setAchievementQueue(prev => [...prev, ...newAchievements]);
      }
    } catch (error) {
      console.error('Error checking for new achievements:', error);
      // Don't block the app functionality for achievement errors
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear the achievement queue
  const clearAchievementQueue = () => {
    setAchievementQueue([]);
    setCurrentAchievement(null);
  };
  
  // Process the queue - show one achievement at a time
  useEffect(() => {
    if (achievementQueue.length > 0 && !currentAchievement) {
      const nextAchievement = achievementQueue[0];
      setCurrentAchievement(nextAchievement);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [achievementQueue, currentAchievement]);
  
  // Handle when an achievement notification is dismissed
  const handleDismiss = () => {
    setCurrentAchievement(null);
  };
  
  return (
    <AchievementContext.Provider value={{ checkForNewAchievements, clearAchievementQueue, isLoading }}>
      {children}
      
      {/* Achievement notification */}
      {currentAchievement && (
        <AchievementNotification 
          achievement={currentAchievement}
          onDismiss={handleDismiss}
        />
      )}
    </AchievementContext.Provider>
  );
}; 