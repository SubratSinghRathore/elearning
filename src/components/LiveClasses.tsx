// components/LiveClasses.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../api/axios';

const { width } = Dimensions.get('window');

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

interface LiveClassesResponse {
  sessions: LiveSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LiveClassesProps {
  onJoinSession?: (sessionId: string, roomName: string) => void;
}

interface LiveClassesProps {
  navigation?: any;
  onJoinSession?: (sessionId: string, roomName: string) => void;
}

const LiveClasses: React.FC<LiveClassesProps> = ({ navigation, onJoinSession }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/live-classes?status=LIVE&page=${page}&limit=3`);
      
      console.log('Live Classes Response:', response.data);
      
      if (response.data.success) {
        setSessions(response.data.data.sessions);
        setPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveClasses(1);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return '#4CAF50';
      case 'UPCOMING':
        return '#FF9800';
      case 'ENDED':
        return '#F44336';
      default:
        return '#999';
    }
  };

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

  const handleJoinSession = (session: LiveSession) => {
    if (onJoinSession) {
      onJoinSession(session.id, session.roomName);
    } else if (navigation) {
      // Navigate to video call screen
      navigation.navigate("VideoCall", { 
        sessionId: session.id, 
        roomName: session.roomName,
        title: session.title,
        teacher: session.teacher.name,
      });
    }
  };

  const renderSessionCard = (session: LiveSession) => {
    const isLive = session.status === 'LIVE';
    const hasStarted = session.startedAt && new Date(session.startedAt) <= new Date();
    const isActive = isLive || (hasStarted && !session.endedAt);

    return (
      <TouchableOpacity
        key={session.id}
        style={[styles.sessionCard, isActive && styles.activeCard]}
        onPress={() => handleJoinSession(session)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(session.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
              {getStatusText(session.status)}
            </Text>
          </View>
          {isLive && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <Text style={styles.sessionTitle}>{session.title}</Text>
        <Text style={styles.sessionDescription} numberOfLines={2}>
          {session.description}
        </Text>

        <View style={styles.divider} />

        <View style={styles.sessionDetails}>
          <View style={styles.detailItem}>
            <Icon name="book-open" size={16} color="#666" />
            <Text style={styles.detailText}>{session.subject?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="users" size={16} color="#666" />
            <Text style={styles.detailText}>{session.batch?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="clock" size={16} color="#666" />
            <Text style={styles.detailText}>{session.durationMinutes}m</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.teacherContainer}>
          {session.teacher?.profileImage ? (
            <Image
              source={{ uri: session.teacher.profileImage }}
              style={styles.teacherAvatar}
            />
          ) : (
            <View style={[styles.teacherAvatar, styles.teacherAvatarPlaceholder]}>
              <Text style={styles.teacherInitial}>
                {session.teacher?.name?.charAt(0) || 'T'}
              </Text>
            </View>
          )}
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherName}>{session.teacher?.name || 'Unknown Teacher'}</Text>
            <Text style={styles.teacherProgram}>
              {session.program?.name || ''} • {session.subject?.name || ''}
            </Text>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <Icon name="calendar" size={14} color="#999" />
          <Text style={styles.timeText}>
            {formatDate(session.scheduledAt)} • {formatTime(session.scheduledAt)}
          </Text>
        </View>

        {isLive && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoinSession(session)}
          >
            <Icon name="video" size={18} color="#FFF" />
            <Text style={styles.joinButtonText}>Join Now</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading live classes...</Text>
      </View>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="video-off" size={60} color="#CCC" />
        <Text style={styles.emptyTitle}>No Live Classes</Text>
        <Text style={styles.emptyText}>
          There are no live classes available at the moment. Check back later!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
      }
    >

      {sessions.map((session) => renderSessionCard(session))}

      {pagination.totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.pageButton, pagination.page === 1 && styles.pageButtonDisabled]}
            onPress={() => fetchLiveClasses(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.pageButton, pagination.page === pagination.totalPages && styles.pageButtonDisabled]}
            onPress={() => fetchLiveClasses(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  headerCount: {
    fontSize: 14,
    color: '#999',
  },

  sessionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  activeCard: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  liveBadge: {
    backgroundColor: '#FF1744',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },

  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  sessionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },

  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },

  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  teacherAvatarPlaceholder: {
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  teacherInitial: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },

  teacherInfo: {
    flex: 1,
  },

  teacherName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  teacherProgram: {
    fontSize: 12,
    color: '#999',
  },

  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },

  joinButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },

  joinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },

  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    marginHorizontal: 8,
  },

  pageButtonDisabled: {
    backgroundColor: '#CCC',
  },

  pageButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
});

export default LiveClasses;