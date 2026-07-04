// components/ContentCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

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

interface ContentCardProps {
  material: Material;
  onPress: (material: Material) => void;
}

// URL helper function
const getFileUrl = (path: string): string => {
  return `https://storage.mssplonline.in/e-learning/${path}`;
};

const ContentCard: React.FC<ContentCardProps> = ({ material, onPress }) => {
  const getFileIcon = (type: string): string => {
    switch (type) {
      case 'IMAGE':
        return 'image';
      case 'PDF':
        return 'file-text';
      case 'DOCUMENT':
        return 'file';
      case 'VIDEO':
        return 'video';
      case 'AUDIO':
        return 'music';
      default:
        return 'file';
    }
  };

  const getIconColor = (type: string): string => {
    switch (type) {
      case 'IMAGE':
        return '#4F46E5';
      case 'PDF':
        return '#E53935';
      case 'DOCUMENT':
        return '#43A047';
      case 'VIDEO':
        return '#FB8C00';
      case 'AUDIO':
        return '#8E24AA';
      default:
        return '#666';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderThumbnail = () => {
    const fileUrl = getFileUrl(material.objectKey);

    if (material.materialType === 'IMAGE') {
      return (
        <Image
          source={{ uri: fileUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      );
    } else if (material.materialType === 'VIDEO') {
      return (
        <View style={[styles.thumbnail, styles.videoThumbnail]}>
          <Image
            source={{ uri: fileUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.playIconContainer}>
            <Icon name="play-circle" size={40} color="#FFFFFF" />
          </View>
        </View>
      );
    } else {
      // For PDF, DOCUMENT, AUDIO - show icon
      return (
        <View style={[styles.thumbnail, styles.iconThumbnail]}>
          <Icon 
            name={getFileIcon(material.materialType)} 
            size={50} 
            color={getIconColor(material.materialType)} 
          />
        </View>
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(material)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        {renderThumbnail()}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{material.materialType}</Text>
        </View>
      </View>

      <View style={styles.contentInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {material.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {material.description}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.subjectText}>{material.subject?.name || 'General'}</Text>
          <Text style={styles.fileSizeText}>{formatFileSize(material.file.size)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: CARD_WIDTH * 0.8,
    backgroundColor: '#F5F5F5',
  },
  videoThumbnail: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  playIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  contentInfo: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '500',
  },
  fileSizeText: {
    fontSize: 11,
    color: '#999',
  },
});

export default ContentCard;