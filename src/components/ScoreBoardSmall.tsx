// components/ScoreBoardSmall.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../api/axios';

interface StudentPerformance {
  studentId: string;
  studentName: string;
  studentEmail: string;
  testsAttempted: number;
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  lastAttemptAt: string;
}

interface StudentsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    students: StudentPerformance[];
    totalStudents: number;
  };
}

const ScoreBoardSmall = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get<StudentsResponse>(
        '/assessment-results/students?limit=5&page=1'
      );

      if (response.data.success && response.data.data) {
        setStudents(response.data.data.students || []);
        setTotalStudents(response.data.data.totalStudents || 0);
      } else {
        setStudents([]);
        setTotalStudents(0);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      if (error.response?.status === 404) {
        setStudents([]);
        setTotalStudents(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#43A047';
    if (score >= 50) return '#FB8C00';
    return '#E53935';
  };

  const renderStudentItem = ({ item }: { item: StudentPerformance }) => {
    const avgColor = getScoreColor(item.averageScore);

    return (
      <View style={styles.studentRow}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.studentName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.studentName}
          </Text>
          <Text style={styles.studentEmail} numberOfLines={1}>
            {item.studentEmail}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: avgColor }]}>
            {item.averageScore}%
          </Text>
          <Text style={styles.testsText}>{item.testsAttempted} tests</Text>
        </View>
      </View>
    );
  };

  const handleSeeAll = () => {
    navigation.navigate('ScoreBoard' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading scores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="bar-chart-2" size={22} color="#4F46E5" />
          <Text style={styles.headerTitle}>Score Board</Text>
        </View>
        <TouchableOpacity onPress={handleSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
          <Icon name="chevron-right" size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {students.length > 0 ? Math.max(...students.map(s => s.testsAttempted)) : 0}
          </Text>
          <Text style={styles.statLabel}>Max Tests</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {students.length > 0 ? Math.max(...students.map(s => s.highestScore)) : 0}%
          </Text>
          <Text style={styles.statLabel}>Highest Score</Text>
        </View>
      </View>

      {/* Students List */}
      {students.length > 0 ? (
        <FlatList
          data={students}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.studentId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="users" size={32} color="#CCC" />
          <Text style={styles.emptyText}>No student data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4F46E5',
    marginRight: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F6FF',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  listContent: {
    paddingBottom: 4,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  testsText: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
});

export default ScoreBoardSmall;