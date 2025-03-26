import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Achievement } from '../types/achievement.types';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  size?: 'small' | 'medium' | 'large';
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  onPress, 
  size = 'medium' 
}) => {
  const { title, iconName, iconColor, isUnlocked, progress } = achievement;
  
  // Size configurations
  const sizeConfig = {
    small: {
      containerSize: 60,
      iconSize: 24,
      progressSize: 4,
      fontSize: 10,
    },
    medium: {
      containerSize: 80,
      iconSize: 32,
      progressSize: 5,
      fontSize: 12,
    },
    large: {
      containerSize: 100,
      iconSize: 40,
      progressSize: 6,
      fontSize: 14,
    }
  };
  
  const { containerSize, iconSize, progressSize, fontSize } = sizeConfig[size];
  
  const handlePress = () => {
    if (onPress) {
      onPress(achievement);
    }
  };
  
  // Generate the progress arc components
  const renderProgressSegments = () => {
    if (isUnlocked) return null;
    
    const segments = [];
    const numSegments = 36; // Dividing the circle into 36 segments (10 degrees each)
    const segmentsToShow = Math.floor((progress / 100) * numSegments);
    
    for (let i = 0; i < numSegments; i++) {
      const angle = (i * 10 - 90) * (Math.PI / 180); // Start from top (-90 degrees)
      const isActive = i < segmentsToShow;
      
      // Calculate position along the circle
      const x = containerSize / 2 + (containerSize / 2 - progressSize / 2) * Math.cos(angle);
      const y = containerSize / 2 + (containerSize / 2 - progressSize / 2) * Math.sin(angle);
      
      segments.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            width: progressSize,
            height: progressSize,
            borderRadius: progressSize / 2,
            backgroundColor: isActive ? iconColor : '#333333',
            left: x - progressSize / 2,
            top: y - progressSize / 2,
          }}
        />
      );
    }
    
    return segments;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: containerSize, height: containerSize + 20 }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[
        styles.badge,
        { 
          width: containerSize, 
          height: containerSize,
          opacity: isUnlocked ? 1 : 0.5 
        }
      ]}>
        <View style={[
          styles.iconContainer,
          {
            width: containerSize - 10,
            height: containerSize - 10,
            backgroundColor: isUnlocked ? iconColor + '20' : '#333333'
          }
        ]}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={iconSize}
            color={isUnlocked ? iconColor : '#888888'}
          />
        </View>
        
        {/* Progress ring (using segments instead of clip-path) */}
        {!isUnlocked && (
          <View style={styles.progressContainer}>
            {renderProgressSegments()}
          </View>
        )}
        
        {/* Locked overlay */}
        {!isUnlocked && progress < 100 && (
          <View style={styles.lockOverlay}>
            <MaterialCommunityIcons 
              name="lock"
              size={iconSize / 2}
              color="#FFFFFF"
            />
          </View>
        )}
        
        {/* Check mark for completed */}
        {isUnlocked && (
          <View style={styles.completedBadge}>
            <MaterialCommunityIcons 
              name="check-circle"
              size={iconSize / 2}
              color="#FFFFFF"
            />
          </View>
        )}
      </View>
      
      <Text style={[styles.title, { fontSize }]} numberOfLines={1}>
        {title}
      </Text>
      
      {!isUnlocked && (
        <Text style={[styles.progress, { fontSize: fontSize - 2 }]}>
          {progress}%
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 8,
  },
  badge: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    position: 'relative',
  },
  iconContainer: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    color: '#FFFFFF',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '500',
  },
  progress: {
    color: '#88A5A5',
    marginTop: 2,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    borderRadius: 50,
    borderColor: '#333333',
    position: 'absolute',
  },
  progressFill: {
    borderRadius: 50,
    position: 'absolute',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    padding: 3,
    zIndex: 2,
  },
  completedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    padding: 3,
    zIndex: 2,
  }
});

export default AchievementBadge; 