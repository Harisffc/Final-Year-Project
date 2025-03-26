import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Achievement } from '../types/achievement.types';
import AchievementBadge from './AchievementBadge';

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  duration?: number; // Auto-dismiss duration in ms
}

const { width } = Dimensions.get('window');

export default function AchievementNotification({ 
  achievement, 
  onDismiss, 
  duration = 5000 
}: AchievementNotificationProps) {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Play notification sound or haptic feedback here if desired
    
    // Slide in animation
    Animated.spring(animation, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true
    }).start();
    
    // Auto dismiss after duration
    const timer = setTimeout(() => {
      dismiss();
    }, duration);
    
    return () => clearTimeout(timer);
  }, []);
  
  const dismiss = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      onDismiss();
    });
  };
  
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0]
  });
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      <View style={styles.content}>
        <AchievementBadge achievement={achievement} size="small" />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Achievement Unlocked!
          </Text>
          <Text style={styles.achievementName}>
            {achievement.title}
          </Text>
        </View>
        
        <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={20} color="#88A5A5" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    padding: 16,
    backgroundColor: 'transparent'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D7373',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2
  },
  achievementName: {
    fontSize: 16,
    color: '#FFFFFF'
  },
  closeButton: {
    padding: 4
  }
}); 