// pages/academics/Assignments.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../api/axios';
import { RootStackParamList } from '../../navigator/Stack'; // adjust path
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Question {
  id: string;
  question: string;
  marks: number;
  difficulty: string;
  explanation: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  number: number;
}

interface Assessment {
  id: string;
  title: string;
  instructions: string;
  assessmentType: string;
  subjectId: {
    id: string;
    name: string;
  } | string;
  batchId: string[];
  topic: string[];
  difficulty: string;
  questionTypes: string[];
  questionCount: number;
  totalMarks: number;
  additionalInstructions: string;
  questions: Question[];
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    assessments: Assessment[];
    totalAssessments: number;
  };
}

const Assignments = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [totalAssessments, setTotalAssessments] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse>('/assessments?status=PUBLISHED');
      
      if (response.data.success && response.data.data) {
        setAssessments(response.data.data.assessments || []);
        setTotalAssessments(response.data.data.totalAssessments || 0);
      } else {
        setAssessments([]);
        setTotalAssessments(0);
      }
    } catch (error: any) {
      console.error('Error fetching assessments:', error);
      if (error.response?.status === 404) {
        setAssessments([]);
        setTotalAssessments(0);
      } else {
        Alert.alert('Error', 'Failed to load assessments');
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAssessments();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssessments();
    setRefreshing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return '#43A047';
      case 'MEDIUM':
        return '#FB8C00';
      case 'HARD':
        return '#E53935';
      case 'MIXED':
        return '#8E24AA';
      default:
        return '#666';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'Easy';
      case 'MEDIUM':
        return 'Medium';
      case 'HARD':
        return 'Hard';
      case 'MIXED':
        return 'Mixed';
      default:
        return difficulty;
    }
  };

  const getSubjectName = (subject: any): string => {
    if (typeof subject === 'string') return subject;
    return subject?.name || 'N/A';
  };

  const handleStartTest = (assessmentId: string) => {
    navigation.navigate("TakeAssessment", {assessmentId});
  };

  const renderAssessmentItem = ({ item }: { item: Assessment }) => {
    const difficultyColor = getDifficultyColor(item.difficulty);

    return (
      <View style={styles.assessmentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.assessmentTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.assessmentType}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="book" size={14} color="#666" />
              <Text style={styles.detailText}>{getSubjectName(item.subjectId)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="layers" size={14} color="#666" />
              <Text style={styles.detailText}>{item.topic?.join(', ') || 'No topics'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20' }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                {getDifficultyLabel(item.difficulty)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="file-text" size={14} color="#666" />
              <Text style={styles.detailText}>{item.questionCount} Questions</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="award" size={14} color="#666" />
              <Text style={styles.detailText}>{item.totalMarks} Marks</Text>
            </View>
          </View>

          {item.instructions && (
            <Text style={styles.instructionsText} numberOfLines={2}>
              {item.instructions}
            </Text>
          )}
        </View>

        {user?.role != 'TEACHER'? <TouchableOpacity
          style={styles.startButton}
          onPress={() => handleStartTest(item.id)}
        >
          <Icon name="play-circle" size={20} color="#FFF" />
          <Text style={styles.startButtonText}>Start Test</Text>
        </TouchableOpacity> : null}
      </View>
    );
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.assessmentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSubjectName(assessment.subjectId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.topic?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Assignments</Text>
          <Text style={styles.headerSubtitle}>{totalAssessments} available</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchAssessments}
        >
          <Icon name="refresh-cw" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, subject, topic, or type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredAssessments}
        renderItem={renderAssessmentItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="file-text" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Assignments Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 
                ? 'No assignments match your search criteria' 
                : 'No published assignments available at the moment'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#E8EAF6',
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 15,
    color: '#1A1A1A',
  },
  listContent: {
    padding: 16,
  },
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  cardBody: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  instructionsText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Assignments;