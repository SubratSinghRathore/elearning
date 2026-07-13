// components/ImageViewer.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigator/Stack';

const { width, height } = Dimensions.get('window');

type ImageViewerRouteProp = RouteProp<RootStackParamList, 'ImageViewer'>;

const ImageViewer: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ImageViewerRouteProp>();
  
  const {
    imageUri = '',
    imageTitle = '',
    enableDownload = true,
    enableShare = true,
    onClose,
  } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const scale: any = useRef(new Animated.Value(1)).current;
  const translateX: any = useRef(new Animated.Value(0)).current;
  const translateY: any = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const [isZooming, setIsZooming] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastScale.current = scale._value;
        lastTranslateX.current = translateX._value;
        lastTranslateY.current = translateY._value;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.changedTouches.length === 2) {
          const touches = evt.nativeEvent.changedTouches;
          const touch1 = touches[0];
          const touch2 = touches[1];
          
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          const newScale = Math.min(Math.max(lastScale.current * (distance / 200), 0.5), 3);
          scale.setValue(newScale);
          setIsZooming(true);
        } else {
          const { dx, dy } = gestureState;
          
          if (scale._value > 1) {
            const maxTranslateX = (scale._value - 1) * width / 2;
            const maxTranslateY = (scale._value - 1) * height / 2;
            
            const newTranslateX = Math.min(
              Math.max(lastTranslateX.current + dx, -maxTranslateX),
              maxTranslateX
            );
            const newTranslateY = Math.min(
              Math.max(lastTranslateY.current + dy, -maxTranslateY),
              maxTranslateY
            );
            
            translateX.setValue(newTranslateX);
            translateY.setValue(newTranslateY);
          } else if (Math.abs(dy) > 20) {
            translateY.setValue(dy * 0.5);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isZooming && gestureState.dy > 100 && scale._value <= 1.1) {
          closeImage();
          return;
        }

        if (scale._value < 1) {
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
          }).start();
        }

        if (scale._value <= 1.1) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
          }).start();
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
          }).start();
        }

        setIsZooming(false);
      },
    })
  ).current;

  const closeImage = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
    ]).start();

    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    setLoading(true);
    setImageError(false);
    
    if (onClose) {
      onClose();
    }
    
    navigation.goBack();
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setImageError(true);
  };

  const handleDownload = () => {
    console.log('Download image:', imageUri);
  };

  const handleShare = () => {
    console.log('Share image:', imageUri);
  };

  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
    ]).start();
    
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={closeImage} style={styles.headerButton}>
            <Icon name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {imageTitle && (
            <Text style={styles.imageTitle} numberOfLines={1}>
              {imageTitle}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {enableShare && (
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Icon name="share-2" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {enableDownload && (
            <TouchableOpacity onPress={handleDownload} style={styles.headerButton}>
              <Icon name="download" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={resetZoom} style={styles.headerButton}>
            <Icon name="maximize-2" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.imageWrapper,
            {
              transform: [
                { scale: scale },
                { translateX: translateX },
                { translateY: translateY },
              ],
            },
          ]}
        >
          {imageError ? (
            <View style={styles.errorContainer}>
              <Icon name="image" size={64} color="#666" />
              <Text style={styles.errorText}>Failed to load image</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => {
                setLoading(true);
                setImageError(false);
              }}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
              onLoadStart={() => setLoading(true)}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </Animated.View>
      </View>

      {loading && !imageError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {scale._value > 1.1 ? `Zoom: ${Math.round(scale._value * 100)}%` : 'Pinch to zoom • Drag to pan'}
        </Text>
        <View style={styles.footerControls}>
          <TouchableOpacity 
            style={styles.footerButton} 
            onPress={() => {
              const newScale = Math.min(scale._value + 0.5, 3);
              Animated.spring(scale, {
                toValue: newScale,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
              }).start();
              lastScale.current = newScale;
            }}
          >
            <Icon name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.footerButton} 
            onPress={() => {
              const newScale = Math.max(scale._value - 0.5, 0.5);
              Animated.spring(scale, {
                toValue: newScale,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
              }).start();
              lastScale.current = newScale;
            }}
          >
            <Icon name="minus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.gestureHint, { opacity: 1 }]}>
        <Icon name="move" size={24} color="#FFFFFF" />
        <Text style={styles.gestureHintText}>
          Pinch to zoom • Drag to move
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  imageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  image: {
    width: width,
    height: height * 0.9,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  footerControls: {
    flexDirection: 'row',
  },
  footerButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginLeft: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureHint: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gestureHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ImageViewer;