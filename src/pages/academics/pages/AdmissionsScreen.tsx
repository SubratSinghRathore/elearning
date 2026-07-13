// pages/academics/AdmissionsScreen.tsx
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
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../api/axios';

interface Admission {
  id: string;
  programId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  personal: {
    fullName: string;
    fatherName: string;
    motherName: string;
    email: string;
    mobile: string;
    gender: string;
    dob: string;
    address: {
      line1: string;
      city: string;
      state: string;
      zipCode: string;
    } | string;
  };
  academics: Array<{
    qualification: string;
    institutionName: string;
    boardOrUniversity: string;
    passingYear: string;
    percentage: string;
  }>;
  documents: {
    photo: string;
    aadhaar: string;
    marksheet: string;
  };
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    admissions: Admission[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const AdmissionsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [totalAdmissions, setTotalAdmissions] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse>('/admission');
      
      if (response.data.success && response.data.data) {
        setAdmissions(response.data.data.admissions || []);
        setTotalAdmissions(response.data.data.pagination?.total || 0);
      } else {
        setAdmissions([]);
        setTotalAdmissions(0);
      }
    } catch (error: any) {
      console.error('Error fetching admissions:', error);
      if (error.response?.status === 404) {
        setAdmissions([]);
        setTotalAdmissions(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAdmissions();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdmissions();
    setRefreshing(false);
  };

  const getImageUrl = (path: string): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `https://storage.mssplonline.in/e-learning/${path}`;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#E8F5E9', text: '#43A047' };
      case 'PENDING':
        return { bg: '#FFF3E0', text: '#FB8C00' };
      case 'REJECTED':
        return { bg: '#FFEBEE', text: '#E53935' };
      default:
        return { bg: '#F5F5F5', text: '#666' };
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

  const handleAdmissionPress = (admission: Admission) => {
    setSelectedAdmission(admission);
    setDetailModalVisible(true);
  };

  const renderAdmissionItem = ({ item }: { item: Admission }) => {
    const statusColors = getStatusColor(item.status);
    const address = typeof item.personal.address === 'string' 
      ? item.personal.address 
      : `${item.personal.address.line1}, ${item.personal.address.city}, ${item.personal.address.state} - ${item.personal.address.zipCode}`;

    return (
      <TouchableOpacity 
        style={styles.admissionCard} 
        onPress={() => handleAdmissionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            {item.documents.photo ? (
              <Image
                source={{ uri: getImageUrl(item.documents.photo) }}
                style={styles.userAvatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {getInitials(item.personal.fullName)}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.personal.fullName}
              </Text>
              <Text style={styles.userEmail}>{item.personal.email}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="phone" size={14} color="#666" />
            <Text style={styles.infoText}>{item.personal.mobile}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={14} color="#666" />
            <Text style={styles.infoText}>Applied: {formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="user" size={14} color="#666" />
            <Text style={styles.infoText}>{item.personal.gender}</Text>
          </View>
        </View>

        {item.academics && item.academics.length > 0 && (
          <View style={styles.cardFooter}>
            <Text style={styles.qualificationText}>
              {item.academics[0].qualification} - {item.academics[0].institutionName}
            </Text>
            <Text style={styles.percentageText}>
              {item.academics[0].percentage}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Detail Modal
  const renderDetailModal = () => {
    if (!selectedAdmission) return null;

    const statusColors = getStatusColor(selectedAdmission.status);
    const address = typeof selectedAdmission.personal.address === 'string' 
      ? selectedAdmission.personal.address 
      : `${selectedAdmission.personal.address.line1}, ${selectedAdmission.personal.address.city}, ${selectedAdmission.personal.address.state} - ${selectedAdmission.personal.address.zipCode}`;

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
              <Text style={styles.modalTitle}>Admission Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Personal Information */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Personal Information</Text>
                
                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Full Name</Text>
                  <Text style={styles.modalValue}>{selectedAdmission.personal.fullName}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Father's Name</Text>
                  <Text style={styles.modalValue}>{selectedAdmission.personal.fatherName}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Mother's Name</Text>
                  <Text style={styles.modalValue}>{selectedAdmission.personal.motherName}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Email</Text>
                  <Text style={styles.modalValue}>{selectedAdmission.personal.email}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Mobile</Text>
                  <Text style={styles.modalValue}>{selectedAdmission.personal.mobile}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Gender</Text>
                  <Text style={styles.modalValue}>{selectedAdmission.personal.gender}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Date of Birth</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedAdmission.personal.dob)}</Text>
                </View>

                <View style={styles.modalInfoItem}>
                  <Text style={styles.modalLabel}>Address</Text>
                  <Text style={styles.modalValue}>{address}</Text>
                </View>
              </View>

              {/* Academic Information */}
              {selectedAdmission.academics && selectedAdmission.academics.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Academic Information</Text>
                  {selectedAdmission.academics.map((academic, index) => (
                    <View key={index} style={styles.academicCard}>
                      <Text style={styles.academicTitle}>{academic.qualification}</Text>
                      <View style={styles.academicDetails}>
                        <Text style={styles.academicText}>Institution: {academic.institutionName}</Text>
                        <Text style={styles.academicText}>Board: {academic.boardOrUniversity}</Text>
                        <Text style={styles.academicText}>Passing Year: {academic.passingYear}</Text>
                        <Text style={styles.academicText}>Percentage: {academic.percentage}%</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Documents */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Documents</Text>
                
                {selectedAdmission.documents.photo && (
                  <View style={styles.documentItem}>
                    <Icon name="image" size={20} color="#4F46E5" />
                    <Text style={styles.documentLabel}>Photo</Text>
                    <TouchableOpacity 
                      style={styles.documentLink}
                      onPress={() => {
                        // Open image viewer or download
                      }}
                    >
                      <Text style={styles.documentLinkText}>View</Text>
                      <Icon name="external-link" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
                )}

                {selectedAdmission.documents.aadhaar && (
                  <View style={styles.documentItem}>
                    <Icon name="file" size={20} color="#FB8C00" />
                    <Text style={styles.documentLabel}>Aadhaar</Text>
                    <TouchableOpacity 
                      style={styles.documentLink}
                      onPress={() => {
                        // Open document viewer
                      }}
                    >
                      <Text style={styles.documentLinkText}>View</Text>
                      <Icon name="external-link" size={16} color="#FB8C00" />
                    </TouchableOpacity>
                  </View>
                )}

                {selectedAdmission.documents.marksheet && (
                  <View style={styles.documentItem}>
                    <Icon name="file-text" size={20} color="#43A047" />
                    <Text style={styles.documentLabel}>Marksheet</Text>
                    <TouchableOpacity 
                      style={styles.documentLink}
                      onPress={() => {
                        // Open document viewer
                      }}
                    >
                      <Text style={styles.documentLinkText}>View</Text>
                      <Icon name="external-link" size={16} color="#43A047" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Status */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Application Status</Text>
                <View style={[styles.statusContainer, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusTextLarge, { color: statusColors.text }]}>
                    {selectedAdmission.status}
                  </Text>
                </View>
                <Text style={styles.applicationDate}>
                  Applied on: {formatDate(selectedAdmission.createdAt)}
                </Text>
                {selectedAdmission.updatedAt !== selectedAdmission.createdAt && (
                  <Text style={styles.applicationDate}>
                    Last updated: {formatDate(selectedAdmission.updatedAt)}
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredAdmissions = admissions.filter(admission =>
    admission.personal.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admission.personal.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admission.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading admissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Admissions</Text>
          <Text style={styles.headerSubtitle}>{totalAdmissions} applications total</Text>
        </View>
        <View style={styles.statusFilterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or status..."
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
        data={filteredAdmissions}
        renderItem={renderAdmissionItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="users" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Admissions Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 
                ? 'No applications match your search criteria' 
                : 'No applications available'}
            </Text>
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
  statusFilterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
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
  admissionCard: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  qualificationText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
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
  modalScrollView: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalSection: {
    marginTop: 20,
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
  academicCard: {
    backgroundColor: '#F5F6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  academicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  academicDetails: {
    marginLeft: 4,
  },
  academicText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 10,
  },
  documentLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentLinkText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginRight: 4,
  },
  statusContainer: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTextLarge: {
    fontSize: 18,
    fontWeight: '700',
  },
  applicationDate: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AdmissionsScreen;