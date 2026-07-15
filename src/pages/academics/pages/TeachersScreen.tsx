// pages/academics/TeachersScreen.tsx
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
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../api/axios';

interface Teacher {
  id: string;
  email: string;
  phoneNumber: string;
  role: string;
  personalInfo: {
    name: string;
    dateOfBirth: string;
    gender: string;
    profileImage?: string;
    address: {
      line1: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  status: string;
  roleInfo: {
    qualification: string;
    specialization: string;
    experienceYears: number;
    joiningDate: string;
    bio: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    teachers: Teacher[];
    totalTeachers: number;
  };
}

const TeachersScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse>('/users/teachers');
      
      if (response.data.success && response.data.data) {
        setTeachers(response.data.data.teachers || []);
        setTotalTeachers(response.data.data.totalTeachers || 0);
      } else {
        setTeachers([]);
        setTotalTeachers(0);
      }
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      if (error.response?.status === 404) {
        setTeachers([]);
        setTotalTeachers(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTeachers();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeachers();
    setRefreshing(false);
  };

  const getProfileImageUrl = (path: string): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `https://storage.mssplonline.in/e-learning/${path}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const renderTeacherItem = ({ item }: { item: Teacher }) => (
    <View style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        <View style={styles.teacherLeft}>
          {item.personalInfo.profileImage ? (
            <Image
              source={{ uri: getProfileImageUrl(item.personalInfo.profileImage) }}
              style={styles.teacherAvatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {getInitials(item.personalInfo.name)}
              </Text>
            </View>
          )}
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherName} numberOfLines={1}>
              {item.personalInfo.name}
            </Text>
            <Text style={styles.teacherEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge, 
          item.status === 'ACTIVE' ? styles.activeBadge : 
          item.status === 'INACTIVE' ? styles.inactiveBadge : styles.suspendedBadge
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'ACTIVE' ? styles.activeText : 
            item.status === 'INACTIVE' ? styles.inactiveText : styles.suspendedText
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.teacherDetails}>
        <View style={styles.detailItem}>
          <Icon name="book" size={14} color="#666" />
          <Text style={styles.detailText}>{item.roleInfo.qualification}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="award" size={14} color="#666" />
          <Text style={styles.detailText}>{item.roleInfo.specialization}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="briefcase" size={14} color="#666" />
          <Text style={styles.detailText}>{item.roleInfo.experienceYears} years</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="calendar" size={14} color="#666" />
          <Text style={styles.detailText}>{formatDate(item.roleInfo.joiningDate)}</Text>
        </View>
      </View>

      {item.roleInfo.bio && (
        <Text style={styles.bioText} numberOfLines={2}>
          {item.roleInfo.bio}
        </Text>
      )}

      <View style={styles.teacherFooter}>
        <View style={styles.footerItem}>
          <Icon name="phone" size={14} color="#999" />
          <Text style={styles.footerText}>{item.phoneNumber}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Icon name="user" size={14} color="#999" />
          <Text style={styles.footerText}>{item.personalInfo.gender}</Text>
        </View>
      </View>
    </View>
  );

  const filteredTeachers = teachers.filter(teacher =>
    teacher.personalInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.roleInfo.qualification.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading teachers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Teachers</Text>
          <Text style={styles.headerSubtitle}>{totalTeachers} teachers total</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search teachers by name, email, or qualification..."
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
        data={filteredTeachers}
        renderItem={renderTeacherItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="user" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Teachers Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 
                ? 'No teachers match your search criteria' 
                : 'No teachers available'}
            </Text>
          </View>
        }
      />
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
  teacherCard: {
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
  teacherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teacherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  teacherEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  suspendedBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeText: {
    color: '#43A047',
  },
  inactiveText: {
    color: '#E53935',
  },
  suspendedText: {
    color: '#FB8C00',
  },
  teacherDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
  },
  bioText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  teacherFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  footerDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
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
});

export default TeachersScreen;