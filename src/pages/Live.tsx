// screens/Live.tsx
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
  Dimensions,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface Teacher {
  id: string;
  name: string;
  profileImage: string;
}

interface Program {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  status: string;
  roomName: string;
  durationMinutes: number;
  maxParticipants: number;
  isRecordingEnabled: boolean;
  isChatEnabled: boolean;
  isScreenShareAllowed: boolean;
  scheduledAt: string;
  startedAt: string;
  endsAt: string;
  endedAt: string | null;
  createdBy: Teacher;
  teacher: Teacher;
  program: Program;
  subject: Subject;
  batch: Batch;
}

interface LiveResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    sessions: LiveSession[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const Live: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [paginationScheduled, setPaginationScheduled] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [joining, setJoining] = useState(false);

  /**
   * Fetch live sessions from API
   */
  const fetchLiveSessions = async (page = 1) => {
    try {
      setLoading(true);
      console.log('📡 Fetching live sessions...');

      const response = await api.get(`/live-classes?status=LIVE&page=${page}&limit=20`);

      if (response.data.success) {
        setSessions(response.data.data.sessions || []);
        setPagination(response.data.data.pagination);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch live classes');
      }
    } catch (error: any) {
      console.error('❌ Error fetching live sessions:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchScheduledSessions = async (page = 1) => {
    try {
      setLoading(true);
      console.log('📡 Fetching live sessions...');

      const response = await api.get(`/live-classes?status=SCHEDULED&page=${page}&limit=20`);

      if (response.data.success) {
        setSessions(prev => [
          ...prev,
          ...(response.data.data.sessions || []),
        ]);
        setPaginationScheduled(response.data.data.pagination);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch live classes');
      }
    } catch (error: any) {
      console.error('❌ Error fetching live sessions:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Refresh sessions on focus
   */
  useFocusEffect(
    useCallback(() => {
      fetchLiveSessions(1);
      fetchScheduledSessions(1);
    }, [])
  );

  /**
   * Handle pull to refresh
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveSessions(1);
    fetchScheduledSessions(1);
  };

  /**
   * Handle join session
   */
  const handleJoinSession = (session: LiveSession) => {
    setSelectedSession(session);
    setModalVisible(true);
  };

  /**
   * Confirm join and navigate to JoinLive
   */
  const confirmJoin = () => {
    if (!selectedSession) return;

    setModalVisible(false);
    navigation.navigate('JoinLive', {
      sessionId: selectedSession.id,
      roomName: selectedSession.roomName,
      title: selectedSession.title,
      teacher: selectedSession.teacher?.name || 'Teacher',
      subject: selectedSession.subject?.name || 'Subject',
      batch: selectedSession.batch?.name || 'N/A',
    });
  };

  /**
   * Format time
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return '#4CAF50';
      case 'UPCOMING':
        return '#FF9800';
      case 'ENDED':
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
      case 'LIVE':
        return '🔴 LIVE';
      case 'UPCOMING':
        return '⏰ Upcoming';
      case 'ENDED':
        return '✅ Ended';
      default:
        return status;
    }
  };

  /**
   * Get time remaining
   */
  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  /**
   * Render session card
   */
  const renderSessionCard = ({ item }: { item: LiveSession }) => {
    const isLive = item.status === 'LIVE';
    const isUpcoming = item.status === 'UPCOMING';
    const isEnded = item.status === 'ENDED';

    return (
      <TouchableOpacity
        style={[styles.sessionCard, isLive && styles.liveCard]}
        onPress={() => isLive && handleJoinSession(item)}
        activeOpacity={0.7}
        disabled={!isLive}
      >
        {/* Status Badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.sessionTitle}>{item.title}</Text>

        {/* Description */}
        <Text style={styles.sessionDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Icon name="user" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.teacher?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="book-open" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.subject?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="users" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.batch?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="clock" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.durationMinutes}m</Text>
          </View>
        </View>

        {/* Teacher Avatar and Info */}
        <View style={styles.teacherContainer}>
          {item.teacher?.profileImage ? (
            <Image
              source={{ uri: item.teacher.profileImage }}
              style={styles.teacherAvatar}
            />
          ) : (
            <View style={[styles.teacherAvatar, styles.teacherAvatarPlaceholder]}>
              <Text style={styles.teacherInitial}>
                {item.teacher?.name?.charAt(0) || 'T'}
              </Text>
            </View>
          )}
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherName}>{item.teacher?.name || 'Unknown Teacher'}</Text>
            <Text style={styles.teacherProgram}>
              {item.program?.name || ''} • {item.subject?.name || ''}
            </Text>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.timeContainer}>
          <View style={styles.timeRow}>
            <Icon name="calendar" size={14} color="#6B7280" />
            <Text style={styles.timeText}>{formatDate(item.scheduledAt)}</Text>
          </View>
          <View style={styles.timeRow}>
            <Icon name="clock" size={14} color="#6B7280" />
            <Text style={styles.timeText}>
              {formatTime(item.scheduledAt)} - {formatTime(item.endsAt)}
            </Text>
          </View>
          {isLive && (
            <View style={styles.timeRow}>
              <Icon name="timer" size={14} color="#4CAF50" />
              <Text style={[styles.timeText, styles.remainingText]}>
                {getTimeRemaining(item.endsAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Join Button */}
        {isLive && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoinSession(item)}
          >
            <Icon name="video" size={18} color="#FFFFFF" />
            <Text style={styles.joinButtonText}>Join Now</Text>
          </TouchableOpacity>
        )}

        {isUpcoming && (
          <View style={styles.upcomingButton}>
            <Icon name="clock" size={18} color="#FF9800" />
            <Text style={styles.upcomingText}>Starts at {formatTime(item.scheduledAt)}</Text>
          </View>
        )}

        {isEnded && (
          <View style={styles.endedButton}>
            <Icon name="check-circle" size={18} color="#F44336" />
            <Text style={styles.endedText}>Class Ended</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render footer component for pagination
   */
  const renderFooter = () => {
    if (pagination.totalPages <= 1) {
      return null;
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageButton, pagination.page === 1 && styles.pageButtonDisabled]}
          onPress={() => fetchLiveSessions(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>
          Page {pagination.page} of {pagination.totalPages}
        </Text>
        <TouchableOpacity
          style={[styles.pageButton, pagination.page === pagination.totalPages && styles.pageButtonDisabled]}
          onPress={() => fetchLiveSessions(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
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
          <Text style={styles.loadingText}>Loading live classes...</Text>
          <Text style={styles.loadingSubText}>Please wait while we fetch the sessions</Text>
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
        <Text style={styles.headerTitle}>Live Classes</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh-cw" size={22} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.liveStat]}>
            {sessions.filter(s => s.status === 'LIVE').length}
          </Text>
          <Text style={styles.statLabel}>Live Now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.upcomingStat]}>
            {sessions.filter(s => s.status === 'SCHEDULED').length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.endedStat]}>
            {sessions.filter(s => s.status === 'ENDED').length}
          </Text>
          <Text style={styles.statLabel}>Ended</Text>
        </View>
      </View>

      {/* Session List */}
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="video-off" size={60} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Live Classes</Text>
          <Text style={styles.emptyText}>
            There are no live classes available at the moment. Check back later!
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
          ListFooterComponent={renderFooter()}
        />
      )}

      {/* Join Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="video" size={32} color="#4F46E5" />
              </View>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Join Live Class</Text>
            <Text style={styles.modalSubtitle}>
              You are about to join the live session
            </Text>

            {selectedSession && (
              <View style={styles.modalDetails}>
                <View style={styles.modalDetailRow}>
                  <Icon name="book-open" size={18} color="#4F46E5" />
                  <Text style={styles.modalDetailLabel}>Class:</Text>
                  <Text style={styles.modalDetailValue}>{selectedSession.title}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Icon name="user" size={18} color="#4F46E5" />
                  <Text style={styles.modalDetailLabel}>Teacher:</Text>
                  <Text style={styles.modalDetailValue}>{selectedSession.teacher?.name}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Icon name="clock" size={18} color="#4F46E5" />
                  <Text style={styles.modalDetailLabel}>Duration:</Text>
                  <Text style={styles.modalDetailValue}>{selectedSession.durationMinutes} minutes</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Icon name="users" size={18} color="#4F46E5" />
                  <Text style={styles.modalDetailLabel}>Participants:</Text>
                  <Text style={styles.modalDetailValue}>{selectedSession.maxParticipants}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalJoinButton]}
                onPress={confirmJoin}
              >
                <Icon name="video" size={20} color="#FFFFFF" />
                <Text style={styles.modalJoinText}>Join Now</Text>
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
    paddingHorizontal: width * 0.05,
  },

  loadingText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#111827',
    marginTop: height * 0.02,
  },

  loadingSubText: {
    fontSize: width * 0.035,
    color: '#6B7280',
    marginTop: height * 0.005,
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

  refreshButton: {
    padding: width * 0.02,
  },

  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: width * 0.04,
    marginTop: height * 0.02,
    borderRadius: 16,
    paddingVertical: height * 0.015,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#111827',
  },

  liveStat: {
    color: '#4CAF50',
  },

  upcomingStat: {
    color: '#FF9800',
  },

  endedStat: {
    color: '#F44336',
  },

  statLabel: {
    fontSize: width * 0.03,
    color: '#6B7280',
    marginTop: height * 0.002,
  },

  statDivider: {
    width: 1,
    height: height * 0.04,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },

  listContent: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.1,
  },

  sessionCard: {
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

  liveCard: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },

  statusBadge: {
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.004,
    borderRadius: 12,
  },

  statusText: {
    fontSize: width * 0.03,
    fontWeight: '600',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.004,
    borderRadius: 12,
  },

  liveDot: {
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: width * 0.01,
    backgroundColor: '#EF4444',
    marginRight: width * 0.015,
  },

  liveBadgeText: {
    color: '#EF4444',
    fontSize: width * 0.025,
    fontWeight: '600',
  },

  sessionTitle: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#111827',
    marginBottom: height * 0.005,
  },

  sessionDescription: {
    fontSize: width * 0.035,
    color: '#6B7280',
    marginBottom: height * 0.015,
  },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: height * 0.015,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: width * 0.04,
    marginBottom: height * 0.005,
  },

  detailText: {
    fontSize: width * 0.03,
    color: '#6B7280',
    marginLeft: width * 0.015,
  },

  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },

  teacherAvatar: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    marginRight: width * 0.03,
  },

  teacherAvatarPlaceholder: {
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  teacherInitial: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: '700',
  },

  teacherInfo: {
    flex: 1,
  },

  teacherName: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#111827',
  },

  teacherProgram: {
    fontSize: width * 0.03,
    color: '#6B7280',
  },

  timeContainer: {
    marginBottom: height * 0.015,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.004,
  },

  timeText: {
    fontSize: width * 0.03,
    color: '#6B7280',
    marginLeft: width * 0.015,
  },

  remainingText: {
    color: '#4CAF50',
    fontWeight: '600',
  },

  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: height * 0.015,
    borderRadius: 12,
    gap: width * 0.02,
  },

  joinButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: '600',
  },

  upcomingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: height * 0.015,
    borderRadius: 12,
    gap: width * 0.02,
  },

  upcomingText: {
    color: '#FF9800',
    fontSize: width * 0.035,
    fontWeight: '600',
  },

  endedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: height * 0.015,
    borderRadius: 12,
    gap: width * 0.02,
  },

  endedText: {
    color: '#F44336',
    fontSize: width * 0.035,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.15,
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
    paddingHorizontal: width * 0.1,
  },

  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.02,
  },

  pageButton: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    marginHorizontal: width * 0.02,
  },

  pageButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },

  pageButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.035,
    fontWeight: '600',
  },

  pageInfo: {
    fontSize: width * 0.035,
    color: '#6B7280',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: width * 0.06,
    width: '100%',
    maxWidth: 400,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },

  modalIconContainer: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalClose: {
    padding: width * 0.01,
  },

  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#111827',
    marginBottom: height * 0.005,
  },

  modalSubtitle: {
    fontSize: width * 0.035,
    color: '#6B7280',
    marginBottom: height * 0.02,
  },

  modalDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
  },

  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.008,
  },

  modalDetailLabel: {
    fontSize: width * 0.035,
    color: '#6B7280',
    marginLeft: width * 0.02,
    width: width * 0.2,
  },

  modalDetailValue: {
    fontSize: width * 0.035,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: width * 0.03,
  },

  modalButton: {
    flex: 1,
    paddingVertical: height * 0.015,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },

  modalCancelText: {
    color: '#6B7280',
    fontSize: width * 0.04,
    fontWeight: '600',
  },

  modalJoinButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    gap: width * 0.02,
  },

  modalJoinText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
});

export default Live;