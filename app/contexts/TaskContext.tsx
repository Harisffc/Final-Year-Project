import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { TaskService } from '../services/task.service';
import { Task, TaskCategory } from '../types/task.types';
import { useAuth } from './AuthContext';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  getTasksByCategory: (category: TaskCategory) => Promise<Task[]>;
  getCompletedTasks: () => Promise<Task[]>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider = ({ children }: TaskProviderProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchTasks = async () => {
    if (!currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userTasks = await TaskService.getUserTasks(currentUser.uid);
      setTasks(userTasks);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUser]);

  const refreshTasks = async () => {
    await fetchTasks();
  };

  const getTasksByCategory = async (category: TaskCategory) => {
    if (!currentUser) return [];
    try {
      return await TaskService.getTasksByCategory(currentUser.uid, category);
    } catch (error) {
      console.error('Error getting tasks by category:', error);
      setError('Failed to load tasks by category. Please try again later.');
      return [];
    }
  };

  const getCompletedTasks = async () => {
    if (!currentUser) return [];
    try {
      return await TaskService.getCompletedTasks(currentUser.uid);
    } catch (error) {
      console.error('Error getting completed tasks:', error);
      setError('Failed to load completed tasks. Please try again later.');
      return [];
    }
  };

  const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const taskWithUser = {
        ...task,
        userId: currentUser.uid
      };
      
      const taskId = await TaskService.createTask(taskWithUser);
      await refreshTasks();
      return taskId;
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task. Please try again later.');
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>) => {
    try {
      await TaskService.updateTask(taskId, updates);
      await refreshTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again later.');
      throw error;
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      await TaskService.completeTask(taskId);
      await refreshTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      setError('Failed to complete task. Please try again later.');
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await TaskService.deleteTask(taskId);
      await refreshTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again later.');
      throw error;
    }
  };

  const value = {
    tasks,
    loading,
    error,
    getTasksByCategory,
    getCompletedTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    refreshTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}; 