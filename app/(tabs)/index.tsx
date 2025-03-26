import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { Camera, Bike, ShoppingBag, X } from 'lucide-react-native';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { TaskCard } from '../components/TaskCard';
import { Task, TaskCategory } from '../types/task.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TaskList from '../components/TaskList';
import TaskDetail from '../components/TaskDetail';
import { TaskService } from '../services/task.service';

export default function TabsIndex() {
  const { tasks, loading, error, completeTask, refreshTasks } = useTask();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  
  // Refresh tasks when the screen is loaded
  useEffect(() => {
    refreshTasks();
  }, []);

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => 
    activeTab === 'available' ? !task.isCompleted : task.isCompleted
  );
  
  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const earnedPoints = tasks
    .filter(task => task.isCompleted)
    .reduce((sum, task) => sum + task.points, 0);
  
  const completionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  const pointsPercentage = totalPoints > 0 
    ? Math.round((earnedPoints / totalPoints) * 100) 
    : 0;

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      Alert.alert('Success', 'Task completed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
  };

  const closeTaskDetails = () => {
    setSelectedTask(null);
  };

  // Format current date
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    // Check if we need to add sample tasks for this user
    const checkAndAddSampleTasks = async () => {
      if (currentUser) {
        try {
          const tasks = await TaskService.getUserTasks(currentUser.uid);
          // If user has no tasks, add sample tasks
          if (tasks.length === 0) {
            await TaskService.createSampleTasks(currentUser.uid);
          }
        } catch (error) {
          console.error('Error checking or adding sample tasks:', error);
        }
      }
    };
    
    checkAndAddSampleTasks();
  }, [currentUser]);
  
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsDetailVisible(true);
  };
  
  const handleCompleteTaskFromList = async (taskId: string) => {
    if (!currentUser) return;
    
    try {
      await TaskService.completeTask(taskId, currentUser.uid);
      // Refresh the task list
      setIsDetailVisible(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshTasks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {currentUser?.displayName || 'Eco Warrior'}</Text>
          <Text style={styles.subtitle}>Ready to make a difference today?</Text>
        </View>
        <View style={styles.pointsContainer}>
          <MaterialCommunityIcons name="leaf" size={18} color="#4CAF50" />
          <Text style={styles.pointsText}>{totalPoints} points</Text>
        </View>
      </View>
      
      <TaskList onTaskSelect={handleTaskSelect} />
      
      <TaskDetail
        task={selectedTask}
        visible={isDetailVisible}
        onClose={closeTaskDetails}
        onComplete={handleCompleteTaskFromList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1D7373',
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  pointsText: {
    marginLeft: 6,
    fontWeight: '600',
    color: '#2E7D32',
  },
});