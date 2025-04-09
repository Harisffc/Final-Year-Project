import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class PointsProvider extends ChangeNotifier {
  int _totalPoints = 0;
  final SupabaseClient _supabase = Supabase.instance.client;

  int get totalPoints => _totalPoints;

  // Fetch the total points from Supabase
  Future<void> fetchTotalPoints(String userId) async {
    final response = await _supabase
        .from('points')
        .select('total_points')
        .eq('user_id', userId)
        .single()
        .execute();

    if (response.error == null && response.data != null) {
      _totalPoints = response.data['total_points'];
      notifyListeners(); // Notify listeners to update UI
    } else {
      print("Error fetching points: ${response.error?.message}");
    }
  }

  // Update points in Supabase (requires both userId and points)
  Future<void> addPoints(String userId, int points) async {
    final response = await _supabase
        .from('points')
        .upsert({'user_id': userId, 'total_points': _totalPoints + points})
        .execute();

    if (response.error == null) {
      _totalPoints += points;
      notifyListeners(); // Notify listeners to update UI
    } else {
      print("Error adding points: ${response.error?.message}");
    }
  }

  // Reset points locally
  void resetPoints() {
    _totalPoints = 0;
    notifyListeners(); // Notify listeners to update UI
  }
}
