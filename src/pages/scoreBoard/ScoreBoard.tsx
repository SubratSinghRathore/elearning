// pages/academics/ScoreBoard.tsx
import React, { useState, useCallback, useRef } from 'react';
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
  Modal,
  ScrollView,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../api/axios';

interface StudentPerformance {
  studentId: string;
  studentName: string;
  studentEmail: string;
  batchId?: string;
  batchName?: string;
  programId?: string;
  programName?: string;
  testsAttempted: number;
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  lastAttemptAt: string;
}

interface StudentResult {
  _id: string;
  resultId: string;
  assessmentId: string;
  assessmentTitle: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
}

interface ReviewQuestion {
  questionId: string;
  number: number;
  question: string;
  selectedAnswer?: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
  marks: number;
}

interface AssessmentResultDetail {
  id: string;
  assessmentId: {
    _id: string;
    title: string;
    assessmentType: string;
    totalMarks: number;
  };
  studentId: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  answers: Record<string, string>;
  reviews: ReviewQuestion[];
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentResultsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    results: StudentResult[];
  };
}

interface StudentsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    students: StudentPerformance[];
    totalStudents: number;
    page: string;
    limit: number;
  };
}

interface ReviewResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AssessmentResultDetail;
}

const ScoreBoard = () => {
  const navigation = useNavigation();
  const searchInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentPerformance[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  
  // Review Modal States
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewData, setReviewData] = useState<AssessmentResultDetail | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get<StudentsResponse>(
        `/assessment-results/students?search=&limit=50&page=1`
      );

      if (response.data.success && response.data.data) {
        setStudents(response.data.data.students || []);
        setFilteredStudents(response.data.data.students || []);
        setTotalStudents(response.data.data.totalStudents || 0);
      } else {
        setStudents([]);
        setFilteredStudents([]);
        setTotalStudents(0);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      if (error.response?.status === 404) {
        setStudents([]);
        setFilteredStudents([]);
        setTotalStudents(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search filter - only by student name
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    if (text.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.studentName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredStudents(students);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  };

  // Dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    searchInputRef.current?.blur();
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

  const handleStudentPress = async (student: StudentPerformance) => {
    dismissKeyboard();
    setSelectedStudent(student);
    setModalVisible(true);
    setLoadingResults(true);
    
    try {
      const response = await api.get<StudentResultsResponse>(
        `/assessment-results/student/${student.studentId}`
      );

      if (response.data.success && response.data.data) {
        setStudentResults(response.data.data.results || []);
      } else {
        setStudentResults([]);
        Alert.alert('Error', 'Failed to load student results');
      }
    } catch (error: any) {
      console.error('Error fetching student results:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load student results');
      setStudentResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleReviewPress = async (resultId: string) => {
    setReviewModalVisible(true);
    setLoadingReview(true);
    
    try {
      const response = await api.get<ReviewResponse>(
        `/assessment-results/${resultId}`
      );

      if (response.data.success && response.data.data) {
        setReviewData(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load review data');
      }
    } catch (error: any) {
      console.error('Error fetching review:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load review');
    } finally {
      setLoadingReview(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#43A047';
    if (score >= 50) return '#FB8C00';
    return '#E53935';
  };

  const renderStudentItem = ({ item }: { item: StudentPerformance }) => {
    const avgColor = getScoreColor(item.averageScore);

    return (
      <TouchableOpacity
        style={styles.studentCard}
        onPress={() => handleStudentPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.studentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName} numberOfLines={1}>
                {item.studentName}
              </Text>
              <Text style={styles.studentEmail} numberOfLines={1}>
                {item.studentEmail}
              </Text>
            </View>
          </View>
          <View style={styles.programBadge}>
            <Text style={styles.programText}>
              {item.programName || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.statItem}>
            <Icon name="file-text" size={16} color="#666" />
            <Text style={styles.statLabel}>Tests</Text>
            <Text style={styles.statValue}>{item.testsAttempted}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="trending-up" size={16} color="#43A047" />
            <Text style={styles.statLabel}>Highest</Text>
            <Text style={[styles.statValue, { color: '#43A047' }]}>
              {item.highestScore}%
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="trending-down" size={16} color="#E53935" />
            <Text style={styles.statLabel}>Lowest</Text>
            <Text style={[styles.statValue, { color: '#E53935' }]}>
              {item.lowestScore}%
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="bar-chart-2" size={16} color="#4F46E5" />
            <Text style={styles.statLabel}>Avg</Text>
            <Text style={[styles.statValue, { color: avgColor }]}>
              {item.averageScore}%
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Icon name="clock" size={14} color="#999" />
          <Text style={styles.lastAttemptText}>
            Last attempt: {formatDate(item.lastAttemptAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderResultItem = ({ item }: { item: StudentResult }) => (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.assessmentTitle}
        </Text>
        <View style={[styles.resultScoreBadge, { 
          backgroundColor: getScoreColor(item.percentage) + '20' 
        }]}>
          <Text style={[styles.resultScoreText, { 
            color: getScoreColor(item.percentage) 
          }]}>
            {item.percentage}%
          </Text>
        </View>
      </View>
      
      <View style={styles.resultBody}>
        <View style={styles.resultDetail}>
          <Text style={styles.resultLabel}>Marks</Text>
          <Text style={styles.resultValue}>
            {item.obtainedMarks} / {item.totalMarks}
          </Text>
        </View>
        <View style={styles.resultDivider} />
        <View style={styles.resultDetail}>
          <Text style={styles.resultLabel}>Submitted</Text>
          <Text style={styles.resultValue}>
            {formatDate(item.submittedAt)}
          </Text>
        </View>
        <View style={styles.resultDivider} />
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => handleReviewPress(item.resultId || item._id)}
        >
          <Icon name="eye" size={16} color="#4F46E5" />
          <Text style={styles.reviewButtonText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Review Modal
  const renderReviewModal = () => {
    if (!reviewData) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewModalVisible}
        onRequestClose={() => {
          setReviewModalVisible(false);
          setReviewData(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Test Review</Text>
                <Text style={styles.modalSubtitle}>
                  {reviewData.assessmentId.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setReviewModalVisible(false);
                  setReviewData(null);
                }}
              >
                <Icon name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <View style={styles.reviewStats}>
              <View style={styles.reviewStatItem}>
                <Text style={[styles.reviewStatValue, { color: '#43A047' }]}>
                  {reviewData.obtainedMarks}
                </Text>
                <Text style={styles.reviewStatLabel}>Obtained</Text>
              </View>
              <View style={styles.reviewStatDivider} />
              <View style={styles.reviewStatItem}>
                <Text style={styles.reviewStatValue}>
                  {reviewData.totalMarks}
                </Text>
                <Text style={styles.reviewStatLabel}>Total</Text>
              </View>
              <View style={styles.reviewStatDivider} />
              <View style={styles.reviewStatItem}>
                <Text style={[styles.reviewStatValue, { 
                  color: getScoreColor(reviewData.percentage) 
                }]}>
                  {reviewData.percentage}%
                </Text>
                <Text style={styles.reviewStatLabel}>Percentage</Text>
              </View>
            </View>

            <View style={styles.reviewCounts}>
              <View style={styles.reviewCountItem}>
                <View style={[styles.reviewCountDot, { backgroundColor: '#43A047' }]} />
                <Text style={styles.reviewCountText}>
                  Correct: {reviewData.correctCount}
                </Text>
              </View>
              <View style={styles.reviewCountItem}>
                <View style={[styles.reviewCountDot, { backgroundColor: '#E53935' }]} />
                <Text style={styles.reviewCountText}>
                  Wrong: {reviewData.wrongCount}
                </Text>
              </View>
              <View style={styles.reviewCountItem}>
                <View style={[styles.reviewCountDot, { backgroundColor: '#FB8C00' }]} />
                <Text style={styles.reviewCountText}>
                  Skipped: {reviewData.skippedCount}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.reviewQuestionsList} showsVerticalScrollIndicator={false}>
              {reviewData.reviews.map((review, index) => (
                <View key={index} style={styles.reviewQuestionCard}>
                  <View style={styles.reviewQuestionHeader}>
                    <View style={styles.reviewQuestionNumber}>
                      <Text style={styles.reviewQuestionNumberText}>
                        Q{review.number}
                      </Text>
                    </View>
                    <View style={[
                      styles.reviewStatusBadge,
                      review.isCorrect ? styles.reviewCorrectBadge : styles.reviewWrongBadge
                    ]}>
                      <Text style={[
                        styles.reviewStatusText,
                        review.isCorrect ? styles.reviewCorrectText : styles.reviewWrongText
                      ]}>
                        {review.isCorrect ? 'Correct' : 'Wrong'}
                      </Text>
                    </View>
                    <Text style={styles.reviewMarksText}>
                      {review.isCorrect ? `+${review.marks}` : `0/${review.marks}`}
                    </Text>
                  </View>

                  <Text style={styles.reviewQuestionText}>
                    {review.question}
                  </Text>

                  <View style={styles.reviewAnswerContainer}>
                    <Text style={styles.reviewAnswerLabel}>Your Answer:</Text>
                    {review.selectedAnswer ? (
                      <Text style={[
                        styles.reviewAnswerText,
                        review.isCorrect ? styles.reviewCorrectText : styles.reviewWrongText
                      ]}>
                        {review.selectedAnswer}
                      </Text>
                    ) : (
                      <Text style={[styles.reviewAnswerText, styles.reviewSkippedText]}>
                        Skipped
                      </Text>
                    )}
                  </View>

                  <View style={styles.reviewAnswerContainer}>
                    <Text style={styles.reviewAnswerLabel}>Correct Answer:</Text>
                    <Text style={[styles.reviewAnswerText, styles.reviewCorrectText]}>
                      {review.correctAnswer}
                    </Text>
                  </View>

                  <View style={styles.reviewExplanationBox}>
                    <Text style={styles.reviewExplanationLabel}>Explanation:</Text>
                    <Text style={styles.reviewExplanationText}>
                      {review.explanation}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeReviewButton}
              onPress={() => {
                setReviewModalVisible(false);
                setReviewData(null);
              }}
            >
              <Text style={styles.closeReviewButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Student Detail Modal
  const renderStudentModal = () => {
    if (!selectedStudent) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setStudentResults([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Student Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedStudent.studentName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setStudentResults([]);
                }}
              >
                <Icon name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatValue}>
                  {selectedStudent.testsAttempted}
                </Text>
                <Text style={styles.modalStatLabel}>Tests</Text>
              </View>
              <View style={styles.modalStatDivider} />
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatValue, { color: '#43A047' }]}>
                  {selectedStudent.highestScore}%
                </Text>
                <Text style={styles.modalStatLabel}>Highest</Text>
              </View>
              <View style={styles.modalStatDivider} />
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatValue, { color: '#E53935' }]}>
                  {selectedStudent.lowestScore}%
                </Text>
                <Text style={styles.modalStatLabel}>Lowest</Text>
              </View>
              <View style={styles.modalStatDivider} />
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatValue, { 
                  color: getScoreColor(selectedStudent.averageScore) 
                }]}>
                  {selectedStudent.averageScore}%
                </Text>
                <Text style={styles.modalStatLabel}>Average</Text>
              </View>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.resultsTitle}>Test History</Text>
              {loadingResults ? (
                <View style={styles.loadingResultsContainer}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingResultsText}>
                    Loading results...
                  </Text>
                </View>
              ) : studentResults.length > 0 ? (
                <FlatList
                  data={studentResults}
                  renderItem={renderResultItem}
                  keyExtractor={(item) => item._id || item.resultId}
                  contentContainerStyle={styles.resultsList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Icon name="file-text" size={48} color="#CCC" />
                  <Text style={styles.noResultsText}>No test results found</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading scoreboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Score Board</Text>
          <Text style={styles.headerSubtitle}>{filteredStudents.length} students</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchStudents}
        >
          <Icon name="refresh-cw" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search by student name..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
          returnKeyType="search"
          onSubmitEditing={dismissKeyboard}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Icon name="x" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.studentId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="users" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 
                ? `No students found matching "${searchQuery}"` 
                : 'No student performance data available'}
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />

      {/* Student Detail Modal */}
      {renderStudentModal()}

      {/* Review Modal */}
      {renderReviewModal()}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
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
  studentCard: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  studentEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  programBadge: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  programText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F0F0F0',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  lastAttemptText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
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
  // Student Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FF',
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  modalStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  resultsList: {
    paddingBottom: 20,
  },
  loadingResultsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingResultsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: '#F5F6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
  },
  resultScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultScoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8EAF6',
  },
  resultDetail: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 11,
    color: '#999',
  },
  resultValue: {
    fontSize: 13,
    color: '#1A1A1A',
    marginTop: 2,
  },
  resultDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E8EAF6',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  reviewButtonText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  // Review Modal Styles
  reviewModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingBottom: 10,
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reviewStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  reviewStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reviewStatLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  reviewStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: '#E0E0E0',
  },
  reviewCounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reviewCountItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCountDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  reviewCountText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  reviewQuestionsList: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  reviewQuestionCard: {
    backgroundColor: '#F5F6FF',
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
  },
  reviewQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  reviewQuestionNumber: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewQuestionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  reviewStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  reviewCorrectBadge: {
    backgroundColor: '#E8F5E9',
  },
  reviewWrongBadge: {
    backgroundColor: '#FFEBEE',
  },
  reviewStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewCorrectText: {
    color: '#43A047',
  },
  reviewWrongText: {
    color: '#E53935',
  },
  reviewSkippedText: {
    color: '#FB8C00',
  },
  reviewMarksText: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  reviewQuestionText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewAnswerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 3,
    flexWrap: 'wrap',
  },
  reviewAnswerLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 6,
    minWidth: 85,
    fontWeight: '500',
  },
  reviewAnswerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
    flexWrap: 'wrap',
  },
  reviewExplanationBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8EAF6',
  },
  reviewExplanationLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  reviewExplanationText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  closeReviewButton: {
    backgroundColor: '#4F46E5',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScoreBoard;