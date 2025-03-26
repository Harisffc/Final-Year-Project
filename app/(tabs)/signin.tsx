import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the auth login screen
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#FFD700" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D7373',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 