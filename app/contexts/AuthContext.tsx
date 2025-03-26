import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthService, AuthError } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AchievementService } from '../services/achievement.service';
import NetInfo from '@react-native-community/netinfo';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isOffline: boolean;
  login: (email: string, password: string) => Promise<User | AuthError>;
  register: (email: string, password: string, displayName: string) => Promise<User | AuthError>;
  logout: () => Promise<void | AuthError>;
  resetPassword: (email: string) => Promise<void | AuthError>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [initializationTimer, setInitializationTimer] = useState<NodeJS.Timeout | null>(null);

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const newOfflineState = !state.isConnected;
      
      // Only update if state changed to avoid unnecessary re-renders
      if (newOfflineState !== isOffline) {
        setIsOffline(newOfflineState);
      }
    });
    
    // Initial check
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => {
      unsubscribe();
    };
  }, [isOffline]);

  // Initialize user data when authentication state changes
  const initializeUserData = async (user: User) => {
    if (!user) return;
    
    try {
      // Skip Firebase operations if offline
      if (isOffline) {
        console.log('User is offline, skipping Firebase initialization');
        return;
      }
      
      // Setup a timeout to force completion even if operations hang
      const timeoutPromise = new Promise<void>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('User data initialization timed out'));
        }, 5000); // 5 second timeout
        
        // Store the timeout so we can clear it if needed
        setInitializationTimer(timeout);
      });
      
      // Try to initialize user profile
      try {
        // Only try these operations for a limited time
        await Promise.race([
          UserService.initializeUserProfile(user.uid, user.email || '', user.displayName || ''),
          timeoutPromise
        ]);
        console.log('User profile initialized successfully');
      } catch (error) {
        console.error('Error initializing user profile:', error);
        // Continue with other operations even if this one fails
      }
      
      // Try to initialize achievements
      try {
        await Promise.race([
          AchievementService.initializeUserAchievements(user.uid),
          timeoutPromise
        ]);
        console.log('Achievements initialized successfully');
      } catch (error) {
        console.error('Error initializing achievements:', error);
        // Continue with other operations even if this one fails
      }
      
      // Try to update login streak
      try {
        await Promise.race([
          UserService.updateLoginStreak(user.uid),
          timeoutPromise
        ]);
        console.log('Login streak updated successfully');
      } catch (error) {
        console.error('Error updating login streak:', error);
        // Continue with other operations even if this one fails
      }
      
      // Try to check for streak achievements
      try {
        await Promise.race([
          AchievementService.onUserLogin(user.uid),
          timeoutPromise
        ]);
        console.log('Checked login achievements successfully');
      } catch (error) {
        console.error('Error checking login achievements:', error);
      }
    } catch (error) {
      console.error('Error in user data initialization:', error);
    } finally {
      // Clean up the timeout if it exists
      if (initializationTimer) {
        clearTimeout(initializationTimer);
        setInitializationTimer(null);
      }
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      
      // Create a forced timeout for the entire authentication process
      // This ensures the app will not hang if Firebase operations take too long
      const authTimeout = setTimeout(() => {
        setLoading(false);
        console.log('Auth process timed out, forcing app to load');
      }, 3000); // Force load after 3 seconds max
      
      if (user) {
        // Run initialization in parallel without blocking the UI
        initializeUserData(user).finally(() => {
          clearTimeout(authTimeout);
          setLoading(false);
        });
      } else {
        clearTimeout(authTimeout);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      // Clear any active timeouts
      if (initializationTimer) {
        clearTimeout(initializationTimer);
      }
    };
  }, [isOffline]);

  const login = async (email: string, password: string) => {
    const result = await AuthService.login(email, password);
    if ('user' in result) {
      return result.user;
    }
    return result;
  };

  const register = async (email: string, password: string, displayName: string) => {
    const result = await AuthService.register(email, password, displayName);
    if ('user' in result) {
      return result.user;
    }
    return result;
  };

  const logout = () => {
    return AuthService.logout();
  };

  const resetPassword = (email: string) => {
    return AuthService.resetPassword(email);
  };

  const value = {
    currentUser,
    loading,
    isOffline,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 