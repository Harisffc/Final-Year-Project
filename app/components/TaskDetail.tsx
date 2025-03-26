import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../types/task.types';
import { BlurView } from 'expo-blur';

interface TaskDetailProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onComplete?: (taskId: string) => void;
}

// Default icon names that we know are valid
const DEFAULT_ICON = 'clipboard-check';
const validIcons = {
  'lightbulb': 'lightbulb-outline',
  'water': 'water',
  'bottle': 'bottle-soda-outline',
  'tree': 'tree',
  'bus': 'bus',
};

const TaskDetail: React.FC<TaskDetailProps> = ({ task, visible, onClose, onComplete }) => {
  if (!task) return null;

  const handleComplete = () => {
    if (onComplete && task && !task.isCompleted) {
      onComplete(task.id);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.blurContainer}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: task.iconColor + '20' }]}>
                  <MaterialCommunityIcons 
                    name={(validIcons[task.iconName as keyof typeof validIcons] || DEFAULT_ICON) as any}
                    size={32} 
                    color={task.iconColor} 
                  />
                </View>
                
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{task.title}</Text>
                  <View style={styles.categoryContainer}>
                    <MaterialCommunityIcons 
                      name="tag" 
                      size={14} 
                      color="#666" 
                      style={styles.categoryIcon}
                    />
                    <Text style={styles.category}>{task.category}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.pointsCard}>
                <MaterialCommunityIcons name="star" size={24} color="#FFC107" />
                <Text style={styles.pointsText}>{task.points} points</Text>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{task.description}</Text>
              </View>
              
              {task.isCompleted ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.completedContainer}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    <Text style={styles.completedText}>
                      Completed on {task.completedDate?.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ) : null}
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Created</Text>
                <Text style={styles.date}>
                  {task.createdAt?.toLocaleDateString()}
                </Text>
              </View>
            </ScrollView>
            
            {!task.isCompleted && onComplete && (
              <TouchableOpacity 
                style={styles.completeButton}
                onPress={handleComplete}
              >
                <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                <Text style={styles.completeButtonText}>Mark as Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  completedText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '500',
  },
  date: {
    fontSize: 15,
    color: '#666',
  },
  completeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 16,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TaskDetail; 