import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'onboarding.dart'; // Import the onboarding screen
import 'home_screen.dart'; // Import the home screen after authentication

Future<void> main() async {
  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://pxuvigdmqeosntecnphs.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dXZpZ2RtcWVvc250ZWNucGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzc3ODksImV4cCI6MjA1OTQxMzc4OX0.R6Zvy_yDXwA338ddKo5WxuOmpUKN1M5A_RWKpqca7q0',
  );
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SustainiaPlay',
      home: AuthWrapper(), // Use AuthWrapper to handle authentication state
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final session = Supabase.instance.client.auth.currentSession;

    // Check if the user is logged in
    if (session != null) {
      return HomeScreen(); // Navigate to home screen if logged in
    } else {
      return OnboardingScreen(); // Show onboarding screen if not logged in
    }
  }
}
