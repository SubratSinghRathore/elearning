// pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

// Student role info
interface StudentRoleInfo {
  rollNumber: string;
  batchId: string;
  admissionDate: string;
  guardianName: string;
  guardianPhoneNumber: string;
}

// Teacher role info
interface TeacherRoleInfo {
  qualification: string;
  specialization: string;
  experienceYears: number;
  joiningDate: string;
  bio: string;
}

// Union type for roleInfo
type RoleInfo = StudentRoleInfo | TeacherRoleInfo;

interface UserData {
  id: string;
  email: string;
  phoneNumber: string;
  role: 'STUDENT' | 'TEACHER';
  status: string;
  personalInfo: {
    name: string;
    dateOfBirth: string;
    gender: string;
    profileImage: string;
    address: {
      line1: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  roleInfo: RoleInfo;
  createdAt: string;
  updatedAt: string;
}

// Type guard functions
const isStudent = (userData: UserData): userData is UserData & { role: 'STUDENT'; roleInfo: StudentRoleInfo } => {
  return userData.role === 'STUDENT';
};

const isTeacher = (userData: UserData): userData is UserData & { role: 'TEACHER'; roleInfo: TeacherRoleInfo } => {
  return userData.role === 'TEACHER';
};

const Profile = () => {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');

      if (response.data.success) {
        setUserData(response.data.data);
        setEditName(response.data.data.personalInfo.name);
        setEditPhone(response.data.data.phoneNumber);
        const address = `${response.data.data.personalInfo.address.line1}, ${response.data.data.personalInfo.address.city}, ${response.data.data.personalInfo.address.state} - ${response.data.data.personalInfo.address.zipCode}`;
        setEditAddress(address);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    if (userData) {
      setEditName(userData.personalInfo.name);
      setEditPhone(userData.phoneNumber);
      const address = `${userData.personalInfo.address.line1}, ${userData.personalInfo.address.city}, ${userData.personalInfo.address.state} - ${userData.personalInfo.address.zipCode}`;
      setEditAddress(address);
      setModalVisible(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.put('/auth/profile', {
        name: editName,
        phoneNumber: editPhone,
        address: editAddress,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setModalVisible(false);
        fetchUserProfile();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileImageUrl = (path: string): string | undefined => {
    if (!path) return undefined;
    return `https://storage.mssplonline.in/e-learning/${path}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {/* <TouchableOpacity>
          <Icon name="more-horizontal" size={24} color="#1A1A1A" />
        </TouchableOpacity> */}
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileImageContainer}>
          {userData?.personalInfo.profileImage ? (
            <Image
              source={{ uri: getProfileImageUrl(userData.personalInfo.profileImage) }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>
                {getInitials(userData?.personalInfo.name || 'User')}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.editIcon} onPress={handleEditProfile}>
            <Icon name="edit-2" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.studentName}>{userData?.personalInfo.name || 'Student'}</Text>
        <Text style={styles.studentEmail}>{userData?.email || 'email@example.com'}</Text>
        <Text style={styles.studentId}>ID: {userData?.id || 'N/A'}</Text>

        {/* Stats Container - Role based */}
        <View style={styles.statsContainer}>
          {/* Show Roll Number only for STUDENT */}
          {userData?.role === 'STUDENT' && isStudent(userData) && (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {userData.roleInfo.rollNumber || 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Roll Number</Text>
              </View>
              <View style={styles.statDivider} />
            </>
          )}
          
          {/* Show Qualification for TEACHER */}
          {userData?.role === 'TEACHER' && isTeacher(userData) && (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {userData.roleInfo.qualification || 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Qualification</Text>
              </View>
              <View style={styles.statDivider} />
            </>
          )}
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.statusBadge]}>
              {userData?.status || 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        <View style={styles.badgeContainer}>
          <Text style={styles.badge}>{userData?.role || 'STUDENT'}</Text>
        </View>
      </View>

      {/* Personal Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>

        <View style={styles.infoItem}>
          <View style={styles.infoLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="phone" size={20} color="#43A047" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{userData?.phoneNumber || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="calendar" size={20} color="#FB8C00" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>
                {userData?.personalInfo.dateOfBirth
                  ? new Date(userData.personalInfo.dateOfBirth).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Icon name="users" size={20} color="#8E24AA" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{userData?.personalInfo.gender || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8EAF6' }]}>
              <Icon name="map-pin" size={20} color="#4F46E5" />
            </View>
            <View style={styles.addressContainer}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {userData?.personalInfo.address.line1 || 'N/A'},{'\n'}
                {userData?.personalInfo.address.city || 'N/A'}, {'\n'}
                {userData?.personalInfo.address.state || 'N/A'} - {userData?.personalInfo.address.zipCode || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Guardian Information - Only for STUDENT role */}
      {userData && isStudent(userData) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GUARDIAN INFORMATION</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Icon name="user" size={20} color="#1E88E5" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Guardian Name</Text>
                <Text style={styles.infoValue}>{userData.roleInfo.guardianName || 'N/A'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="phone" size={20} color="#43A047" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Guardian Phone</Text>
                <Text style={styles.infoValue}>{userData.roleInfo.guardianPhoneNumber || 'N/A'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Icon name="calendar" size={20} color="#FB8C00" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Admission Date</Text>
                <Text style={styles.infoValue}>
                  {userData.roleInfo.admissionDate
                    ? new Date(userData.roleInfo.admissionDate).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Teacher Information - Only for TEACHER role */}
      {userData && isTeacher(userData) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEACHER INFORMATION</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="graduation-cap" size={20} color="#43A047" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Qualification</Text>
                <Text style={styles.infoValue}>{userData.roleInfo.qualification || 'N/A'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Icon name="book" size={20} color="#1E88E5" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Specialization</Text>
                <Text style={styles.infoValue}>{userData.roleInfo.specialization || 'N/A'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Icon name="briefcase" size={20} color="#FB8C00" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>{userData.roleInfo.experienceYears || 0} Years</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Icon name="calendar" size={20} color="#8E24AA" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Joining Date</Text>
                <Text style={styles.infoValue}>
                  {userData.roleInfo.joiningDate
                    ? new Date(userData.roleInfo.joiningDate).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {userData.roleInfo.bio && (
            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FCE4EC' }]}>
                  <Icon name="info" size={20} color="#E91E63" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.infoValue}>{userData.roleInfo.bio}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8EAF6' }]}>
              <Icon name="user" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Security', 'Navigate to security settings')}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#FCE4EC' }]}>
              <Icon name="shield" size={20} color="#E53935" />
            </View>
            <Text style={styles.menuText}>Security</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Preferences', 'Navigate to preferences screen')}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="settings" size={20} color="#43A047" />
            </View>
            <Text style={styles.menuText}>Preferences</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="bell" size={20} color="#FB8C00" />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#D6D6D6', true: '#4F46E5' }}
            thumbColor={notifications ? '#FFF' : '#FFF'}
          />
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Icon name="moon" size={20} color="#8E24AA" />
            </View>
            <Text style={styles.menuText}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#D6D6D6', true: '#4F46E5' }}
            thumbColor={darkMode ? '#FFF' : '#FFF'}
          />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <View style={styles.menuLeft}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
            <Icon name="log-out" size={20} color="#E53935" />
          </View>
          <Text style={[styles.menuText, styles.logoutText]}>Log out</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#E53935" />
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.versionText}>Version 1.0.0</Text>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={userData?.email || ''}
                  editable={false}
                  placeholder="Email"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4F46E5',
  },

  initialsContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4F46E5',
  },

  initialsText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },

  studentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  studentEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },

  studentId: {
    fontSize: 12,
    color: '#BBB',
    marginBottom: 16,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  statusBadge: {
    color: '#43A047',
    fontSize: 12,
  },

  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },

  badgeContainer: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badge: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  infoLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  addressContainer: {
    flex: 1,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  menuText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  logoutText: {
    color: '#E53935',
  },

  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 30,
    marginTop: 10,
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
    padding: 20,
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  modalBody: {
    marginBottom: 20,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  inputDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },

  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;