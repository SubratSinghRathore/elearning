// pages/academics/ProgramsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../../api/axios';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';

interface Program {
  id: string;
  name: string;
  fullName: string;
  programType: string;
  description: string;
  durationMonths: number;
  mode: string;
  feeAmount: number;
  feeType: string;
  thumbnail: string;
  benefits: string[];
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    programs: Program[];
    totalPrograms: number;
  };
}

const ProgramsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    programType: '',
    description: '',
    durationMonths: '',
    mode: '',
    feeAmount: '',
    feeType: '',
    benefits: [] as string[],
    featured: false,
    isActive: true,
  });
  const [thumbnail, setThumbnail] = useState<any>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const programTypes = ['SCHOOL', 'UNDERGRADUATE', 'POSTGRADUATE', 'DIPLOMA', 'CERTIFICATE', 'OTHER'];
  const modes = ['Online', 'Offline', 'Hybrid'];
  const feeTypes = ['One Time', 'Monthly', 'Quarterly', 'Semester', 'Yearly'];

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse>('/programs');
      
      if (response.data.success && response.data.data) {
        setPrograms(response.data.data.programs || []);
        setTotalPrograms(response.data.data.totalPrograms || 0);
      } else {
        setPrograms([]);
        setTotalPrograms(0);
      }
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      if (error.response?.status === 404) {
        setPrograms([]);
        setTotalPrograms(0);
      } else {
        Alert.alert('Error', 'Failed to load programs');
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPrograms();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrograms();
    setRefreshing(false);
  };

  const handleProgramPress = (program: Program) => {
    setSelectedProgram(program);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    if (selectedProgram) {
      setIsEditing(true);
      setFormData({
        name: selectedProgram.name || '',
        fullName: selectedProgram.fullName || '',
        programType: selectedProgram.programType || '',
        description: selectedProgram.description || '',
        durationMonths: selectedProgram.durationMonths?.toString() || '',
        mode: selectedProgram.mode || '',
        feeAmount: selectedProgram.feeAmount?.toString() || '',
        feeType: selectedProgram.feeType || '',
        benefits: selectedProgram.benefits || [],
        featured: selectedProgram.featured || false,
        isActive: selectedProgram.isActive !== undefined ? selectedProgram.isActive : true,
      });
      setThumbnailUrl(selectedProgram.thumbnail || '');
      setModalVisible(true);
    }
    setMenuVisible(false);
  };

  const handleDelete = () => {
    if (selectedProgram) {
      Alert.alert(
        'Delete Program',
        `Are you sure you want to delete "${selectedProgram.fullName || selectedProgram.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => confirmDelete(selectedProgram.id),
          },
        ]
      );
    }
    setMenuVisible(false);
  };

  const confirmDelete = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.delete(`/programs/${id}`);
      
      if (response.data.success) {
        Alert.alert('Success', 'Program deleted successfully');
        await fetchPrograms();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete program');
      }
    } catch (error: any) {
      console.error('Error deleting program:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete program');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      fullName: '',
      programType: '',
      description: '',
      durationMonths: '',
      mode: '',
      feeAmount: '',
      feeType: '',
      benefits: [],
      featured: false,
      isActive: true,
    });
    setThumbnail(null);
    setThumbnailUrl('');
    setModalVisible(true);
  };

  const handleImagePick = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        selectionLimit: 1,
      },
      (response: any) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
          Alert.alert('Error', 'Failed to select image');
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          setThumbnail(asset);
          uploadImage(asset);
        }
      }
    );
  };

  const uploadImage = async (asset: any) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      });

      const response = await api.post('/uploads/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.data) {
        setThumbnailUrl(response.data.data.key);
        Alert.alert('Success', 'Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddBenefit = () => {
    Alert.prompt(
      'Add Benefit',
      'Enter benefit description:',
      (text) => {
        if (text && text.trim()) {
          setFormData({
            ...formData,
            benefits: [...formData.benefits, text.trim()],
          });
        }
      },
      'plain-text'
    );
  };

  const handleRemoveBenefit = (index: number) => {
    const newBenefits = [...formData.benefits];
    newBenefits.splice(index, 1);
    setFormData({ ...formData, benefits: newBenefits });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || formData.name.length < 2) {
      Alert.alert('Validation Error', 'Program name must be at least 2 characters');
      return;
    }
    if (!formData.fullName) {
      Alert.alert('Validation Error', 'Full program name is required');
      return;
    }
    if (!formData.programType) {
      Alert.alert('Validation Error', 'Program type is required');
      return;
    }
    if (!formData.description || formData.description.length < 20) {
      Alert.alert('Validation Error', 'Description must be at least 20 characters');
      return;
    }
    if (!formData.durationMonths || parseInt(formData.durationMonths) <= 0) {
      Alert.alert('Validation Error', 'Valid duration is required');
      return;
    }
    if (!formData.mode) {
      Alert.alert('Validation Error', 'Mode is required');
      return;
    }
    if (!formData.feeAmount || parseFloat(formData.feeAmount) <= 0) {
      Alert.alert('Validation Error', 'Valid fee amount is required');
      return;
    }
    if (!formData.feeType) {
      Alert.alert('Validation Error', 'Fee type is required');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        durationMonths: parseInt(formData.durationMonths),
        feeAmount: parseFloat(formData.feeAmount),
        thumbnail: thumbnailUrl,
      };

      let response;
      if (isEditing && selectedProgram) {
        // Update
        response = await api.patch(`/programs/${selectedProgram.id}`, submitData);
      } else {
        // Create
        response = await api.post('/programs', submitData);
      }

      if (response.data.success) {
        Alert.alert(
          'Success',
          isEditing ? 'Program updated successfully!' : 'Program created successfully!',
          [{ text: 'OK', onPress: () => {
            setModalVisible(false);
            fetchPrograms();
          }}]
        );
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save program');
    } finally {
      setLoading(false);
    }
  };

  const getProfileImageUrl = (path: string): string | undefined => {
    if (!path) return undefined;
    return `https://storage.mssplonline.in/e-learning/${path}`;
  };

  const renderProgramItem = ({ item }: { item: Program }) => (
    <TouchableOpacity 
      style={styles.programCard} 
      onPress={() => handleProgramPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.programHeader}>
        <View style={styles.programLeft}>
          {item.thumbnail ? (
            <Image
              source={{ uri: getProfileImageUrl(item.thumbnail) }}
              style={styles.programThumbnail}
            />
          ) : (
            <View style={styles.programIconPlaceholder}>
              <Icon name="grid" size={24} color="#4F46E5" />
            </View>
          )}
          <View>
            <Text style={styles.programName} numberOfLines={1}>
              {item.fullName || item.name}
            </Text>
            <Text style={styles.programShortName}>{item.name}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.inactiveText]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={styles.programDetails}>
        <View style={styles.detailItem}>
          <Icon name="tag" size={14} color="#666" />
          <Text style={styles.detailText}>{item.programType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="clock" size={14} color="#666" />
          <Text style={styles.detailText}>{item.durationMonths}m</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="monitor" size={14} color="#666" />
          <Text style={styles.detailText}>{item.mode}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="dollar-sign" size={14} color="#666" />
          <Text style={styles.detailText}>₹{item.feeAmount}</Text>
        </View>
      </View>

      {item.featured && (
        <View style={styles.featuredBadge}>
          <Icon name="star" size={12} color="#FFF" />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Menu Modal
  const renderMenuModal = () => (
    <Modal
      transparent={true}
      visible={menuVisible}
      onRequestClose={() => setMenuVisible(false)}
    >
      <TouchableOpacity 
        style={styles.menuOverlay} 
        activeOpacity={1}
        onPress={() => setMenuVisible(false)}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>
              {selectedProgram?.fullName || selectedProgram?.name}
            </Text>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Icon name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#E8EAF6' }]}>
              <Icon name="edit-2" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.menuItemText}>Edit Program</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Icon name="trash-2" size={20} color="#E53935" />
            </View>
            <Text style={[styles.menuItemText, { color: '#E53935' }]}>Delete Program</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
          
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Create/Edit Modal
  const renderFormModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.formModalOverlay}>
        <View style={styles.formModalContent}>
          <View style={styles.formModalHeader}>
            <Text style={styles.formModalTitle}>
              {isEditing ? 'Edit Program' : 'Add New Program'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="x" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
            {/* Program Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Program Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. B.Sc., M.Sc., MBA"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Full Program Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Program Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Bachelor of Science"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              />
            </View>

            {/* Program Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Program Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.programType}
                  onValueChange={(value) => setFormData({ ...formData, programType: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select program type" value="" />
                  {programTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Thumbnail */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Thumbnail</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleImagePick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : thumbnailUrl ? (
                  <View style={styles.thumbnailPreview}>
                    <Image
                      source={{ uri: getProfileImageUrl(thumbnailUrl) }}
                      style={styles.thumbnailImage}
                    />
                    <Text style={styles.uploadText}>Change Image</Text>
                  </View>
                ) : thumbnail ? (
                  <View style={styles.thumbnailPreview}>
                    <Image
                      source={{ uri: thumbnail.uri }}
                      style={styles.thumbnailImage}
                    />
                    <Text style={styles.uploadText}>Change Image</Text>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Icon name="image" size={40} color="#999" />
                    <Text style={styles.uploadText}>Upload avatar</Text>
                    <Text style={styles.uploadSubtext}>PNG, JPG up to 2MB</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Brief description (min 20 characters)"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {formData.description.length}/20 characters minimum
              </Text>
            </View>

            {/* Duration */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duration (months) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 48"
                value={formData.durationMonths}
                onChangeText={(text) => setFormData({ ...formData, durationMonths: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Mode */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mode *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.mode}
                  onValueChange={(value) => setFormData({ ...formData, mode: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select mode" value="" />
                  {modes.map((mode) => (
                    <Picker.Item key={mode} label={mode} value={mode} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Fee Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fee Amount *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 50000"
                value={formData.feeAmount}
                onChangeText={(text) => setFormData({ ...formData, feeAmount: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Fee Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fee Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.feeType}
                  onValueChange={(value) => setFormData({ ...formData, feeType: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select fee type" value="" />
                  {feeTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Benefits */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Benefits</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddBenefit}>
                <Icon name="plus" size={18} color="#FFF" />
                <Text style={styles.addButtonText}>Add Benefit</Text>
              </TouchableOpacity>
              {formData.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={styles.benefitText}>{benefit}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveBenefit(index)}
                    style={styles.removeButton}
                  >
                    <Icon name="x" size={18} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Featured and Active Toggles */}
            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Featured</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, formData.featured && styles.toggleActive]}
                  onPress={() => setFormData({ ...formData, featured: !formData.featured })}
                >
                  <Text style={styles.toggleText}>
                    {formData.featured ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Active</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, formData.isActive && styles.toggleActive]}
                  onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
                >
                  <Text style={styles.toggleText}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Program' : 'Create Program'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading programs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>Programs</Text>
          <Text style={styles.headerSubtitle}>{totalPrograms} programs total</Text>
        </View>
        <TouchableOpacity style={styles.addProgramButton} onPress={handleAddProgram}>
          <Icon name="plus" size={20} color="#FFF" />
          <Text style={styles.addProgramButtonText}>Add Program</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={programs}
        renderItem={renderProgramItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="grid" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Programs Found</Text>
            <Text style={styles.emptyText}>Get started by adding your first program</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddProgram}>
              <Text style={styles.emptyButtonText}>Add Program</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modals */}
      {renderMenuModal()}
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
  addProgramButton: {
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
  addProgramButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
  },
  programCard: {
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
    position: 'relative',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  programLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  programThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  programIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  programShortName: {
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
  programDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FB8C00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
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
  // Menu Modal Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  // Form Modal Styles
  formModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  formModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  formModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  formScrollView: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  uploadButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  thumbnailPreview: {
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  toggleButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ProgramsScreen;