export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  points: number;
  isCompleted: boolean;
  completedDate?: Date;
  userId: string;
  iconName: string;
  iconColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskCategory = 
  | 'Energy' 
  | 'Water' 
  | 'Waste' 
  | 'Transport' 
  | 'Food' 
  | 'Other';

export interface UserTaskProgress {
  userId: string;
  totalTasksCompleted: number;
  totalPointsEarned: number;
  taskCompletionsByCategory: Record<TaskCategory, number>;
} 