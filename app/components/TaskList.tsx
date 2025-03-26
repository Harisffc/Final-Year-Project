import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Task, TaskCategory } from '../types/task.types';
import { TaskService } from '../services/task.service';
import { TaskCard } from './TaskCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const categories: TaskCategory[] = ['Energy', 'Water', 'Waste', 'Transport', 'Food', 'Other'];

interface TaskListProps {
  showCompleted?: boolean;
  onTaskSelect: (task: Task) => void;
}

const TaskList = ({ showCompleted = false, onTaskSelect }: TaskListProps) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'All'>('All');

  const loadTasks = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      let fetchedTasks: Task[];
      
      if (selectedCategory === 'All') {
        fetchedTasks = showCompleted 
          ? await TaskService.getCompletedTasks(currentUser.uid)
          : await TaskService.getAvailableTasks(currentUser.uid);
      } else {
        // Get tasks by category and filter by completion status
        const categoryTasks = await TaskService.getTasksByCategory(currentUser.uid, selectedCategory);
        fetchedTasks = categoryTasks.filter(task => task.isCompleted === showCompleted);
      }
      
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
  }, [currentUser, showCompleted, selectedCategory]);

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

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'All' && styles.selectedCategoryChip
          ]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text style={selectedCategory === 'All' ? styles.selectedCategoryText : styles.categoryText}>
            All
          </Text>
        </TouchableOpacity>
        
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={selectedCategory === category ? styles.selectedCategoryText : styles.categoryText}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
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
        {renderCategoryFilter()}
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons 
            name={showCompleted ? "check-circle-outline" : "clipboard-text-outline"} 
            size={64} 
            color="#CCCCCC" 
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
      {renderCategoryFilter()}
      
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
    color: '#666666',
    textAlign: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    color: '#666666',
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TaskList; 