// pages/academics/SubjectsScreen.tsx
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

interface Subject {
  id: string;
  name: string;
  description: string;
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
    subjects: Subject[];
    totalSubjects: number;
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

const SubjectsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    programId: '',
    name: '',
    description: '',
    isActive: true,
  });
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse>('/subjects');
      
      if (response.data.success && response.data.data) {
        setSubjects(response.data.data.subjects || []);
        setTotalSubjects(response.data.data.totalSubjects || 0);
      } else {
        setSubjects([]);
        setTotalSubjects(0);
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      if (error.response?.status === 404) {
        setSubjects([]);
        setTotalSubjects(0);
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
      fetchSubjects();
      fetchPrograms();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
    setRefreshing(false);
  };

  const handleAddSubject = () => {
    setIsEditing(false);
    setSelectedSubject(null);
    setFormData({
      programId: '',
      name: '',
      description: '',
      isActive: true,
    });
    setModalVisible(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setIsEditing(true);
    setSelectedSubject(subject);
    setFormData({
      programId: subject.program.id,
      name: subject.name,
      description: subject.description || '',
      isActive: subject.isActive,
    });
    setModalVisible(true);
  };

  const handleDeleteSubject = (subject: Subject) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete "${subject.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(subject.id),
        },
      ]
    );
  };

  const confirmDelete = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.delete(`/subjects/${id}`);
      
      if (response.data.success) {
        Alert.alert('Success', 'Subject deleted successfully');
        await fetchSubjects();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete subject');
      }
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete subject');
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
    if (!formData.name || formData.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Subject name must be at least 2 characters');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        programId: formData.programId,
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        isActive: formData.isActive,
      };

      console.log('Submitting data:', submitData);

      let response;
      if (isEditing && selectedSubject) {
        response = await api.patch(`/subjects/${selectedSubject.id}`, submitData);
      } else {
        response = await api.post('/subjects', submitData);
      }

      console.log('Response:', response.data);

      if (response.data.success) {
        Alert.alert(
          'Success',
          isEditing ? 'Subject updated successfully!' : 'Subject created successfully!',
          [{ text: 'OK', onPress: () => {
            setModalVisible(false);
            fetchSubjects();
          }}]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to save subject');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 
        error.message || 
        'Failed to save subject'
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

  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <View style={styles.subjectCard}>
      <View style={styles.cardHeader}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{item.name}</Text>
          <Text style={styles.programName}>{item.program.name}</Text>
        </View>
        <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.inactiveText]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.detailItem}>
          <Icon name="clock" size={14} color="#666" />
          <Text style={styles.detailText}>Created: {formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={() => handleEditSubject(item)}
          >
            <Icon name="edit-2" size={16} color="#4F46E5" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDeleteSubject(item)}
          >
            <Icon name="trash-2" size={16} color="#E53935" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
              {isEditing ? 'Edit Subject' : 'Create New Subject'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="x" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>
              {isEditing ? 'Update subject details' : 'Set up a new subject with its details.'}
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

            {/* Subject Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Mathematics, Physics"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Brief description of the subject..."
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {formData.description.length} characters
              </Text>
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
                    {isEditing ? 'Update Subject' : 'Create Subject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Subjects</Text>
          <Text style={styles.headerSubtitle}>{totalSubjects} subjects total</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSubject}>
          <Icon name="plus" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Subject</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search subjects by name, program, or description..."
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
        data={filteredSubjects}
        renderItem={renderSubjectItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="book" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Subjects Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 
                ? 'No subjects match your search criteria' 
                : 'Get started by creating your first subject'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddSubject}>
              <Text style={styles.emptyButtonText}>Create Subject</Text>
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
  subjectCard: {
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
    marginBottom: 8,
  },
  subjectInfo: {
    flex: 1,
    marginRight: 8,
  },
  subjectName: {
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
  descriptionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 6,
  },
  editButton: {
    backgroundColor: '#E8EAF6',
  },
  editButtonText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    fontSize: 12,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
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

export default SubjectsScreen;