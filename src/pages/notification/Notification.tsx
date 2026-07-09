// screens/Notification.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

interface NotificationItem {
  id: string;
  notificationId: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  sentAt: string;
  status: string;
  body: string;
  entityId: string;
  title: string;
  type: string;
  userId: string;
}

interface NotificationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    notifications: NotificationItem[];
    totalNotifications: number;
    unreadCount: number;
    page: string;
    limit: string;
    totalPages: number;
  };
}

const Notification: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Helper function to format time without date-fns
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffYear > 0) {
      return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
    } else if (diffMonth > 0) {
      return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const fetchNotifications = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await api.get<NotificationResponse>(
        `/notification?page=${pageNum}&limit=20`
      );

      if (response.data.success) {
        const newNotifications = response.data.data.notifications;
        
        if (refresh || pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setUnreadCount(response.data.data.unreadCount);
        setTotalNotifications(response.data.data.totalNotifications);
        setTotalPages(response.data.data.totalPages);
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notification/${notificationId}/read`);

      // Update local state
      setNotifications(prev =>
        prev.map(item =>
          item.id === notificationId
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notification/mark-all-read');

      // Update local state
      setNotifications(prev =>
        prev.map(item => ({
          ...item,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    // Mark as read if not already

    if (!item.isRead) {
        markAsRead(item.id);
    }
    
        navigation.navigate('ReadNotification', { notification: item });
  };

  const loadMore = () => {
    if (!loadingMore && page < totalPages) {
      setLoadingMore(true);
      fetchNotifications(page + 1);
    }
  };

  const onRefresh = () => {
    fetchNotifications(1, true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1);
    }, [])
  );

  const getIconForType = (type: string) => {
    switch (type) {
      case 'MATERIAL_PUBLISHED':
        return 'book';
      case 'SESSION_REMINDER':
        return 'calendar';
      case 'ASSIGNMENT_SUBMITTED':
        return 'file-text';
      case 'ASSIGNMENT_GRADED':
        return 'award';
      default:
        return 'bell';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'MATERIAL_PUBLISHED':
        return '#4F46E5';
      case 'SESSION_REMINDER':
        return '#10B981';
      case 'ASSIGNMENT_SUBMITTED':
        return '#F59E0B';
      case 'ASSIGNMENT_GRADED':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const iconName = getIconForType(item.type);
    const iconColor = getColorForType(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
            <Icon name={iconName} size={20} color={iconColor} />
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
            {item.isRead && <Text style={styles.readTag}>Read</Text>}
          </View>
        </View>
        
        <Icon name="chevron-right" size={20} color="#444" />
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off" size={60} color="#444" />
      <Text style={styles.emptyText}>No Notifications</Text>
      <Text style={styles.emptySubText}>You're all caught up!</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      {unreadCount > 0 && (
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllRead}>Mark all as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#4F46E5" />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF', // Match Profile page background
  },
  loadingContainer: {
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1A1A1A', // Match Profile page text color
    fontSize: 20,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllRead: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Match Profile card background
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: '#F8F7FF',
    borderColor: '#4F46E5',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  body: {
    color: '#666',
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    color: '#999',
    fontSize: 11,
  },
  readTag: {
    color: '#10B981',
    fontSize: 10,
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default Notification;