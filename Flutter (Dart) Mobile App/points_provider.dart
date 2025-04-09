import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class PointsProvider extends ChangeNotifier {
  int _totalPoints = 0;
  final SupabaseClient _supabase = Supabase.instance.client;

  int get totalPoints => _totalPoints;

  // Fetch total points from Supabase for the current user
  Future<void> fetchTotalPoints(String userId) async {
    final response = await _supabase
        .from('points')
        .select('total_points')
        .eq('user_id', userId)
        .single()
        .execute();

    if (response.error == null && response.data != null) {
      _totalPoints = response.data['total_points'];
      notifyListeners();
    } else {
      // If no points exist, initialize the points
      await _supabase
          .from('points')
          .insert({'user_id': userId, 'total_points': 0})
          .execute();

      _totalPoints = 0; // Initialize points to 0 for new user
      notifyListeners();
    }
  }

  // Add points to the user when they complete a task
  Future<void> addPoints(String userId, int points) async {
    // Check if user exists and update points, or insert a new user if needed
    final response = await _supabase
        .from('points')
        .select('total_points')
        .eq('user_id', userId)
        .single()
        .execute();

    if (response.error == null && response.data != null) {
      int currentPoints = response.data['total_points'];
      int newTotalPoints = currentPoints + points;

      // Update points
      final updateResponse = await _supabase
          .from('points')
          .upsert({'user_id': userId, 'total_points': newTotalPoints})
          .execute();

      if (updateResponse.error == null) {
        _totalPoints = newTotalPoints;
        notifyListeners();
      } else {
        print("Error updating points: ${updateResponse.error?.message}");
      }
    } else {
      // If no points exist for this user, insert a new record
      final insertResponse = await _supabase
          .from('points')
          .insert({'user_id': userId, 'total_points': points})
          .execute();

      if (insertResponse.error == null) {
        _totalPoints = points;
        notifyListeners();
      } else {
        print("Error inserting points: ${insertResponse.error?.message}");
      }
    }
  }
}
