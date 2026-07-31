// Complete updated MaterialsScreen.tsx with fixed pre-filling
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Alert,
    Modal,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import api from '../../../api/axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigator/Stack';
import { bucketUrl } from '../../../utils/url';
import { Picker } from '@react-native-picker/picker';

interface MaterialFile {
    originalFileName: string;
    mimeType: string;
    size: number;
}

interface MaterialMetadata {
    durationMs?: number;
    width?: number;
    height?: number;
    fps?: number;
    videoCodec?: string;
    audioCodec?: string;
    bitrate?: number;
    sizeBytes?: number;
    format?: string;
    hasAudio?: boolean;
}

interface Material {
    id: string;
    title: string;
    description: string | null;
    materialType: string;
    objectKey: string;
    file: MaterialFile;
    status: string;
    createdAt: string;
    updatedAt: string;
    metadata?: MaterialMetadata;
    subject: {
        id: string;
        name: string;
    } | null;
    createdBy: {
        id: string;
        name: string;
    };
}

interface Program {
    id: string;
    name: string;
    fullName: string;
}

interface Subject {
    id: string;
    name: string;
    program: {
        id: string;
    };
}

interface ApiResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        materials: Material[];
        pagination: {
            cursor: string;
            hasMore: boolean;
        };
    };
}

interface ProgramApiResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        programs: Program[];
    };
}

interface SubjectApiResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        subjects: Subject[];
    };
}

type navigationp = NativeStackNavigationProp<RootStackParamList>;

