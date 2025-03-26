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
  const [userDataInitialized, setUserDataInitialized] = useState(false);

  // Monitor network state
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

  // Initialize user data when authentication state changes
  const initializeUserData = async (user: User) => {
    if (!user || userDataInitialized) return;
    
    try {
      // Skip Firebase operations if offline
      if (isOffline) {
        console.log('User is offline, skipping Firebase initialization');
        return;
      }
      
      // Initialize user profile if it's a new user
      await UserService.initializeUserProfile(user.uid, user.email || '', user.displayName || '');
      
      // Initialize achievements
      await AchievementService.initializeUserAchievements(user.uid);
      
      // Update login streak
      await UserService.updateLoginStreak(user.uid);
      
      // Check for streak achievements
      await AchievementService.onUserLogin(user.uid);
      
      setUserDataInitialized(true);
    } catch (error) {
      console.error('Error initializing user data:', error);
      // Continue even if there are errors initializing data
      // This prevents the app from getting stuck
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      
      if (user) {
        // Initialize user data when user logs in, but don't block the UI
        setTimeout(() => {
          initializeUserData(user).finally(() => {
            setLoading(false);
          });
        }, 500);
      } else {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
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