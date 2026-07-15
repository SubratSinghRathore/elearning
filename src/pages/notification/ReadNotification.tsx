// screens/ReadNotification.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
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
  delivery?: {
    fcm: string;
    socket: string;
  };
  __v?: number;
  updatedAt?: string;
  failedAt?: string | null;
  data?: any;
}

interface MarkReadResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: NotificationItem;
}

const ReadNotification: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { notification: initialNotification } = route.params || {};
  const [notification, setNotification] = useState<NotificationItem | null>(initialNotification || null);
  const [loading, setLoading] = useState(false);


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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const getReadStatusColor = (isRead: boolean) => {
    return isRead ? '#10B981' : '#EF4444';
  };

  const getReadStatusText = (isRead: boolean) => {
    return isRead ? '✓ Read' : 'Unread';
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading notification...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!notification) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <View style={styles.emptyContainer}>
          <Icon name="bell-off" size={60} color="#444" />
          <Text style={styles.emptyText}>Notification not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const iconName = getIconForType(notification.type);
  const iconColor = getColorForType(notification.type);
  const isRead = notification.isRead;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButtonHeader}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={[styles.bigIconWrapper, { backgroundColor: `${iconColor}20` }]}>
            <Icon name={iconName} size={40} color={iconColor} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{notification.title}</Text>

        {/* Status Badges */}
        <View style={styles.badgesContainer}>
          <View style={[styles.badge, { backgroundColor: `${iconColor}20` }]}>
            <Icon name={iconName} size={14} color={iconColor} />
            <Text style={[styles.badgeText, { color: iconColor }]}>
              {getTypeLabel(notification.type)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${getReadStatusColor(isRead)}20` }]}>
            <Icon 
              name={isRead ? 'check-circle' : 'circle'} 
              size={14} 
              color={getReadStatusColor(isRead)} 
            />
            <Text style={[styles.badgeText, { color: getReadStatusColor(isRead) }]}>
              {getReadStatusText(isRead)}
            </Text>
          </View>
          {notification.status && (
            <View style={[styles.badge, { backgroundColor: '#10B98120' }]}>
              <Text style={[styles.badgeText, { color: '#10B981' }]}>
                {notification.status}
              </Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.bodyContainer}>
          <Text style={styles.bodyLabel}>Message</Text>
          <Text style={styles.bodyText}>{notification.body}</Text>
        </View>

        {/* Read Status Section */}
        <View style={styles.readStatusContainer}>
          <View style={styles.readStatusRow}>
            <Icon 
              name={isRead ? 'check-circle' : 'clock'} 
              size={20} 
              color={isRead ? '#10B981' : '#F59E0B'} 
            />
            <Text style={[styles.readStatusText, { color: isRead ? '#10B981' : '#F59E0B' }]}>
              {isRead ? 'This notification has been read' : 'Marking as read...'}
            </Text>
          </View>
          {isRead && notification.readAt && (
            <Text style={styles.readAtText}>
              Read on {formatDate(notification.readAt)}
            </Text>
          )}
        </View>

        {/* Time Ago */}
        <View style={styles.timeAgoContainer}>
          <Icon name="clock" size={16} color="#999" />
          <Text style={styles.timeAgoText}>{getTimeAgo(notification.createdAt)}</Text>
        </View>

      </ScrollView>
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
    backgroundColor: '#F5F6FF',
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
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButtonHeader: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  bigIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readStatusBadge: {
    position: 'absolute',
    bottom: -4,
    right: '32%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bodyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bodyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
  readStatusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  readStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  readAtText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginLeft: 30,
  },
  timeAgoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  timeAgoText: {
    fontSize: 14,
    color: '#999',
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alreadyReadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginBottom: 20,
  },
  alreadyReadText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReadNotification;