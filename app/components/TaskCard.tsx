import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../types/task.types';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onComplete }) => {
  const { title, description, category, points, isCompleted, iconName, iconColor } = task;

  return (
    <TouchableOpacity 
      style={[styles.card, isCompleted && styles.completedCard]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={iconName || 'checkbox-marked-circle-outline'} 
            size={24} 
            color={iconColor || '#4CAF50'} 
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.category}>{category}</Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={styles.points}>{points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
      
      {!isCompleted && onComplete && (
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          <MaterialCommunityIcons name="check-circle" size={18} color="white" />
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
      )}
      
      {isCompleted && (
        <View style={styles.completedBadge}>
          <MaterialCommunityIcons name="check-circle" size={18} color="white" />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  completedCard: {
    opacity: 0.8,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  points: {
    fontWeight: 'bold',
    color: '#2E7D32',
    fontSize: 14,
  },
  pointsLabel: {
    fontSize: 10,
    color: '#2E7D32',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  completeButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8BC34A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  completedText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TaskCard; 