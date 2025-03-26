import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Trophy } from 'lucide-react-native';

export default function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard.</Text>
        <Text style={styles.subtitle}>See how you compare to others</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tabActive}>
          <Text style={styles.tabTextActive}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>This Month</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>All Time</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.podium}>
        <View style={styles.podiumItem}>
          <Text style={styles.podiumName}>James</Text>
          <View style={[styles.podiumBar, { height: 120 }]} />
          <Text style={styles.podiumPoints}>745 points</Text>
        </View>
        <View style={styles.podiumItem}>
          <Text style={styles.podiumName}>Emma</Text>
          <Trophy size={24} color="#FFD700" style={styles.trophy} />
          <View style={[styles.podiumBar, { height: 160, backgroundColor: '#FFD700' }]} />
          <Text style={styles.podiumPoints}>820 points</Text>
        </View>
        <View style={styles.podiumItem}>
          <Text style={styles.podiumName}>Liam</Text>
          <View style={[styles.podiumBar, { height: 100 }]} />
          <Text style={styles.podiumPoints}>680 points</Text>
        </View>
      </View>

      <ScrollView style={styles.rankings}>
        {[
          { rank: 4, name: 'You', points: 575, change: 2 },
          { rank: 5, name: 'Olivia', points: 510, change: 0 },
          { rank: 6, name: 'Noah', points: 450, change: -1 },
          { rank: 7, name: 'Ava', points: 410, change: 1 },
        ].map((item) => (
          <View key={item.rank} style={styles.rankingItem}>
            <Text style={styles.rankNumber}>{item.rank}</Text>
            <Text style={styles.rankName}>{item.name}</Text>
            <Text style={styles.rankPoints}>{item.points} points</Text>
            {item.change !== 0 && (
              <Text style={[styles.rankChange, { color: item.change > 0 ? '#4CAF50' : '#F44336' }]}>
                {item.change > 0 ? '↑' : '↓'} {Math.abs(item.change)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D7373',
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#88A5A5',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#FFD700',
    borderRadius: 20,
  },
  tabText: {
    color: '#88A5A5',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#1D7373',
    fontSize: 14,
    fontWeight: 'bold',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  podiumName: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  podiumBar: {
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumPoints: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 8,
  },
  trophy: {
    position: 'absolute',
    top: -32,
  },
  rankings: {
    flex: 1,
    paddingHorizontal: 24,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  rankName: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  rankPoints: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 8,
  },
  rankChange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});