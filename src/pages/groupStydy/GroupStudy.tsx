// components/GroupStudy.tsx - Updated with Web Redirect
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../api/axios';

interface User {
  id: string;
  name: string;
  profileImage: string;
}

interface StudyRoom {
  id: string;
  name: string;
  description: string;
  subject: string;
  roomName: string;
  isPrivate: boolean;
  status: string;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  createdBy: User;
  memberCount: number;
}

interface GroupStudyProps {
  navigation?: any;
}

const GroupStudy: React.FC<GroupStudyProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchGroupStudyRooms();
  }, []);

  const fetchGroupStudyRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/group-study?page=1&limit=10&filter=ALL`);
      
      console.log('Group Study Rooms Response:', response.data);
      
      if (response.data.success) {
        setRooms(response.data.data.rooms);
      }
    } catch (error: any) {
      console.error('Error fetching group study rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return { bg: '#D1FAE5', text: '🔴 Live', color: '#10B981', icon: 'radio' };
      case 'UPCOMING':
        return { bg: '#FEF3C7', text: '⏰ Upcoming', color: '#F59E0B', icon: 'clock' };
      case 'ENDED':
        return { bg: '#FEE2E2', text: '✅ Ended', color: '#EF4444', icon: 'check-circle' };
      default:
        return { bg: '#F3F4F6', text: status, color: '#9CA3AF', icon: 'circle' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'radio';
      case 'UPCOMING':
        return 'clock';
      case 'ENDED':
        return 'check-circle';
      default:
        return 'circle';
    }
  };

  const handleJoinRoom = (room: StudyRoom) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const openOnWeb = async (room: StudyRoom) => {
    try {
      // Construct the web URL - adjust the base URL as needed
      const baseUrl = 'https://elearning.mssplonline.in/group-study/room/'; // Replace with your actual domain
      const roomUrl = `${baseUrl}${room.roomName}`;
      
      const canOpen = await Linking.canOpenURL(roomUrl);
      
      if (canOpen) {
        await Linking.openURL(roomUrl);
      } else {
        // Fallback: Open in browser with the base URL
        await Linking.openURL(baseUrl);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert(
        'Error',
        'Unable to open the study room. Please try again.'
      );
    }
  };

  const handleWebRedirect = () => {
    if (!selectedRoom) return;
    
    Alert.alert(
      'Open on Web',
      'This feature is available on the web version. Would you like to open it in your browser?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open in Browser',
          onPress: () => openOnWeb(selectedRoom),
        },
      ]
    );
  };

  const renderRoomCard = ({ item }: { item: StudyRoom }) => {
    const isLive = item.status === 'LIVE';
    const statusBadge = getStatusBadge(item.status);
    const isPrivate = item.isPrivate;

    return (
      <TouchableOpacity
        style={[styles.roomCard, isLive && styles.liveCard]}
        onPress={() => handleJoinRoom(item)}
        activeOpacity={0.8}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
            {statusBadge.text}
          </Text>
        </View>

        {/* Room Info */}
        <View style={styles.roomHeader}>
          <View style={styles.roomIconContainer}>
            <Icon name="users" size={20} color="#4F46E5" />
          </View>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.roomMeta}>
              <Icon name="book-open" size={12} color="#6B7280" />
              <Text style={styles.metaText} numberOfLines={1}>{item.subject}</Text>
              {isPrivate && (
                <>
                  <View style={styles.metaDivider} />
                  <Icon name="lock" size={12} color="#6B7280" />
                </>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="user" size={12} color="#6B7280" />
            <Text style={styles.statText}>{item.createdBy?.name?.split(' ')[0] || 'User'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="users" size={12} color="#6B7280" />
            <Text style={styles.statText}>{item.memberCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="clock" size={12} color="#6B7280" />
            <Text style={styles.statText}>{getTimeAgo(item.startedAt)}</Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {isLive ? (
            <TouchableOpacity 
              style={styles.joinButton} 
              onPress={() => handleJoinRoom(item)}
            >
              <Text style={styles.joinButtonText}>View Details</Text>
              <Icon name="arrow-right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Not Available</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="users" size={24} color="#9CA3AF" />
        <Text style={styles.emptyText}>No study groups</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={rooms}
        renderItem={renderRoomCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={true}
      />

      {/* Room Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="users" size={28} color="#FFFFFF" />
              </View>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="x" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedRoom && (
              <>
                {/* Room Status */}
                <View style={[
                  styles.modalStatus, 
                  { 
                    backgroundColor: selectedRoom.status === 'LIVE' ? '#D1FAE5' : 
                                    selectedRoom.status === 'UPCOMING' ? '#FEF3C7' : '#FEE2E2' 
                  }
                ]}>
                  <Icon 
                    name={getStatusIcon(selectedRoom.status)} 
                    size={16} 
                    color={
                      selectedRoom.status === 'LIVE' ? '#10B981' : 
                      selectedRoom.status === 'UPCOMING' ? '#F59E0B' : '#EF4444'
                    } 
                  />
                  <Text style={[
                    styles.modalStatusText,
                    { 
                      color: selectedRoom.status === 'LIVE' ? '#10B981' : 
                             selectedRoom.status === 'UPCOMING' ? '#F59E0B' : '#EF4444' 
                    }
                  ]}>
                    {selectedRoom.status === 'LIVE' ? 'Live Now' : 
                     selectedRoom.status === 'UPCOMING' ? 'Upcoming' : 'Ended'}
                  </Text>
                </View>

                {/* Room Title */}
                <Text style={styles.modalTitle}>{selectedRoom.name}</Text>
                
                {/* Room Description */}
                {selectedRoom.description && (
                  <Text style={styles.modalDescription}>
                    {selectedRoom.description}
                  </Text>
                )}

                {/* Room Details */}
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <View style={styles.modalDetailIcon}>
                      <Icon name="book-open" size={16} color="#4F46E5" />
                    </View>
                    <Text style={styles.modalDetailLabel}>Subject</Text>
                    <Text style={styles.modalDetailValue}>{selectedRoom.subject}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <View style={styles.modalDetailIcon}>
                      <Icon name="user" size={16} color="#4F46E5" />
                    </View>
                    <Text style={styles.modalDetailLabel}>Created By</Text>
                    <Text style={styles.modalDetailValue}>{selectedRoom.createdBy?.name}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <View style={styles.modalDetailIcon}>
                      <Icon name="users" size={16} color="#4F46E5" />
                    </View>
                    <Text style={styles.modalDetailLabel}>Members</Text>
                    <Text style={styles.modalDetailValue}>{selectedRoom.memberCount}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <View style={styles.modalDetailIcon}>
                      <Icon name={selectedRoom.isPrivate ? "lock" : "unlock"} size={16} color="#4F46E5" />
                    </View>
                    <Text style={styles.modalDetailLabel}>Privacy</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedRoom.isPrivate ? '🔒 Private Room' : '🌐 Public Room'}
                    </Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <View style={styles.modalDetailIcon}>
                      <Icon name="clock" size={16} color="#4F46E5" />
                    </View>
                    <Text style={styles.modalDetailLabel}>Started</Text>
                    <Text style={styles.modalDetailValue}>
                      {new Date(selectedRoom.startedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Web Redirect Button */}
                <TouchableOpacity 
                  style={styles.webButton}
                  onPress={handleWebRedirect}
                  activeOpacity={0.8}
                >
                  <View style={styles.webButtonContent}>
                    <Icon name="globe" size={20} color="#FFFFFF" />
                    <View style={styles.webButtonTextContainer}>
                      <Text style={styles.webButtonTitle}>Open on Web</Text>
                      <Text style={styles.webButtonSubtitle}>
                        Full features available on the web version
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },

  loadingContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 6,
    width: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  liveCard: {
    borderColor: '#10B981',
    borderWidth: 2,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 10,
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  roomIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  roomInfo: {
    flex: 1,
  },

  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },

  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 3,
    flex: 1,
  },

  metaDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 10,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  statText: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 3,
    fontWeight: '500',
  },

  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },

  actionContainer: {
    marginTop: 'auto',
  },

  joinButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },

  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  disabledButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  disabledButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalClose: {
    padding: 4,
  },

  modalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },

  modalStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },

  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },

  modalDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },

  modalDetailIcon: {
    width: 28,
    alignItems: 'center',
  },

  modalDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 10,
    width: 80,
  },

  modalDetailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },

  webButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  webButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  webButtonTextContainer: {
    flex: 1,
  },

  webButtonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  webButtonSubtitle: {
    color: '#C7D2FE',
    fontSize: 11,
    marginTop: 2,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },

  modalCancelText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },

  modalJoinButton: {
    backgroundColor: '#4F46E5',
  },

  modalJoinText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default GroupStudy;