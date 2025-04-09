import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:camera/camera.dart';  // Keep the camera import
import 'package:provider/provider.dart';
import 'onboarding.dart'; // Import the onboarding screen
import 'home_screen.dart'; // Import the home screen after authentication

Future<void> main() async {
  // Ensure that the cameras are initialized before the app runs
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://pxuvigdmqeosntecnphs.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dXZpZ2RtcWVvc250ZWNucGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4Mzc3ODksImV4cCI6MjA1OTQxMzc4OX0.R6Zvy_yDXwA338ddKo5WxuOmpUKN1M5A_RWKpqca7q0', // Replace with your Supabase anon key
  );

  // Initialize the cameras list
  final cameras = await availableCameras();

  // Wrap the whole app in ChangeNotifierProvider to make PointsProvider available
  runApp(
    ChangeNotifierProvider(
      create: (_) => PointsProvider(),  // The provider that holds the points logic
      child: MyApp(cameras: cameras), // Pass the cameras list to the app
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
      home: AuthWrapper(cameras: cameras),  // Pass cameras to AuthWrapper
    );
  }
}

class AuthWrapper extends StatelessWidget {
  final List<CameraDescription> cameras;

  const AuthWrapper({Key? key, required this.cameras}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final session = Supabase.instance.client.auth.currentSession;

    // Check if the user is logged in
    if (session != null) {
      return HomeScreen(cameras: cameras); // Pass the cameras to HomeScreen if logged in
    } else {
      return OnboardingScreen(); // Show onboarding screen if not logged in
    }
  }
}

class PointsProvider extends ChangeNotifier {
  int _totalPoints = 0;

  int get totalPoints => _totalPoints;

  void addPoints(int points) {
    _totalPoints += points;
    notifyListeners(); // Notify listeners to update the UI
  }
}

