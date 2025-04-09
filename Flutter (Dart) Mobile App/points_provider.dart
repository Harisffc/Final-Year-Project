// points_provider.dart
import 'package:flutter/foundation.dart';

class PointsProvider extends ChangeNotifier {
  int _totalPoints = 0;

  int get totalPoints => _totalPoints;

  void addPoints(int points) {
    _totalPoints += points;
    notifyListeners();
  }
}
