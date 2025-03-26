import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '../types/task.types';
import { TaskService } from '../services/task.service';
import { TaskCard } from './TaskCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TaskListProps {
  showCompleted?: boolean;
  onTaskSelect: (task: Task) => void;
}

const TaskList = ({ showCompleted = false, onTaskSelect }: TaskListProps) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const fetchedTasks = showCompleted 
        ? await TaskService.getCompletedTasks(currentUser.uid)
        : await TaskService.getAvailableTasks(currentUser.uid);
      
      setTasks(fetchedTasks);
      setError(null);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [currentUser, showCompleted]);

  const handleCompleteTask = async (taskId: string) => {
    if (!currentUser) return;
    
    try {
      await TaskService.completeTask(taskId, currentUser.uid);
      loadTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Failed to complete task. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTasks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons 
            name={showCompleted ? "check-circle-outline" : "clipboard-text-outline"} 
            size={64} 
            color="#88A5A5" 
          />
          <Text style={styles.emptyText}>
            {showCompleted 
              ? "You haven't completed any tasks yet" 
              : "No tasks available"
            }
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => onTaskSelect(item)}
            onComplete={!showCompleted ? () => handleCompleteTask(item.id) : undefined}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#CCDEDE',
    textAlign: 'center',
  },
  errorText: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1D7373',
    fontWeight: 'bold',
  },
});

export default TaskList; 