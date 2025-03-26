import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthService, AuthError } from '../services/auth.service';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
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

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

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