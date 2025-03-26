import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { AchievementProvider } from './contexts/AchievementContext';

export default function RootLayout() {
  useFrameworkReady();

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