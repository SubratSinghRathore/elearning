// pages/academics/AssignmentsScreen.tsx
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
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../api/axios';

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
  questions: any[];
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

const AssignmentsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [totalAssessments, setTotalAssessments] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse>('/assessments');
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return '#43A047';
      case 'DRAFT':
        return '#FB8C00';
      case 'ARCHIVED':
        return '#E53935';
      default:
        return '#666';
    }
  };

  const getSubjectName = (subject: any): string => {
    if (typeof subject === 'string') return subject;
    return subject?.name || 'N/A';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setDetailModalVisible(true);
  };

  const handleDeleteAssessment = (assessment: Assessment) => {
    Alert.alert(
      'Delete Assessment',
      `Are you sure you want to delete "${assessment.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(assessment.id),
        },
      ]
    );
  };

  const confirmDelete = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.delete(`/assessments/${id}`);
      
      if (response.data.success) {
        Alert.alert('Success', 'Assessment deleted successfully');
        await fetchAssessments();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete assessment');
      }
    } catch (error: any) {
      console.error('Error deleting assessment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete assessment');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAssessment = (assessment: Assessment) => {
    Alert.alert(
      'Publish Assessment',
      `Are you sure you want to publish "${assessment.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: () => confirmPublish(assessment.id),
        },
      ]
    );
  };

  const confirmPublish = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.patch(`/assessments/${id}/publish`);
      
      if (response.data.success) {
        Alert.alert('Success', 'Assessment published successfully');
        await fetchAssessments();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to publish assessment');
      }
    } catch (error: any) {
      console.error('Error publishing assessment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to publish assessment');
    } finally {
      setLoading(false);
    }
  };

  const renderAssessmentItem = ({ item }: { item: Assessment }) => {
    const isPublished = item.status === 'PUBLISHED';
    const difficultyColor = getDifficultyColor(item.difficulty);
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.assessmentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.assessmentTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="book" size={14} color="#666" />
              <Text style={styles.detailText}>{item.assessmentType}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="layers" size={14} color="#666" />
              <Text style={styles.detailText}>{getSubjectName(item.subjectId)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="file-text" size={14} color="#666" />
              <Text style={styles.detailText}>{item.questionCount} Qs</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="award" size={14} color="#666" />
              <Text style={styles.detailText}>{item.totalMarks} marks</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20' }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                {getDifficultyLabel(item.difficulty)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="hash" size={14} color="#666" />
              <Text style={styles.detailText}>{item.topic?.join(', ') || 'No topics'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="calendar" size={14} color="#666" />
              <Text style={styles.detailText}>Created: {formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]} 
            onPress={() => handleViewAssessment(item)}
          >
            <Icon name="eye" size={16} color="#4F46E5" />
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>

          {!isPublished ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.publishButton]} 
                onPress={() => handlePublishAssessment(item)}
              >
                <Icon name="send" size={16} color="#FFF" />
                <Text style={styles.publishButtonText}>Publish</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={() => handleDeleteAssessment(item)}
              >
                <Icon name="trash-2" size={16} color="#E53935" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.publishedBadge}>
              <Icon name="check-circle" size={16} color="#43A047" />
              <Text style={styles.publishedText}>Published</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedAssessment) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assessment Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>General Information</Text>
                
                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Title</Text>
                  <Text style={styles.modalValue}>{selectedAssessment.title}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Type</Text>
                  <Text style={styles.modalValue}>{selectedAssessment.assessmentType}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Subject</Text>
                  <Text style={styles.modalValue}>{getSubjectName(selectedAssessment.subjectId)}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Difficulty</Text>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(selectedAssessment.difficulty) + '20' }
                  ]}>
                    <Text style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(selectedAssessment.difficulty) }
                    ]}>
                      {getDifficultyLabel(selectedAssessment.difficulty)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedAssessment.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(selectedAssessment.status) }
                    ]}>
                      {selectedAssessment.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Topics</Text>
                  <Text style={styles.modalValue}>{selectedAssessment.topic?.join(', ') || 'No topics'}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Question Types</Text>
                  <Text style={styles.modalValue}>{selectedAssessment.questionTypes?.join(', ')}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Questions</Text>
                  <Text style={styles.modalValue}>{selectedAssessment.questionCount}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Total Marks</Text>
                  <Text style={styles.modalValue}>{selectedAssessment.totalMarks}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Instructions</Text>
                  <Text style={styles.modalValue}>{selectedAssessment.instructions || 'No instructions'}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Created At</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedAssessment.createdAt)}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Last Updated</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedAssessment.updatedAt)}</Text>
                </View>
              </View>

              {/* Questions Preview */}
              {selectedAssessment.questions && selectedAssessment.questions.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Questions Preview</Text>
                  {selectedAssessment.questions.slice(0, 3).map((q: any, index: number) => (
                    <View key={index} style={styles.questionPreviewItem}>
                      <Text style={styles.questionPreviewNumber}>Q{index + 1}.</Text>
                      <Text style={styles.questionPreviewText} numberOfLines={2}>
                        {q.question}
                      </Text>
                    </View>
                  ))}
                  {selectedAssessment.questions.length > 3 && (
                    <Text style={styles.moreQuestionsText}>
                      + {selectedAssessment.questions.length - 3} more questions
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            {selectedAssessment.status !== 'PUBLISHED' && (
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.publishModalButton]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handlePublishAssessment(selectedAssessment);
                  }}
                >
                  <Text style={styles.publishModalButtonText}>Publish</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.deleteModalButton]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleDeleteAssessment(selectedAssessment);
                  }}
                >
                  <Text style={styles.deleteModalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.assessmentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSubjectName(assessment.subjectId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading assessments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Assessments</Text>
          <Text style={styles.headerSubtitle}>{totalAssessments} assessments total</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, type, subject, or status..."
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
            <Text style={styles.emptyTitle}>No Assessments Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 
                ? 'No assessments match your search criteria' 
                : 'Get started by creating your first assessment'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreateAssessment' as never)}
            >
              <Text style={styles.emptyButtonText}>Create Assessment</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Detail Modal */}
      {renderDetailModal()}
    </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewButton: {
    backgroundColor: '#E8EAF6',
  },
  viewButtonText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  publishButton: {
    backgroundColor: '#4F46E5',
  },
  publishButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#E53935',
    fontWeight: '500',
  },
  publishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  publishedText: {
    fontSize: 13,
    color: '#43A047',
    fontWeight: '500',
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
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalSection: {
    marginTop: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#E8EAF6',
  },
  modalInfoItem: {
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  modalValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  questionPreviewItem: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  questionPreviewNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
    marginRight: 8,
    minWidth: 30,
  },
  questionPreviewText: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A1A',
  },
  moreQuestionsText: {
    fontSize: 13,
    color: '#4F46E5',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  publishModalButton: {
    backgroundColor: '#4F46E5',
  },
  publishModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteModalButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
  },
});

export default AssignmentsScreen;