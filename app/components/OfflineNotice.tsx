import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

interface OfflineNoticeProps {
  onRetry?: () => void;
}

const OfflineNotice: React.FC<OfflineNoticeProps> = ({ onRetry }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial network state
    NetInfo.fetch().then(state => {
      setIsOffline(state.isConnected !== true);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(state.isConnected !== true);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // If online, don't render anything
  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.notice}>
        <MaterialCommunityIcons name="wifi-off" size={40} color="#FFD700" />
        <Text style={styles.title}>You're offline</Text>
        <Text style={styles.description}>
          Some features may be limited while you're offline. Your data will sync when you reconnect.
        </Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <MaterialCommunityIcons name="refresh" size={16} color="#1D7373" />
            <Text style={styles.retryText}>Retry connection</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1000,
  },
  notice: {
    backgroundColor: '#1D7373',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  description: {
    color: '#CCDEDE',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 15,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  retryText: {
    color: '#1D7373',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default OfflineNotice; 