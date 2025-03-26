import { TaskCategory } from './task.types';

export enum AchievementType {
  TASK_COMPLETION = 'TASK_COMPLETION',
  CATEGORY_MASTER = 'CATEGORY_MASTER',
  POINTS_MILESTONE = 'POINTS_MILESTONE',
  STREAK = 'STREAK'
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  iconColor: string;
  type: AchievementType;
  requirement: number; // Number of tasks, points, or days required
  category?: TaskCategory; // Only for category-specific achievements
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number; // Current progress (0-100%)
}

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  lastUpdated: Date;
}

// Achievement badge definitions
export const ACHIEVEMENT_BADGES: Omit<Achievement, 'id' | 'isUnlocked' | 'unlockedAt' | 'progress'>[] = [
  // Task completion achievements
  {
    title: 'First Step',
    description: 'Complete your first eco-friendly task',
    iconName: 'flag-checkered',
    iconColor: '#4CAF50',
    type: AchievementType.TASK_COMPLETION,
    requirement: 1
  },
  {
    title: 'Getting Started',
    description: 'Complete 5 eco-friendly tasks',
    iconName: 'leaf',
    iconColor: '#8BC34A',
    type: AchievementType.TASK_COMPLETION,
    requirement: 5
  },
  {
    title: 'Eco Enthusiast',
    description: 'Complete 15 eco-friendly tasks',
    iconName: 'tree',
    iconColor: '#4CAF50',
    type: AchievementType.TASK_COMPLETION,
    requirement: 15
  },
  {
    title: 'Planet Protector',
    description: 'Complete 30 eco-friendly tasks',
    iconName: 'earth',
    iconColor: '#2196F3',
    type: AchievementType.TASK_COMPLETION,
    requirement: 30
  },
  
  // Category master achievements
  {
    title: 'Energy Saver',
    description: 'Complete 5 energy-saving tasks',
    iconName: 'lightbulb-on',
    iconColor: '#FFC107',
    type: AchievementType.CATEGORY_MASTER,
    requirement: 5,
    category: 'Energy'
  },
  {
    title: 'Water Guardian',
    description: 'Complete 5 water-saving tasks',
    iconName: 'water',
    iconColor: '#03A9F4',
    type: AchievementType.CATEGORY_MASTER,
    requirement: 5,
    category: 'Water'
  },
  {
    title: 'Waste Warrior',
    description: 'Complete 5 waste reduction tasks',
    iconName: 'recycle',
    iconColor: '#4CAF50',
    type: AchievementType.CATEGORY_MASTER,
    requirement: 5,
    category: 'Waste'
  },
  {
    title: 'Eco Commuter',
    description: 'Complete 5 eco-friendly transportation tasks',
    iconName: 'bicycle',
    iconColor: '#FF5722',
    type: AchievementType.CATEGORY_MASTER,
    requirement: 5,
    category: 'Transport'
  },
  
  // Points milestone achievements
  {
    title: 'Point Collector',
    description: 'Earn 100 eco-points',
    iconName: 'star',
    iconColor: '#FFC107',
    type: AchievementType.POINTS_MILESTONE,
    requirement: 100
  },
  {
    title: 'Eco Champion',
    description: 'Earn 250 eco-points',
    iconName: 'trophy',
    iconColor: '#FF9800',
    type: AchievementType.POINTS_MILESTONE,
    requirement: 250
  },
  {
    title: 'Sustainability Master',
    description: 'Earn 500 eco-points',
    iconName: 'crown',
    iconColor: '#F44336',
    type: AchievementType.POINTS_MILESTONE,
    requirement: 500
  },
  
  // Streak achievements
  {
    title: 'Weekly Warrior',
    description: 'Complete at least one task every day for a week',
    iconName: 'calendar-check',
    iconColor: '#9C27B0',
    type: AchievementType.STREAK,
    requirement: 7
  },
  {
    title: 'Consistent Conservationist',
    description: 'Complete at least one task every day for two weeks',
    iconName: 'calendar-clock',
    iconColor: '#673AB7',
    type: AchievementType.STREAK,
    requirement: 14
  }
]; 