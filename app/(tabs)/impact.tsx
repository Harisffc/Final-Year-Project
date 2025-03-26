import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Leaf, Droplets, Trash2, Trees as Tree, Bike, ShoppingBag } from 'lucide-react-native';

export default function ImpactScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Impact.</Text>
        <Text style={styles.subtitle}>This month</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabActive}>
          <Text style={styles.tabTextActive}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Year</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Leaf size={24} color="#FFD700" />
            <Text style={styles.statTitle}>CO₂ Reduced</Text>
            <Text style={styles.statValue}>12.5kg</Text>
            <Text style={styles.statDescription}>Equivalent to a 15km car trip</Text>
          </View>

          <View style={styles.statCard}>
            <Droplets size={24} color="#FFD700" />
            <Text style={styles.statTitle}>Water Saved</Text>
            <Text style={styles.statValue}>620L</Text>
            <Text style={styles.statDescription}>Equal to 8 full bathtubs</Text>
          </View>

          <View style={styles.statCard}>
            <Trash2 size={24} color="#FFD700" />
            <Text style={styles.statTitle}>Waste Reduced</Text>
            <Text style={styles.statValue}>10.4kg</Text>
            <Text style={styles.statDescription}>50 plastic bottles saved</Text>
          </View>

          <View style={styles.statCard}>
            <Tree size={24} color="#FFD700" />
            <Text style={styles.statTitle}>Tree Equivalent</Text>
            <Text style={styles.statValue}>1.2</Text>
            <Text style={styles.statDescription}>Trees worth of CO₂ absorption</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Bike size={20} color="#FFD700" />
              <Text style={styles.activityName}>Green Transport</Text>
              <Text style={styles.activityValue}>12 trips</Text>
            </View>
            <View style={styles.activityItem}>
              <ShoppingBag size={20} color="#FFD700" />
              <Text style={styles.activityName}>Food Donations</Text>
              <Text style={styles.activityValue}>3 times</Text>
            </View>
            <View style={styles.activityItem}>
              <ShoppingBag size={20} color="#FFD700" />
              <Text style={styles.activityName}>Reusable Bags</Text>
              <Text style={styles.activityValue}>8 uses</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Avatars</Text>
          <Text style={styles.avatarProgress}>3/8 avatars unlocked</Text>
          <View style={styles.avatarGrid}>
            {['Earth', 'Tree', 'Water', 'Wind', 'Solar', 'Fire', 'Recycle', 'Cloud'].map((avatar, index) => (
              <View key={avatar} style={[styles.avatarItem, index > 2 && styles.avatarLocked]}>
                <Text style={styles.avatarName}>{avatar}</Text>
              </View>
            ))}
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '47%',
  },
  statTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statDescription: {
    color: '#88A5A5',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  activityList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityName: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  activityValue: {
    color: '#FFD700',
    fontSize: 14,
  },
  avatarProgress: {
    color: '#88A5A5',
    fontSize: 14,
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  avatarItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    width: '22%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLocked: {
    opacity: 0.5,
  },
  avatarName: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});