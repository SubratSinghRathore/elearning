// pages/Content.tsx
import React, { useState, useEffect } from 'react';
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
  Dimensions,
  Image,
  Share,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import ContentCard from '../../components/ContentCard';
import { WebView } from 'react-native-webview';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import api from '../../api/axios';

const { width, height } = Dimensions.get('window');

// Types defined inside component
interface Material {
  id: string;
  title: string;
  description: string;
  materialType: 'IMAGE' | 'PDF' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
  objectKey: string;
  file: {
    originalFileName: string;
    mimeType: string;
    size: number;
  };
  status: string;
  subject: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ContentProps {
  navigation: any;
}

// URL helper function
const getFileUrl = (path: string): string => {
  return `https://storage.mssplonline.in/e-learning/${path}`;
};

const Content: React.FC<ContentProps> = ({ navigation }) => {
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [paused, setPaused] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const materialTypes = ['ALL', 'IMAGE', 'PDF', 'DOCUMENT', 'VIDEO', 'AUDIO'];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const currentPage = reset ? 1 : page;
      const url = `/materials?status=PUBLISHED&page=${currentPage}&limit=50`;

      console.log('Fetching URL:', url);

      const response = await api.get(url);
      const data = response.data;

      console.log('Response data:', data);

      if (data.success) {
        const newMaterials = data.data.materials || [];
        setHasMore(data.data.pagination?.hasMore || false);
        
        if (reset) {
          setAllMaterials(newMaterials);
        } else {
          setAllMaterials(prev => [...prev, ...newMaterials]);
        }
        
        if (!reset) {
          setPage(prev => prev + 1);
        }
      } else {
        console.error('API Error:', data.message);
        Alert.alert('Error', data.message || 'Failed to load materials');
      }
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Client-side filtering function
  const getFilteredMaterials = () => {
    let filtered = allMaterials;

    // Filter by type (client-side)
    if (selectedType && selectedType !== 'ALL') {
      filtered = filtered.filter(material => material.materialType === selectedType);
    }

    // Filter by search query (client-side)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(query) ||
        material.description.toLowerCase().includes(query) ||
        material.subject?.name?.toLowerCase().includes(query) ||
        material.materialType.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMaterials(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      fetchMaterials(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // No API call - client-side filtering only
  };

  const handleTypeFilter = (type: string) => {
    console.log('Filter selected:', type);
    if (type === 'ALL') {
      setSelectedType(null);
    } else {
      setSelectedType(type);
    }
  };

  const handleCardPress = (material: Material) => {
    setSelectedMaterial(material);
    setModalVisible(true);
    setPaused(false);
    setDownloadProgress(0);
    handleDownload(material);
  };

  const handleShare = async () => {
    if (!selectedMaterial) return;
    try {
      await Share.share({
        message: `Check out this material: ${selectedMaterial.title}\n\nDescription: ${selectedMaterial.description}\n\nSubject: ${selectedMaterial.subject?.name || 'General'}`,
        title: selectedMaterial.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Request storage permission for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to download files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Download file function
  const handleDownload = async (material: Material) => {
    if (!material) return;

    if (Platform.OS === "android") {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Cannot download without storage permission.');
        return;
      }
    }

    setDownloading(true);
    setDownloadProgress(0);
    
    const fileUrl = getFileUrl(material.objectKey);
    const fileName = material.file.originalFileName || `${material.title}.${material.materialType.toLowerCase()}`;
    
    const downloadDir = Platform.OS === 'android' 
      ? RNFS.DownloadDirectoryPath 
      : RNFS.DocumentDirectoryPath;
    
    const filePath = `${downloadDir}/${fileName}`;

    try {
      if (await RNFS.exists(filePath)) {
        setDownloading(false);
        Alert.alert(
          'File Already Downloaded',
          `"${fileName}" is already saved on your device.`,
          [
            { text: 'OK' },
            { 
              text: 'Open File', 
              onPress: () => {
                if (Platform.OS === 'android') {
                  Alert.alert('Info', 'File saved in Downloads folder');
                }
              }
            }
          ]
        );
        return;
      }

      await performDownload(fileUrl, filePath, fileName, material);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Failed to download file. Please try again.');
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const performDownload = async (fileUrl: string, filePath: string, fileName: string, material: Material) => {
    try {
      const download = RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: filePath,
        progress: (res) => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(progressPercent);
          console.log(`Download progress: ${Math.round(progressPercent)}%`);
        },
        progressDivider: 5,
      });

      const result = await download.promise;

      if (result.statusCode === 200) {
        setDownloading(false);
        setDownloadProgress(100);
        Alert.alert(
          'Download Complete',
          `"${fileName}" has been downloaded successfully!`,
          [
            { text: 'OK' },
            { 
              text: 'Open File', 
              onPress: () => {
                if (Platform.OS === 'android') {
                  Alert.alert('Info', 'File saved in Downloads folder');
                }
              }
            }
          ]
        );
      } else {
        throw new Error(`Download failed with status: ${result.statusCode}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Failed to download file. Please try again.');
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderImagePreview = () => {
    if (!selectedMaterial) return null;
    const fileUrl = getFileUrl(selectedMaterial.objectKey);
    return (
      <Image
        source={{ uri: fileUrl }}
        style={styles.modalImagePreview}
        resizeMode="contain"
      />
    );
  };

  const renderPdfPreview = () => {
    if (!selectedMaterial) return null;
    const fileUrl = getFileUrl(selectedMaterial.objectKey);
    return (
      <View style={styles.modalPdfContainer}>
        <WebView
          source={{ uri: fileUrl }}
          style={styles.modalPdfPreview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          onError={(error) => {
            console.error('PDF Error:', error);
            Alert.alert('Error', 'Failed to load PDF');
          }}
        />
      </View>
    );
  };

  const renderVideoPreview = () => {
    if (!selectedMaterial) return null;
    const fileUrl = getFileUrl(selectedMaterial.objectKey);
    return (
      <View style={styles.modalVideoContainer}>
        <Video
          source={{ uri: fileUrl }}
          style={styles.modalVideoPreview}
          paused={paused}
          resizeMode="contain"
          controls={true}
          onLoad={() => {
            console.log('Video loaded');
          }}
          onError={(error) => {
            console.error('Video Error:', error);
          }}
        />
      </View>
    );
  };

  const renderAudioPreview = () => {
    if (!selectedMaterial) return null;
    return (
      <View style={styles.modalAudioContainer}>
        <View style={styles.modalAudioIconContainer}>
          <Icon name="music" size={60} color="#8E24AA" />
        </View>
        <Text style={styles.modalAudioTitle}>{selectedMaterial.title}</Text>
        <View style={styles.modalAudioControls}>
          <TouchableOpacity style={styles.modalAudioControlButton}>
            <Icon name="play-circle" size={50} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderModalContent = () => {
    if (!selectedMaterial) return null;

    switch (selectedMaterial.materialType) {
      case 'IMAGE':
        return renderImagePreview();
      case 'PDF':
        return renderPdfPreview();
      case 'VIDEO':
        return renderVideoPreview();
      case 'AUDIO':
        return renderAudioPreview();
      default:
        return (
          <View style={styles.modalDocumentPreview}>
            <Icon name="file" size={60} color="#4F46E5" />
            <Text style={styles.modalDocumentText}>Document Preview</Text>
          </View>
        );
    }
  };

  const renderHeader = () => {
    const filteredCount = getFilteredMaterials().length;
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Content Library</Text>
        <Text style={styles.headerSubtitle}>
          {filteredCount} materials available
          {selectedType && selectedType !== 'ALL' && ` (${selectedType})`}
        </Text>
      </View>
    );
  };

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials..."
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="x" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={materialTypes}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterTab,
              (selectedType === item || (item === 'ALL' && !selectedType)) &&
                styles.filterTabActive,
            ]}
            onPress={() => handleTypeFilter(item)}
          >
            <Text
              style={[
                styles.filterTabText,
                (selectedType === item || (item === 'ALL' && !selectedType)) &&
                  styles.filterTabTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterTabsContainer}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="file" size={60} color="#D6D6D6" />
      <Text style={styles.emptyTitle}>No materials found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filter
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  };

  const displayMaterials = getFilteredMaterials();

  return (
    <View style={styles.container}>
      {renderSearch()}
      {renderFilterTabs()}

      {loading && allMaterials.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading materials...</Text>
        </View>
      ) : (
        <FlatList
          data={displayMaterials}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <ContentCard material={item} onPress={handleCardPress} />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4F46E5"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Material Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedMaterial(null);
          setDownloading(false);
          setDownloadProgress(0);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSelectedMaterial(null);
                  setDownloading(false);
                  setDownloadProgress(0);
                }}
                style={styles.modalCloseButton}
              >
                <Icon name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedMaterial?.title || 'Material Preview'}
              </Text>
              <View style={styles.modalHeaderActions}>
                {/* Download Button */}
                <TouchableOpacity 
                  onPress={() => selectedMaterial && handleDownload(selectedMaterial)} 
                  style={styles.modalActionButton}
                  disabled={downloading}
                >
                  {downloading ? (
                    <View style={styles.downloadProgressContainer}>
                      <ActivityIndicator size="small" color="#4F46E5" />
                    </View>
                  ) : (
                    <Icon name="download" size={22} color="#4F46E5" />
                  )}
                </TouchableOpacity>
                {/* Share Button */}
                <TouchableOpacity 
                  onPress={handleShare} 
                  style={styles.modalActionButton}
                >
                  <Icon name="share-2" size={22} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Download Progress Bar */}
            {downloading && downloadProgress > 0 && downloadProgress < 100 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${downloadProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  Downloading... {Math.round(downloadProgress)}%
                </Text>
              </View>
            )}

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Preview */}
              <View style={styles.modalPreviewContainer}>
                {renderModalContent()}
              </View>

              {/* Material Info */}
              {selectedMaterial && (
                <View style={styles.modalInfoSection}>
                  <Text style={styles.modalTitle}>{selectedMaterial.title}</Text>
                  <Text style={styles.modalDescription}>{selectedMaterial.description}</Text>

                  <View style={styles.modalMetaGrid}>
                    <View style={styles.modalMetaItem}>
                      <Icon name="book" size={16} color="#4F46E5" />
                      <Text style={styles.modalMetaLabel}>Subject</Text>
                      <Text style={styles.modalMetaValue}>
                        {selectedMaterial.subject?.name || 'General'}
                      </Text>
                    </View>

                    <View style={styles.modalMetaItem}>
                      <Icon name="user" size={16} color="#4F46E5" />
                      <Text style={styles.modalMetaLabel}>Uploaded By</Text>
                      <Text style={styles.modalMetaValue}>
                        {selectedMaterial.createdBy?.name || 'Unknown'}
                      </Text>
                    </View>

                    <View style={styles.modalMetaItem}>
                      <Icon name="file" size={16} color="#4F46E5" />
                      <Text style={styles.modalMetaLabel}>File Size</Text>
                      <Text style={styles.modalMetaValue}>
                        {formatFileSize(selectedMaterial.file.size)}
                      </Text>
                    </View>

                    <View style={styles.modalMetaItem}>
                      <Icon name="calendar" size={16} color="#4F46E5" />
                      <Text style={styles.modalMetaLabel}>Uploaded On</Text>
                      <Text style={styles.modalMetaValue}>
                        {new Date(selectedMaterial.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalTypeBadge}>
                    <Text style={styles.modalTypeBadgeText}>
                      {selectedMaterial.materialType}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FF',
  },
  headerContainer: {
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterTabsContainer: {
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: {
    backgroundColor: '#4F46E5',
  },
  filterTabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
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
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  // Progress Bar Styles
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  downloadProgressContainer: {
    padding: 4,
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
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 12,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActionButton: {
    padding: 4,
    marginLeft: 12,
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  modalPreviewContainer: {
    width: '100%',
    height: width * 0.6,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginVertical: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImagePreview: {
    width: '100%',
    height: '100%',
  },
  modalPdfContainer: {
    width: '100%',
    height: '100%',
  },
  modalPdfPreview: {
    flex: 1,
    width: '100%',
  },
  modalVideoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  modalVideoPreview: {
    flex: 1,
  },
  modalAudioContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalAudioIconContainer: {
    marginBottom: 16,
  },
  modalAudioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalAudioControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAudioControlButton: {
    marginHorizontal: 12,
  },
  modalDocumentPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDocumentText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  modalInfoSection: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  modalMetaItem: {
    width: '50%',
    paddingVertical: 6,
  },
  modalMetaLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  modalMetaValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
    marginTop: 1,
  },
  modalTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default Content;