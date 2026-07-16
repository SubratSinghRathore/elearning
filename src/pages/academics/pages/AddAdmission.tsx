// pages/academics/AddAdmission.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../../../api/axios';

interface Program {
  id: string;
  name: string;
  fullName: string;
  programType: string;
}

interface Batch {
  id: string;
  name: string;
  program: {
    id: string;
    name: string;
  };
  academicSession: string;
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

interface BatchApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    batches: Batch[];
    totalBatches: number;
  };
}

const AddAdmission = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    personalInfo: {
      name: '',
      dateOfBirth: '',
      gender: 'MALE',
      profileImage: '',
      address: {
        line1: '',
        city: '',
        state: '',
        country: 'India',
        zipCode: '',
      },
    },
    roleInfo: {
      programId: '',
      rollNumber: '',
      batchId: '',
      admissionDate: '',
      guardianName: '',
      guardianPhoneNumber: '',
    },
  });

  const [profileImage, setProfileImage] = useState<any>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const genders = ['MALE', 'FEMALE', 'OTHER'];

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (formData.roleInfo.programId) {
      fetchBatches(formData.roleInfo.programId);
    }
  }, [formData.roleInfo.programId]);

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

  const fetchBatches = async (programId: string) => {
    try {
      setLoadingBatches(true);
      const response = await api.get<BatchApiResponse>('/batches');
      if (response.data.success && response.data.data) {
        const filteredBatches = response.data.data.batches.filter(
          (batch:any) => batch.program.id === programId
        );
        setBatches(filteredBatches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      Alert.alert('Error', 'Failed to load batches');
    } finally {
      setLoadingBatches(false);
    }
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
      (response:any) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
          Alert.alert('Error', 'Failed to select image');
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          setProfileImage(asset);
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
        setProfileImageUrl(response.data.data.key);
        // Fixed: Update entire formData properly
        setFormData((prevState) => ({
          ...prevState,
          personalInfo: {
            ...prevState.personalInfo,
            profileImage: response.data.data.key,
          },
        }));
        Alert.alert('Success', 'Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.email) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }
    if (!formData.phoneNumber) {
      Alert.alert('Validation Error', 'Phone number is required');
      return;
    }
    if (!formData.password) {
      Alert.alert('Validation Error', 'Password is required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return;
    }
    if (!formData.personalInfo.name) {
      Alert.alert('Validation Error', 'Student name is required');
      return;
    }
    if (!formData.personalInfo.dateOfBirth) {
      Alert.alert('Validation Error', 'Date of birth is required');
      return;
    }
    if (!formData.roleInfo.programId) {
      Alert.alert('Validation Error', 'Please select a program');
      return;
    }
    if (!formData.roleInfo.batchId) {
      Alert.alert('Validation Error', 'Please select a batch');
      return;
    }
    if (!formData.roleInfo.rollNumber) {
      Alert.alert('Validation Error', 'Roll number is required');
      return;
    }
    if (!formData.roleInfo.guardianName) {
      Alert.alert('Validation Error', 'Guardian name is required');
      return;
    }
    if (!formData.roleInfo.guardianPhoneNumber) {
      Alert.alert('Validation Error', 'Guardian phone number is required');
      return;
    }
    if (!formData.personalInfo.address.line1) {
      Alert.alert('Validation Error', 'Address line 1 is required');
      return;
    }
    if (!formData.personalInfo.address.city) {
      Alert.alert('Validation Error', 'City is required');
      return;
    }
    if (!formData.personalInfo.address.state) {
      Alert.alert('Validation Error', 'State is required');
      return;
    }
    if (!formData.personalInfo.address.zipCode) {
      Alert.alert('Validation Error', 'Zip code is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        personalInfo: {
          name: formData.personalInfo.name,
          dateOfBirth: formData.personalInfo.dateOfBirth,
          gender: formData.personalInfo.gender,
          profileImage: formData.personalInfo.profileImage || '',
          address: {
            line1: formData.personalInfo.address.line1,
            city: formData.personalInfo.address.city,
            state: formData.personalInfo.address.state,
            country: formData.personalInfo.address.country,
            zipCode: formData.personalInfo.address.zipCode,
          },
        },
        roleInfo: {
          programId: formData.roleInfo.programId,
          rollNumber: formData.roleInfo.rollNumber,
          batchId: formData.roleInfo.batchId,
          admissionDate: formData.roleInfo.admissionDate || new Date().toISOString().split('T')[0],
          guardianName: formData.roleInfo.guardianName,
          guardianPhoneNumber: formData.roleInfo.guardianPhoneNumber,
        },
      };

      console.log('Submitting admission with payload:', JSON.stringify(payload, null, 2));

      const response = await api.post('/users/students', payload);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Student admitted successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to admit student');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to admit student');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `https://storage.mssplonline.in/e-learning/${path}`;
  };

  // Fixed: Helper function to update form data safely
  const updatePersonalInfo = (field: string, value: any) => {
    setFormData((prevState) => ({
      ...prevState,
      personalInfo: {
        ...prevState.personalInfo,
        [field]: value,
      },
    }));
  };

  const updateAddress = (field: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      personalInfo: {
        ...prevState.personalInfo,
        address: {
          ...prevState.personalInfo.address,
          [field]: value,
        },
      },
    }));
  };

  const updateRoleInfo = (field: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      roleInfo: {
        ...prevState.roleInfo,
        [field]: value,
      },
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Admission</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Information</Text>
        <Text style={styles.cardSubtitle}>Fill in the details to admit a new student.</Text>

        {/* Profile Image */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Profile Image</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleImagePick}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : profileImageUrl ? (
              <View style={styles.thumbnailPreview}>
                <Image
                  source={{ uri: getImageUrl(profileImageUrl) }}
                  style={styles.thumbnailImage}
                />
                <Text style={styles.uploadText}>Change Image</Text>
              </View>
            ) : profileImage ? (
              <View style={styles.thumbnailPreview}>
                <Image
                  source={{ uri: profileImage.uri }}
                  style={styles.thumbnailImage}
                />
                <Text style={styles.uploadText}>Change Image</Text>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Icon name="user" size={40} color="#999" />
                <Text style={styles.uploadText}>Upload Profile Image</Text>
                <Text style={styles.uploadSubtext}>PNG, JPG up to 2MB</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={formData.personalInfo.name}
            onChangeText={(text) => updatePersonalInfo('name', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            value={formData.email}
            onChangeText={(text) => setFormData((prevState) => ({ ...prevState, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number (e.g., +911234567890)"
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData((prevState) => ({ ...prevState, phoneNumber: text }))}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password (min 8 characters)"
            value={formData.password}
            onChangeText={(text) => setFormData((prevState) => ({ ...prevState, password: text }))}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData((prevState) => ({ ...prevState, confirmPassword: text }))}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g., 2000-01-01)"
            value={formData.personalInfo.dateOfBirth}
            onChangeText={(text) => updatePersonalInfo('dateOfBirth', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.personalInfo.gender}
              onValueChange={(value) => updatePersonalInfo('gender', value)}
              style={styles.picker}
            >
              {genders.map((gender) => (
                <Picker.Item key={gender} label={gender} value={gender} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Address */}
        <Text style={styles.sectionTitle}>Address</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address Line 1 *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter address line 1"
            value={formData.personalInfo.address.line1}
            onChangeText={(text) => updateAddress('line1', text)}
          />
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroupHalf}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              value={formData.personalInfo.address.city}
              onChangeText={(text) => updateAddress('city', text)}
            />
          </View>
          <View style={styles.formGroupHalf}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              placeholder="State"
              value={formData.personalInfo.address.state}
              onChangeText={(text) => updateAddress('state', text)}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroupHalf}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.personalInfo.address.country}
              editable={false}
            />
          </View>
          <View style={styles.formGroupHalf}>
            <Text style={styles.label}>Zip Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="Zip Code"
              value={formData.personalInfo.address.zipCode}
              onChangeText={(text) => updateAddress('zipCode', text)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Academic Information */}
        <Text style={styles.sectionTitle}>Academic Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Program *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.roleInfo.programId}
              onValueChange={(value) => {
                updateRoleInfo('programId', value);
                updateRoleInfo('batchId', '');
              }}
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
          {loadingPrograms && <ActivityIndicator size="small" color="#4F46E5" />}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Batch *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.roleInfo.batchId}
              onValueChange={(value) => updateRoleInfo('batchId', value)}
              style={styles.picker}
              enabled={!loadingBatches && !!formData.roleInfo.programId}
            >
              <Picker.Item
                label={!formData.roleInfo.programId ? 'Select a program first' : 'Select a batch'}
                value=""
              />
              {batches.map((batch) => (
                <Picker.Item
                  key={batch.id}
                  label={`${batch.name} (${batch.academicSession})`}
                  value={batch.id}
                />
              ))}
            </Picker>
          </View>
          {loadingBatches && <ActivityIndicator size="small" color="#4F46E5" />}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Roll Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter roll number"
            value={formData.roleInfo.rollNumber}
            onChangeText={(text) => updateRoleInfo('rollNumber', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Admission Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g., 2026-07-26)"
            value={formData.roleInfo.admissionDate}
            onChangeText={(text) => updateRoleInfo('admissionDate', text)}
          />
        </View>

        {/* Guardian Information */}
        <Text style={styles.sectionTitle}>Guardian Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Guardian Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter guardian name"
            value={formData.roleInfo.guardianName}
            onChangeText={(text) => updateRoleInfo('guardianName', text)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Guardian Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter guardian phone number"
            value={formData.roleInfo.guardianPhoneNumber}
            onChangeText={(text) => updateRoleInfo('guardianPhoneNumber', text)}
            keyboardType="phone-pad"
          />
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
            <Text style={styles.submitButtonText}>Admit Student</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginVertical: 12,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#E8EAF6',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#999',
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
    minHeight: 120,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
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

export default AddAdmission;