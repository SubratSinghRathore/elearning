// screens/Assignment.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: {
    id: string;
    name: string;
  };
  program: {
    id: string;
    name: string;
  };
  batch: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
    profileImage?: string;
  };
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE';
  maxScore: number;
  score?: number;
  feedback?: string;
  submissions?: {
    id: string;
    submittedAt: string;
    fileUrl: string;
    status: string;
  }[];
}

interface AssignmentResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    assignments: Assignment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const Assignment: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submissionFile, setSubmissionFile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE'>('ALL');

  /**
   * Fetch assignments from API
   */
  // const fetchAssignments = async () => {
  //   try {
  //     setLoading(true);
  //     console.log('📡 Fetching assignments...');
      
  //     const response = await api.get('/assignments');
      
  //     console.log('✅ Assignments response:', response.data);
      
  //     if (response.data.success) {
  //       setAssignments(response.data.data.assignments || []);
  //     } else {
  //       Alert.alert('Error', response.data.message || 'Failed to fetch assignments');
  //     }
  //   } catch (error: any) {
  //     console.error('❌ Error fetching assignments:', error);
  //     Alert.alert(
  //       'Error',
  //       error.response?.data?.message || 'Something went wrong. Please try again.'
  //     );
  //   } finally {
  //     setLoading(false);
  //     setRefreshing(false);
  //   }
  // };

  /**
   * Refresh assignments on focus
   */
  useFocusEffect(
    useCallback(() => {
      // fetchAssignments();
    }, [])
  );

  /**
   * Handle pull to refresh
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  /**
   * Submit assignment
   */
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;
    
    try {
      setSubmitting(true);
      console.log('📤 Submitting assignment:', selectedAssignment.id);
      
      const response = await api.post(`/assignments/${selectedAssignment.id}/submit`, {
        fileUrl: submissionFile || 'https://example.com/submission.pdf',
        notes: 'Assignment submitted via mobile app',
      });
      
      console.log('✅ Submission response:', response.data);
      
      if (response.data.success) {
        Alert.alert('Success', 'Assignment submitted successfully!');
        setModalVisible(false);
        setSubmissionFile('');
        fetchAssignments(); // Refresh list
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit assignment');
      }
    } catch (error: any) {
      console.error('❌ Error submitting assignment:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'SUBMITTED':
        return '#2196F3';
      case 'GRADED':
        return '#4CAF50';
      case 'OVERDUE':
        return '#F44336';
      default:
        return '#6B7280';
    }
  };

  /**
   * Get status text
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳ Pending';
      case 'SUBMITTED':
        return '📤 Submitted';
      case 'GRADED':
        return '✅ Graded';
      case 'OVERDUE':
        return '⚠️ Overdue';
      default:
        return status;
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Check if assignment is overdue
   */
  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  /**
   * Filter assignments
   */
  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === 'ALL') return true;
    if (filter === 'OVERDUE') {
      return isOverdue(assignment.dueDate) && assignment.status === 'PENDING';
    }
    return assignment.status === filter;
  });

  /**
   * Render assignment card
   */
  const renderAssignmentCard = (assignment: Assignment) => {
    const isPastDue = isOverdue(assignment.dueDate) && assignment.status === 'PENDING';
    const status = isPastDue ? 'OVERDUE' : assignment.status;

    return (
      <TouchableOpacity
        key={assignment.id}
        style={[styles.assignmentCard, status === 'OVERDUE' && styles.overdueCard]}
        onPress={() => {
          setSelectedAssignment(assignment);
          if (assignment.status !== 'GRADED') {
            setModalVisible(true);
          }
        }}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {getStatusText(status)}
            </Text>
          </View>
          {assignment.score !== undefined && assignment.status === 'GRADED' && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{assignment.score}/{assignment.maxScore}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.assignmentTitle}>{assignment.title}</Text>
        
        {/* Description */}
        <Text style={styles.assignmentDescription} numberOfLines={2}>
          {assignment.description}
        </Text>

        {/* Details */}
        <View style={styles.assignmentDetails}>
          <View style={styles.detailRow}>
            <Icon name="book-open" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{assignment.subject?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="users" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{assignment.batch?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="user" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{assignment.teacher?.name || 'Unknown'}</Text>
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.dueDateContainer}>
          <Icon 
            name="clock" 
            size={16} 
            color={status === 'OVERDUE' ? '#F44336' : '#6B7280'} 
          />
          <Text style={[styles.dueDateText, status === 'OVERDUE' && styles.overdueText]}>
            Due: {formatDate(assignment.dueDate)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render loading state
   */
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignments</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'PENDING', 'SUBMITTED', 'GRADED', 'OVERDUE'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterTab, filter === item && styles.filterTabActive]}
              onPress={() => setFilter(item as any)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item.charAt(0) + item.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Assignment List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAssignments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="file-text" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Assignments</Text>
            <Text style={styles.emptyText}>
              {filter === 'ALL' 
                ? 'You have no assignments at the moment.' 
                : `No ${filter.toLowerCase()} assignments found.`}
            </Text>
          </View>
        ) : (
          filteredAssignments.map(renderAssignmentCard)
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Submit Assignment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSubmissionFile('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Assignment</Text>
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false);
                  setSubmissionFile('');
                }}
                disabled={submitting}
              >
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody}>
              {selectedAssignment && (
                <>
                  <Text style={styles.modalAssignmentTitle}>
                    {selectedAssignment.title}
                  </Text>
                  <Text style={styles.modalAssignmentDesc}>
                    {selectedAssignment.description}
                  </Text>
                  
                  <View style={styles.modalDetailRow}>
                    <Icon name="book-open" size={16} color="#6B7280" />
                    <Text style={styles.modalDetailText}>
                      {selectedAssignment.subject?.name || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Icon name="clock" size={16} color="#6B7280" />
                    <Text style={styles.modalDetailText}>
                      Due: {formatDate(selectedAssignment.dueDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <Text style={styles.inputLabel}>Submission File URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter file URL or upload file"
                    value={submissionFile}
                    onChangeText={setSubmissionFile}
                    editable={!submitting}
                  />
                  
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={() => Alert.alert('Upload', 'File upload functionality coming soon')}
                    disabled={submitting}
                  >
                    <Icon name="upload" size={20} color="#4F46E5" />
                    <Text style={styles.uploadButtonText}>Upload File</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitAssignment}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Submit Assignment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    color: '#6B7280',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  backButton: {
    padding: width * 0.02,
  },

  headerTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#111827',
  },

  filterButton: {
    padding: width * 0.02,
  },

  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  filterTab: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    marginHorizontal: width * 0.02,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },

  filterTabActive: {
    backgroundColor: '#4F46E5',
  },

  filterText: {
    fontSize: width * 0.035,
    color: '#6B7280',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  listContainer: {
    flex: 1,
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02,
  },

  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  overdueCard: {
    borderWidth: 1,
    borderColor: '#F44336',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },

  statusBadge: {
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.005,
    borderRadius: 12,
  },

  statusText: {
    fontSize: width * 0.03,
    fontWeight: '600',
  },

  scoreBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.005,
    borderRadius: 12,
  },

  scoreText: {
    fontSize: width * 0.03,
    fontWeight: '600',
    color: '#4CAF50',
  },

  assignmentTitle: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#111827',
    marginBottom: height * 0.005,
  },

  assignmentDescription: {
    fontSize: width * 0.035,
    color: '#6B7280',
    marginBottom: height * 0.015,
  },

  assignmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width * 0.03,
    marginBottom: height * 0.015,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailText: {
    fontSize: width * 0.03,
    color: '#6B7280',
    marginLeft: width * 0.015,
  },

  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dueDateText: {
    fontSize: width * 0.03,
    color: '#6B7280',
    marginLeft: width * 0.015,
  },

  overdueText: {
    color: '#F44336',
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.1,
  },

  emptyTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#111827',
    marginTop: height * 0.02,
  },

  emptyText: {
    fontSize: width * 0.035,
    color: '#6B7280',
    marginTop: height * 0.01,
    textAlign: 'center',
  },

  bottomSpace: {
    height: height * 0.03,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    paddingHorizontal: width * 0.05,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  modalTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#111827',
  },

  modalBody: {
    paddingVertical: height * 0.02,
  },

  modalAssignmentTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#111827',
    marginBottom: height * 0.005,
  },

  modalAssignmentDesc: {
    fontSize: width * 0.035,
    color: '#6B7280',
    marginBottom: height * 0.02,
  },

  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },

  modalDetailText: {
    fontSize: width * 0.035,
    color: '#6B7280',
    marginLeft: width * 0.02,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: height * 0.02,
  },

  inputLabel: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#111827',
    marginBottom: height * 0.01,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    fontSize: width * 0.035,
    backgroundColor: '#F9FAFB',
    marginBottom: height * 0.015,
  },

  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: height * 0.015,
    borderStyle: 'dashed',
  },

  uploadButtonText: {
    fontSize: width * 0.035,
    color: '#4F46E5',
    marginLeft: width * 0.02,
  },

  modalFooter: {
    paddingVertical: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: height * 0.018,
    borderRadius: 12,
    gap: width * 0.02,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
});

export default Assignment;