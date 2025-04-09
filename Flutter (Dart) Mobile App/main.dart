import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'onboarding.dart'; // Import the onboarding screen
import 'home_screen.dart'; // Import the home screen after authentication
import 'points_provider.dart'; // Import the PointsProvider

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://pxuvigdmqeosntecnphs.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dXZpZ2RtcWVvc250ZWNucGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzc3ODksImV4cCI6MjA1OTQxMzc4OX0.R6Zvy_yDXwA338ddKo5WxuOmpUKN1M5A_RWKpqca7q0', // Replace with your Supabase anon key
  );

  final cameras = await availableCameras();

  runApp(
    ChangeNotifierProvider(
      create: (_) => PointsProvider(),
      child: MyApp(cameras: cameras),
    ),
  );
}

class MyApp extends StatelessWidget {
  final List<CameraDescription> cameras;

  const MyApp({Key? key, required this.cameras}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SustainiaPlay',
      theme: ThemeData(
        primarySwatch: Colors.teal,
      ),
      home: AuthWrapper(cameras: cameras),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  final List<CameraDescription> cameras;

  const AuthWrapper({Key? key, required this.cameras}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final session = Supabase.instance.client.auth.currentSession;

    if (session != null) {
      return HomeScreen(cameras: cameras); // Logged in, show home screen
    } else {
      return OnboardingScreen(); // Not logged in, show onboarding screen
    }
  }
}