const PublishContent = () => {
    const navigation = useNavigation<navigationp>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states for editing
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        programId: '',
        subjectId: '',
    });

    const [programs, setPrograms] = useState<Program[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse>(
                `/materials?status=DRAFT&page=1&limit=20`
            );

            if (response.data.success && response.data.data) {
                setMaterials(response.data.data.materials || []);
            } else {
                setMaterials([]);
            }
        } catch (error: any) {
            console.error('Error fetching materials:', error);
            if (error.response?.status === 404) {
                setMaterials([]);
            } else {
                Alert.alert('Error', 'Failed to load materials');
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
        } finally {
            setLoadingPrograms(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            setLoadingSubjects(true);
            const response = await api.get<SubjectApiResponse>('/subjects');
            if (response.data.success && response.data.data) {
                setSubjects(response.data.data.subjects || []);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoadingSubjects(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
        fetchPrograms();
        fetchSubjects();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMaterials();
        setRefreshing(false);
    };

    const getMaterialIcon = (type: string) => {
        switch (type) {
            case 'IMAGE':
                return 'image';
            case 'VIDEO':
                return 'video';
            case 'DOCUMENT':
                return 'file-text';
            default:
                return 'file';
        }
    };

    const getMaterialColor = (type: string) => {
        switch (type) {
            case 'IMAGE':
                return '#4F46E5';
            case 'VIDEO':
                return '#E53935';
            case 'DOCUMENT':
                return '#FB8C00';
            default:
                return '#666';
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

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleView = (material: Material) => {
        const fullPath = bucketUrl(material.objectKey);
        if (material.materialType === 'IMAGE') {
            navigation.navigate('ImageViewer', {
                imageUri: fullPath,
                imageTitle: material.title,
                enableDownload: true,
                enableShare: true,
            });
        } else if (material.materialType === 'VIDEO') {
            Alert.alert('Video Player', `Playing: ${material.title}`);
        } else if (material.materialType === 'PDF' || material.file.mimeType === 'application/pdf') {
            navigation.navigate('PDFViewer', {
                pdfUri: fullPath,
                pdfTitle: material.title,
                enableDownload: true,
                enableShare: true,
            });
        } else {
            Alert.alert('Document Viewer', `Opening: ${material.title}`);
        }
    };

    // FIXED: Handle details with proper pre-filling
    const handleDetails = (material: Material) => {
        setSelectedMaterial(material);

        // Find the program ID from the subject
        let programId = '';
        let subjectId = '';

        if (material.subject && material.subject.id) {
            subjectId = material.subject.id;
            // Find the subject in the subjects list to get its program ID
            const foundSubject = subjects.find(s => s.id === material.subject?.id);
            if (foundSubject && foundSubject.program) {
                programId = foundSubject.program.id;
            }
        }

        setFormData({
            title: material.title || '',
            description: material.description || '',
            programId: programId,
            subjectId: subjectId,
        });
        setIsEditing(false);
        setDetailModalVisible(true);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveDraft = async () => {
        if (!selectedMaterial) return;

        // Validation
        if (!formData.title || formData.title.trim().length < 2) {
            Alert.alert('Validation Error', 'Title is required and must be at least 2 characters');
            return;
        }
        if (!formData.programId) {
            Alert.alert('Validation Error', 'Please select a program');
            return;
        }
        if (!formData.subjectId) {
            Alert.alert('Validation Error', 'Please select a subject');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim() || '',
                programId: formData.programId,
                subjectId: formData.subjectId,
            };

            const response = await api.patch(`/materials/${selectedMaterial.id}`, payload);

            if (response.data.success) {
                Alert.alert('Success', 'Material saved as draft successfully');
                setIsEditing(false);
                fetchMaterials();
                // Update the selected material with new data
                setSelectedMaterial({
                    ...selectedMaterial,
                    title: formData.title.trim(),
                    description: formData.description.trim() || '',
                });
                return true
            } else {
                Alert.alert('Error', response.data.message || 'Failed to save draft');
                return false
            }
        } catch (error: any) {
            console.error('Save draft error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save draft');
            return false
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedMaterial) return;

        // Validation
        if (!formData.title || formData.title.trim().length < 2) {
            Alert.alert('Validation Error', 'Title is required and must be at least 2 characters');
            return;
        }
        if (!formData.programId) {
            Alert.alert('Validation Error', 'Please select a program');
            return;
        }
        if (!formData.subjectId) {
            Alert.alert('Validation Error', 'Please select a subject');
            return;
        }

        Alert.alert(
            'Publish Material',
            `Are you sure you want to publish "${selectedMaterial.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Publish',
                    style: 'default',
                    onPress: async () => {
                        try {
                            setSubmitting(true);

                            const saveDraftResponse = await handleSaveDraft();
                            if (saveDraftResponse) {
                                const response = await api.post(`/materials/${selectedMaterial.id}/publish`);

                                if (response.data.success) {
                                    Alert.alert('Success', 'Material published successfully');
                                    setDetailModalVisible(false);
                                    fetchMaterials();
                                } else {
                                    Alert.alert('Error', response.data.message || 'Failed to publish material');
                                }
                            }

                        } catch (error: any) {
                            console.error('Publish error:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to publish material');
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ]
        );
    };

    const renderMaterialItem = ({ item }: { item: Material }) => {
        const iconName = getMaterialIcon(item.materialType);
        const color = getMaterialColor(item.materialType);

        return (
            <View style={styles.materialCard}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                        <Icon name={iconName} size={24} color={color} />
                    </View>
                    <View style={styles.materialInfo}>
                        <Text style={styles.materialTitle} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <View style={styles.materialMeta}>
                            <Text style={styles.materialType}>{item.materialType}</Text>
                            <Text style={styles.materialDot}>•</Text>
                            <Text style={styles.materialSize}>
                                {formatFileSize(item.file.size)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>

                {item.description && (
                    <Text style={styles.materialDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                        <Icon name="user" size={14} color="#999" />
                        <Text style={styles.footerText}>{item.createdBy.name}</Text>
                    </View>
                    <View style={styles.footerLeft}>
                        <Icon name="calendar" size={14} color="#999" />
                        <Text style={styles.footerText}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.viewButton]}
                        onPress={() => handleView(item)}
                    >
                        <Icon name="eye" size={16} color="#4F46E5" />
                        <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.detailsButton]}
                        onPress={() => handleDetails(item)}
                    >
                        <Text style={styles.detailsButtonText}>Complete Details</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderDetailModal = () => {
        if (!selectedMaterial) return null;

        const filteredSubjects = subjects.filter(s => s.program?.id === formData.programId);

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailModalVisible}
                onRequestClose={() => {
                    setDetailModalVisible(false);
                    setSelectedMaterial(null);
                    setIsEditing(false);
                }}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Complete Details</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setDetailModalVisible(false);
                                    setSelectedMaterial(null);
                                    setIsEditing(false);
                                }}
                                disabled={submitting}
                            >
                                <Icon name="x" size={24} color="#1A1A1A" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalSubtitle}>
                                Fill in the required metadata to publish this material.
                            </Text>

                            {/* Title */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Title *</Text>
                                <TextInput
                                    style={[styles.formInput, !isEditing && styles.disabledInput]}
                                    value={formData.title}
                                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                                    placeholder="Enter title"
                                    editable={isEditing}
                                />
                            </View>

                            {/* Description */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Description</Text>
                                <TextInput
                                    style={[styles.formInput, styles.textArea, !isEditing && styles.disabledInput]}
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                    placeholder="Optional description"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    editable={isEditing}
                                />
                            </View>

                            {/* Program */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Program *</Text>
                                <View style={[styles.pickerContainer, !isEditing && styles.disabledInput]}>
                                    <Picker
                                        selectedValue={formData.programId}
                                        onValueChange={(value) => {
                                            setFormData({ ...formData, programId: value, subjectId: '' });
                                        }}
                                        style={styles.picker}
                                        enabled={isEditing && !loadingPrograms}
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

                            {/* Subject */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Subject *</Text>
                                <View style={[styles.pickerContainer, !isEditing && styles.disabledInput]}>
                                    <Picker
                                        selectedValue={formData.subjectId}
                                        onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                                        style={styles.picker}
                                        enabled={isEditing && !loadingSubjects && !!formData.programId}
                                    >
                                        <Picker.Item
                                            label={!formData.programId ? 'Select a program first' : 'Select a subject'}
                                            value=""
                                        />
                                        {filteredSubjects.map((subject) => (
                                            <Picker.Item
                                                key={subject.id}
                                                label={subject.name}
                                                value={subject.id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                                {loadingSubjects && <ActivityIndicator size="small" color="#4F46E5" />}
                            </View>

                            {/* Material Type - Read Only */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Material Type</Text>
                                <View style={[styles.infoBox, { backgroundColor: '#F5F5F5' }]}>
                                    <Text style={styles.infoBoxText}>{selectedMaterial.materialType}</Text>
                                </View>
                            </View>

                            {/* File Size - Read Only */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>File Size</Text>
                                <View style={[styles.infoBox, { backgroundColor: '#F5F5F5' }]}>
                                    <Text style={styles.infoBoxText}>
                                        {formatFileSize(selectedMaterial.file.size)}
                                    </Text>
                                </View>
                            </View>

                            {/* Edit/Cancel Buttons */}
                            {!isEditing ? (
                                <TouchableOpacity
                                    style={[styles.editButton, styles.actionButtonModal]}
                                    onPress={handleEdit}
                                >
                                    <Icon name="edit-2" size={18} color="#FFF" />
                                    <Text style={styles.editButtonText}>Edit Details</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.cancelButton, styles.actionButtonModal]}
                                    onPress={() => {
                                        setIsEditing(false);
                                        // Reset form data to original values
                                        if (selectedMaterial) {
                                            let programId = '';
                                            let subjectId = '';

                                            if (selectedMaterial.subject && selectedMaterial.subject.id) {
                                                subjectId = selectedMaterial.subject.id;
                                                const foundSubject = subjects.find(s => s.id === selectedMaterial.subject?.id);
                                                if (foundSubject && foundSubject.program) {
                                                    programId = foundSubject.program.id;
                                                }
                                            }

                                            setFormData({
                                                title: selectedMaterial.title || '',
                                                description: selectedMaterial.description || '',
                                                programId: programId,
                                                subjectId: subjectId,
                                            });
                                        }
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel Editing</Text>
                                </TouchableOpacity>
                            )}

                            {/* Three Action Buttons: Close, Save Draft, Publish */}
                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.actionButtonModal, styles.closeButton]}
                                    onPress={() => {
                                        setDetailModalVisible(false);
                                        setSelectedMaterial(null);
                                        setIsEditing(false);
                                    }}
                                    disabled={submitting}
                                >
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButtonModal, styles.saveDraftButton]}
                                    onPress={handleSaveDraft}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.saveDraftButtonText}>Save Draft</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButtonModal, styles.publishModalButton]}
                                    onPress={handlePublish}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.publishModalButtonText}>Publish</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const filteredMaterials = materials.filter(material =>
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.materialType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading materials...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.headerTitle}>Content Library</Text>
                    <Text style={styles.headerSubtitle}>{materials.length} materials</Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchMaterials}
                >
                    <Icon name="refresh-cw" size={20} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by title, type, or description..."
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
                data={filteredMaterials}
                renderItem={renderMaterialItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="folder" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>No Materials Found</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery.length > 0
                                ? 'No materials match your search criteria'
                                : 'No materials available in the content library'}
                        </Text>
                    </View>
                }
            />

            {/* Detail Modal */}
            {renderDetailModal()}
        </SafeAreaView>
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
    refreshButton: {
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
    materialCard: {
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
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    materialInfo: {
        flex: 1,
    },
    materialTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    materialMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    materialType: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    materialDot: {
        fontSize: 12,
        color: '#999',
        marginHorizontal: 4,
    },
    materialSize: {
        fontSize: 12,
        color: '#999',
    },
    statusBadge: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FB8C00',
    },
    materialDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 4,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    viewButton: {
        backgroundColor: '#E8EAF6',
    },
    viewButtonText: {
        fontSize: 13,
        color: '#4F46E5',
        fontWeight: '500',
    },
    detailsButton: {
        backgroundColor: '#E8F5E9',
    },
    detailsButtonText: {
        fontSize: 13,
        color: '#43A047',
        fontWeight: '500',
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
        textAlign: 'center',
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
        height: 80,
        textAlignVertical: 'top',
    },
    disabledInput: {
        backgroundColor: '#F0F0F0',
        opacity: 0.7,
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
    infoBox: {
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    infoBoxText: {
        fontSize: 15,
        color: '#1A1A1A',
    },
    editButton: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
        marginVertical: 10,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
        marginVertical: 10,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '600',
    },
    actionButtonModal: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    closeButton: {
        backgroundColor: '#F5F5F5',
        flex: 1,
    },
    closeButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    saveDraftButton: {
        backgroundColor: '#FB8C00',
        flex: 1,
    },
    saveDraftButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    publishModalButton: {
        backgroundColor: '#4F46E5',
        flex: 1,
    },
    publishModalButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default PublishContent;