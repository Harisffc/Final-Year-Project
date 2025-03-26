import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Achievement, AchievementType } from '../types/achievement.types';
import { AchievementService } from '../services/achievement.service';
import AchievementBadge from '../components/AchievementBadge';
import OfflineNotice from '../components/OfflineNotice';
import NetInfo from '@react-native-community/netinfo';

export default function AchievementsScreen() {
  const { currentUser, isOffline } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  // Sort achievements into categories
  const achievementsByType = achievements.reduce((acc, achievement) => {
    const { type } = achievement;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(achievement);
    return acc;
  }, {} as Record<AchievementType, Achievement[]>);
  
  // Statistics
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  
  const loadAchievements = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Check network connection
      const networkState = await NetInfo.fetch();
      const isConnected = networkState.isConnected === true;
      
      if (!isConnected) {
        setNetworkError(true);
        // If we have cached achievements, use them
        if (achievements.length > 0) {
          setLoading(false);
          return;
        }
        
        // Set empty achievements list if offline and no cache
        if (retryAttempt > 2) {
          setAchievements([]);
          setLoading(false);
          return;
        }
      } else {
        setNetworkError(false);
      }
      
      // Only try to update achievements if online
      if (isConnected) {
        // Update achievements progress first
        await AchievementService.updateAchievements(currentUser.uid);
      }
      
      // Then get the updated achievements
      const userAchievements = await AchievementService.getUserAchievements(currentUser.uid);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
      setNetworkError(true);
      
      // If we have multiple failures and some cached data, just use that
      if (achievements.length > 0) {
        setLoading(false);
        return;
      }
      
      // After 3 retries with no data, just show empty state
      if (retryAttempt > 2) {
        setAchievements([]);
      } else {
        setRetryAttempt(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, retryAttempt, achievements.length]);
  
  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [loadAchievements])
  );
  
  const handleSelectAchievement = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  };
  
  const renderAchievementModal = () => {
    if (!selectedAchievement) return null;
    
    return (
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#CCDEDE" />
            </TouchableOpacity>
            
            <View style={styles.achievementDetailHeader}>
              <AchievementBadge 
                achievement={selectedAchievement} 
                size="large" 
              />
            </View>
            
            <Text style={styles.achievementTitle}>{selectedAchievement.title}</Text>
            <Text style={styles.achievementDescription}>
              {selectedAchievement.description}
            </Text>
            
            {selectedAchievement.isUnlocked ? (
              <View style={styles.unlockedContainer}>
                <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.unlockedText}>
                  Unlocked on {selectedAchievement.unlockedAt?.toLocaleDateString()}
                </Text>
              </View>
            ) : (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Progress: {selectedAchievement.progress}%
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${selectedAchievement.progress}%`,
                        backgroundColor: selectedAchievement.iconColor 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.requirementText}>
                  {getRequirementText(selectedAchievement)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };
  
  const handleRetryConnection = async () => {
    setRetryAttempt(0);
    await loadAchievements();
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }
  
  const renderEmptyState = () => (
    <View style={[styles.container, styles.centerContent]}>
      <MaterialCommunityIcons 
        name={networkError ? "wifi-off" : "trophy-outline"} 
        size={64} 
        color="#88A5A5" 
      />
      <Text style={styles.emptyText}>
        {networkError 
          ? "Can't load achievements while offline" 
          : "No achievements found"}
      </Text>
      {networkError && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleRetryConnection}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {networkError && <OfflineNotice onRetry={handleRetryConnection} />}
      
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {unlockedCount}/{totalCount} unlocked ({completionPercentage}%)
          </Text>
        </View>
      </View>
      
      {achievements.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Task Completion Achievements */}
          {achievementsByType[AchievementType.TASK_COMPLETION] && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Task Completion</Text>
              <View style={styles.badgeContainer}>
                {achievementsByType[AchievementType.TASK_COMPLETION].map(achievement => (
                  <AchievementBadge 
                    key={achievement.id}
                    achievement={achievement}
                    onPress={handleSelectAchievement}
                  />
                ))}
              </View>
            </View>
          )}
          
          {/* Category Master Achievements */}
          {achievementsByType[AchievementType.CATEGORY_MASTER] && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category Masters</Text>
              <View style={styles.badgeContainer}>
                {achievementsByType[AchievementType.CATEGORY_MASTER].map(achievement => (
                  <AchievementBadge 
                    key={achievement.id}
                    achievement={achievement}
                    onPress={handleSelectAchievement}
                  />
                ))}
              </View>
            </View>
          )}
          
          {/* Points Milestones */}
          {achievementsByType[AchievementType.POINTS_MILESTONE] && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Point Milestones</Text>
              <View style={styles.badgeContainer}>
                {achievementsByType[AchievementType.POINTS_MILESTONE].map(achievement => (
                  <AchievementBadge 
                    key={achievement.id}
                    achievement={achievement}
                    onPress={handleSelectAchievement}
                  />
                ))}
              </View>
            </View>
          )}
          
          {/* Streak Achievements */}
          {achievementsByType[AchievementType.STREAK] && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Consistency</Text>
              <View style={styles.badgeContainer}>
                {achievementsByType[AchievementType.STREAK].map(achievement => (
                  <AchievementBadge 
                    key={achievement.id}
                    achievement={achievement}
                    onPress={handleSelectAchievement}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
      
      {renderAchievementModal()}
    </SafeAreaView>
  );
}

// Helper to generate requirement text
const getRequirementText = (achievement: Achievement): string => {
  const { type, requirement, category } = achievement;
  
  switch (type) {
    case AchievementType.TASK_COMPLETION:
      return `Complete ${requirement} eco-friendly task${requirement !== 1 ? 's' : ''}`;
    
    case AchievementType.CATEGORY_MASTER:
      return `Complete ${requirement} ${category} task${requirement !== 1 ? 's' : ''}`;
    
    case AchievementType.POINTS_MILESTONE:
      return `Earn ${requirement} eco-points`;
    
    case AchievementType.STREAK:
      return `Complete tasks for ${requirement} consecutive day${requirement !== 1 ? 's' : ''}`;
    
    default:
      return '';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D7373',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stats: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statsText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
    paddingLeft: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1D7373',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  achievementDetailHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  achievementDescription: {
    fontSize: 16,
    color: '#CCDEDE',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  unlockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  unlockedText: {
    color: '#FFD700',
    fontSize: 16,
    marginLeft: 8,
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 16,
    borderRadius: 8,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  requirementText: {
    color: '#CCDEDE',
    textAlign: 'center',
    fontSize: 14,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFD700',
    fontWeight: 'bold',
  }
}); 