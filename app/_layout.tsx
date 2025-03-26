import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { AchievementProvider } from './contexts/AchievementContext';

export default function RootLayout() {
  useFrameworkReady();
  const [isLoading, setIsLoading] = useState(true);
  
  // Force loading screen to appear for at least 1.5 seconds
  // This ensures a consistent experience and avoids flashing screens
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show loading screen while the app is initializing
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading SustainiaPlay...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <TaskProvider>
        <AchievementProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </AchievementProvider>
      </TaskProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D7373',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  }
});