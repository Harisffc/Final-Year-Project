import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { Camera, Bike, ShoppingBag, X } from 'lucide-react-native';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { TaskCard } from '../components/TaskCard';
import { Task, TaskCategory } from '../types/task.types';

export default function TasksScreen() {
  const { tasks, loading, error, completeTask, refreshTasks } = useTask();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>EcoTasks.</Text>
            <Text style={styles.date}>{formatDate()}</Text>
          </View>
          <Text style={styles.username}>{currentUser?.displayName || 'User'}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Tasks Completed</Text>
            <Text style={styles.progressValue}>{completedTasks} of {totalTasks}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Points Earned</Text>
            <Text style={styles.progressValue}>{earnedPoints}/{totalPoints} pts</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pointsPercentage}%` }]} />
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={activeTab === 'available' ? styles.tabActive : styles.tab}
            onPress={() => setActiveTab('available')}
          >
            <Text style={activeTab === 'available' ? styles.tabTextActive : styles.tabText}>
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'completed' ? styles.tabActive : styles.tab}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={activeTab === 'completed' ? styles.tabTextActive : styles.tabText}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'available' 
                  ? 'No available tasks found.' 
                  : 'You haven\'t completed any tasks yet.'}
              </Text>
            </View>
          ) : (
            filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task}
                onPress={handleTaskPress}
                onComplete={activeTab === 'available' ? handleCompleteTask : undefined}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Task Details Modal */}
      <Modal
        visible={selectedTask !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={closeTaskDetails}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTask?.title}</Text>
              <TouchableOpacity onPress={closeTaskDetails}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>{selectedTask?.description}</Text>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Category:</Text>
              <Text style={styles.modalInfoValue}>{selectedTask?.category}</Text>
            </View>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Points:</Text>
              <Text style={styles.modalInfoValue}>{selectedTask?.points} pts</Text>
            </View>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Status:</Text>
              <Text style={[
                styles.modalInfoValue, 
                selectedTask?.isCompleted ? styles.completedStatus : styles.pendingStatus
              ]}>
                {selectedTask?.isCompleted ? 'Completed' : 'Pending'}
              </Text>
            </View>
            
            {selectedTask?.isCompleted && selectedTask.completedDate && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoLabel}>Completed on:</Text>
                <Text style={styles.modalInfoValue}>
                  {selectedTask.completedDate.toLocaleDateString()}
                </Text>
              </View>
            )}
            
            {!selectedTask?.isCompleted && (
              <TouchableOpacity 
                style={styles.completeTaskButton}
                onPress={() => {
                  if (selectedTask) {
                    handleCompleteTask(selectedTask.id);
                    closeTaskDetails();
                  }
                }}
              >
                <Text style={styles.completeTaskButtonText}>Mark as Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D7373',
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 14,
    color: '#88A5A5',
    marginTop: 4,
  },
  username: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  progressCard: {
    margin: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#FFD700',
    borderRadius: 20,
  },
  tabText: {
    color: '#88A5A5',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#1D7373',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskList: {
    padding: 24,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#88A5A5',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1D7373',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalDescription: {
    color: '#CCDEDE',
    fontSize: 16,
    marginBottom: 24,
  },
  modalInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modalInfoLabel: {
    color: '#88A5A5',
    fontSize: 14,
    width: 100,
  },
  modalInfoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  completedStatus: {
    color: '#4CAF50',
  },
  pendingStatus: {
    color: '#FFD700',
  },
  completeTaskButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  completeTaskButtonText: {
    color: '#1D7373',
    fontSize: 16,
    fontWeight: 'bold',
  },
});