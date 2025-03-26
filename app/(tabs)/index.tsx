import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Camera, Bike, ShoppingBag } from 'lucide-react-native';
import { Link } from 'expo-router';

export default function TasksScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>EcoTasks.</Text>
            <Text style={styles.date}>Friday, May 2</Text>
          </View>
          <Text style={styles.username}>Alex</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Tasks Completed</Text>
            <Text style={styles.progressValue}>2 of 5</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Next Avatar Unlock</Text>
            <Text style={styles.progressValue}>60/200 pts</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '30%' }]} />
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tabActive}>
            <Text style={styles.tabTextActive}>Available</Text>
          </TouchableOpacity>
          <Link href="/(tabs)/completed" asChild>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Completed</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.taskList}>
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={styles.taskIcon}>
                <ShoppingBag size={24} color="#FFD700" />
              </View>
              <Text style={styles.taskTitle}>Donate Food</Text>
              <View style={styles.points}>
                <Text style={styles.pointsText}>50 pts</Text>
              </View>
            </View>
            <Text style={styles.taskDescription}>
              Donate unused food to reduce waste and help those in need
            </Text>
            <TouchableOpacity style={styles.photoButton}>
              <Camera size={20} color="#1D7373" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={styles.taskIcon}>
                <ShoppingBag size={24} color="#FFD700" />
              </View>
              <Text style={styles.taskTitle}>Reusable Bag</Text>
              <View style={styles.points}>
                <Text style={styles.pointsText}>30 pts</Text>
              </View>
            </View>
            <Text style={styles.taskDescription}>
              Use a reusable shopping bag instead of plastic bags
            </Text>
            <TouchableOpacity style={styles.photoButton}>
              <Camera size={20} color="#1D7373" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={styles.taskIcon}>
                <Bike size={24} color="#FFD700" />
              </View>
              <Text style={styles.taskTitle}>Green Transport</Text>
              <View style={styles.points}>
                <Text style={styles.pointsText}>100 pts</Text>
              </View>
            </View>
            <Text style={styles.taskDescription}>
              Travel by bicycle or walking to reduce carbon emissions
            </Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>In progress</Text>
              <Text style={styles.progressPercentage}>40%</Text>
            </View>
            <View style={styles.taskProgressBar}>
              <View style={[styles.taskProgressFill, { width: '40%' }]} />
            </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 14,
    color: '#88A5A5',
    marginTop: 4,
  },
  username: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  progressCard: {
    margin: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
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
  taskList: {
    padding: 24,
    gap: 16,
  },
  taskCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskIcon: {
    marginRight: 8,
  },
  taskTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  points: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskDescription: {
    color: '#88A5A5',
    fontSize: 14,
    marginBottom: 16,
  },
  photoButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonText: {
    color: '#1D7373',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    color: '#88A5A5',
    fontSize: 12,
  },
  progressPercentage: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  taskProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  taskProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
});