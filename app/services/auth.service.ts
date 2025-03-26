import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthError {
  code: string;
  message: string;
}

export const AuthService = {
  // Register a new user
  register: async (email: string, password: string, displayName: string): Promise<UserCredential | AuthError> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with the display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName
        });
      }
      
      return userCredential;
    } catch (error: any) {
      return {
        code: error.code,
        message: error.message
      };
    }
  },
  
  // Sign in an existing user
  login: async (email: string, password: string): Promise<UserCredential | AuthError> => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      return {
        code: error.code,
        message: error.message
      };
    }
  },
  
  // Sign out the current user
  logout: async (): Promise<void | AuthError> => {
    try {
      return await signOut(auth);
    } catch (error: any) {
      return {
        code: error.code,
        message: error.message
      };
    }
  },
  
  // Send a password reset email
  resetPassword: async (email: string): Promise<void | AuthError> => {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      return {
        code: error.code,
        message: error.message
      };
    }
  },
  
  // Get the current authenticated user
  getCurrentUser: () => {
    return auth.currentUser;
  }
}; 