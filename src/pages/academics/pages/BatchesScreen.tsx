// pages/academics/BatchesScreen.tsx
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
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import api from '../../../api/axios';

interface Batch {
  id: string;
  academicSession: string;
  name: string;
  maxStudents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  program: {
    id: string;
    name: string;
  };
}

interface Program {
  id: string;
  name: string;
  fullName: string;
  programType: string;
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    batches: Batch[];
    totalBatches: number;
  };
}

interface ProgramApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    programs: Program[];
    totalPrograms: number;
  };
}

const BatchesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    programId: '',
    academicSession: '',
    name: '',
    maxStudents: '',
    isActive: true,
  });
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const academicSessions = ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029'];

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse>('/batches');
      
      if (response.data.success && response.data.data) {
        setBatches(response.data.data.batches || []);
        setTotalBatches(response.data.data.totalBatches || 0);
      } else {
        setBatches([]);
        setTotalBatches(0);
      }
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      if (error.response?.status === 404) {
        setBatches([]);
        setTotalBatches(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const response = await api.get<ProgramApiResponse>('/programs');
      
      if (response.data.success && response.data.data) {
        setPrograms(response.data.data.programs || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoadingPrograms(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBatches();
      fetchPrograms();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBatches();
    setRefreshing(false);
  };

  const handleAddBatch = () => {
    setIsEditing(false);
    setSelectedBatch(null);
    setFormData({
      programId: '',
      academicSession: '',
      name: '',
      maxStudents: '',
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setIsEditing(true);
    setSelectedBatch(batch);
    setFormData({
      programId: batch.program.id,
      academicSession: batch.academicSession,
      name: batch.name,
      maxStudents: batch.maxStudents.toString(),
      isActive: batch.isActive,
    });
    setModalVisible(true);
  };

  const handleDeleteBatch = (batch: Batch) => {
    Alert.alert(
      'Delete Batch',
      `Are you sure you want to delete "${batch.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(batch.id),
        },
      ]
    );
  };

  const confirmDelete = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.delete(`/batches/${id}`);
      
      if (response.data.success) {
        Alert.alert('Success', 'Batch deleted successfully');
        await fetchBatches();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete batch');
      }
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete batch');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.programId) {
      Alert.alert('Validation Error', 'Please select a program');
      return;
    }
    if (!formData.academicSession) {
      Alert.alert('Validation Error', 'Please select an academic session');
      return;
    }
    if (!formData.name || formData.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Batch name must be at least 2 characters');
      return;
    }
    if (!formData.maxStudents || parseInt(formData.maxStudents) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid max students count');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        programId: formData.programId,
        academicSession: formData.academicSession,
        name: formData.name.trim(),
        maxStudents: parseInt(formData.maxStudents),
        isActive: formData.isActive,
      };

      console.log('Submitting data:', submitData); // Debug log

      let response;
      if (isEditing && selectedBatch) {
        response = await api.put(`/batches/${selectedBatch.id}`, submitData);
      } else {
        // POST request to create new batch
        response = await api.post('/batches', submitData);
      }

      console.log('Response:', response.data); // Debug log

      if (response.data.success) {
        Alert.alert(
          'Success',
          isEditing ? 'Batch updated successfully!' : 'Batch created successfully!',
          [{ text: 'OK', onPress: () => {
            setModalVisible(false);
            fetchBatches();
          }}]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to save batch');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 
        error.message || 
        'Failed to save batch'
      );
    } finally {
      setSubmitting(false);
    }
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

  const renderBatchItem = ({ item }: { item: Batch }) => (
    <View style={styles.batchCard}>
      <View style={styles.cardHeader}>
        <View style={styles.batchInfo}>
          <Text style={styles.batchName}>{item.name}</Text>
          <Text style={styles.programName}>{item.program.name}</Text>
        </View>
        <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.inactiveText]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailItem}>
          <Icon name="calendar" size={14} color="#666" />
          <Text style={styles.detailText}>{item.academicSession}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="users" size={14} color="#666" />
          <Text style={styles.detailText}>Max: {item.maxStudents} students</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="clock" size={14} color="#666" />
          <Text style={styles.detailText}>Created: {formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => handleEditBatch(item)}
        >
          <Icon name="edit-2" size={16} color="#4F46E5" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDeleteBatch(item)}
        >
          <Icon name="trash-2" size={16} color="#E53935" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFormModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Batch' : 'Create New Batch'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="x" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>
              {isEditing ? 'Update batch details' : 'Set up a new batch with its details.'}
            </Text>

            {/* Program Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Program *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.programId}
                  onValueChange={(value) => setFormData({ ...formData, programId: value })}
                  style={styles.picker}
                  enabled={!loadingPrograms}
                >
                  <Picker.Item label="Select a program" value="" />
                  {programs.map((program) => (
                    <Picker.Item 
                      key={program.id} 
                      label={`${program.name} - ${program.fullName || program.name}`} 
                      value={program.id} 
                    />
                  ))}
                </Picker>
              </View>
              {loadingPrograms && (
                <ActivityIndicator size="small" color="#4F46E5" style={styles.loadingIndicator} />
              )}
            </View>

            {/* Academic Session */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Academic Session *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.academicSession}
                  onValueChange={(value) => setFormData({ ...formData, academicSession: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select session" value="" />
                  {academicSessions.map((session) => (
                    <Picker.Item key={session} label={session} value={session} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Batch Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Batch Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Batch A, Morning Batch"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Max Students */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Max Students</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 60"
                value={formData.maxStudents}
                onChangeText={(text) => setFormData({ ...formData, maxStudents: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Active Toggle */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <TouchableOpacity
                style={[styles.toggleButton, formData.isActive && styles.toggleActive]}
                onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
              >
                <Text style={styles.toggleText}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createModalButton, submitting && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.createModalButtonText}>
                    {isEditing ? 'Update Batch' : 'Create Batch'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.academicSession.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading batches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Batches</Text>
          <Text style={styles.headerSubtitle}>{totalBatches} batches total</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddBatch}>
          <Icon name="plus" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Batch</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search batches by name, program, or session..."
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
        data={filteredBatches}
        renderItem={renderBatchItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="users" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Batches Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 
                ? 'No batches match your search criteria' 
                : 'Get started by creating your first batch'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddBatch}>
              <Text style={styles.emptyButtonText}>Create Batch</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Form Modal */}
      {renderFormModal()}
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
  batchCard: {
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  batchInfo: {
    flex: 1,
    marginRight: 8,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  programName: {
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
  cardBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#E8EAF6',
  },
  editButtonText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#E53935',
    fontWeight: '500',
    marginLeft: 4,
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
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1A1A1A',
  },
  loadingIndicator: {
    marginTop: 8,
  },
  toggleButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createModalButton: {
    backgroundColor: '#4F46E5',
    marginLeft: 8,
  },
  createModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default BatchesScreen;