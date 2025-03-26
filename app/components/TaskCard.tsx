import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../types/task.types';
import { 
  Lightbulb, 
  Droplets, 
  Recycle, 
  Car, 
  Apple, 
  FlowerIcon,
  Check
} from 'lucide-react-native';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onComplete?: (taskId: string) => void;
}

export const TaskCard = ({ task, onPress, onComplete }: TaskCardProps) => {
  const renderIcon = () => {
    const size = 24;
    const color = task.iconColor || '#FFD700';

    switch (task.iconName) {
      case 'lightbulb':
        return <Lightbulb size={size} color={color} />;
      case 'droplets':
        return <Droplets size={size} color={color} />;
      case 'recycle':
        return <Recycle size={size} color={color} />;
      case 'car':
        return <Car size={size} color={color} />;
      case 'apple':
        return <Apple size={size} color={color} />;
      default:
        return <FlowerIcon size={size} color={color} />;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, task.isCompleted && styles.completedContainer]} 
      onPress={() => onPress(task)}
      disabled={task.isCompleted}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {renderIcon()}
        </View>
        <Text style={styles.title}>{task.title}</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>{task.points} pts</Text>
        </View>
      </View>

      <Text style={styles.description}>{task.description}</Text>
      
      {task.isCompleted ? (
        <View style={styles.completedRow}>
          <Check size={16} color="#4CAF50" />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      ) : onComplete ? (
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={() => onComplete(task.id)}
        >
          <Text style={styles.completeButtonText}>Mark as Completed</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  completedContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  pointsContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    color: '#88A5A5',
    fontSize: 14,
    marginBottom: 16,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  completeButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 