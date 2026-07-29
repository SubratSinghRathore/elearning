import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigator/Stack';
import WebView from 'react-native-webview';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

type PDFViewerRouteProp = RouteProp<RootStackParamList, 'PDFViewer'>;

interface PDFViewerProps {
  pdfUri?: string;
  pdfTitle?: string;
  enableDownload?: boolean;
  enableShare?: boolean;
  onClose?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = () => {
  const navigation = useNavigation();
  const route = useRoute<PDFViewerRouteProp>();
  
  const {
    pdfUri = '',
    pdfTitle = '',
    enableDownload = true,
    enableShare = true,
    onClose,
  } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (!pdfUri) {
      closePDF();
    }
  }, [pdfUri]);

  const closePDF = () => {
    setLoading(true);
    setPdfError(false);
    setCurrentPage(1);
    setTotalPages(0);
    
    if (onClose) {
      onClose();
    }
    
    navigation.goBack();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setPdfError(false);
  };

  const handleLoadError = () => {
    console.error('PDF Error');
    setLoading(false);
    setPdfError(true);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PAGE_INFO') {
        setCurrentPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handleDownload = () => {
    console.log('Download PDF:', pdfUri);
    // Implement download logic
  };

  const handleShare = () => {
    console.log('Share PDF:', pdfUri);
    // Implement share logic
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (webViewRef.current) {
      const script = `
        document.querySelector('iframe').contentWindow.postMessage({
          type: 'GO_TO_PAGE',
          page: ${page}
        }, '*');
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleZoomIn = () => {
    if (webViewRef.current) {
      const script = `
        document.querySelector('iframe').contentWindow.postMessage({
          type: 'ZOOM_IN'
        }, '*');
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleZoomOut = () => {
    if (webViewRef.current) {
      const script = `
        document.querySelector('iframe').contentWindow.postMessage({
          type: 'ZOOM_OUT'
        }, '*');
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const resetZoom = () => {
    if (webViewRef.current) {
      const script = `
        document.querySelector('iframe').contentWindow.postMessage({
          type: 'RESET_ZOOM'
        }, '*');
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const generatePDFHTML = (uri: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>PDF Viewer</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              background: #1a1a1a; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh;
              width: 100vw;
              overflow: hidden;
              margin: 0;
              padding: 0;
            }
            #container {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #1a1a1a;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
              background: white;
            }
            @media (min-width: 768px) {
              iframe {
                max-width: 95%;
                max-height: 95%;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
              }
            }
            .error {
              color: white;
              text-align: center;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .error h2 { margin-bottom: 10px; }
            .error p { color: #999; }
          </style>
        </head>
        <body>
          <div id="container">
            <iframe 
              src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(uri)}"
              allowfullscreen
              allow="autoplay; encrypted-media"
            ></iframe>
          </div>
          <script>
            (function() {
              const iframe = document.querySelector('iframe');
              let pageInfoSent = false;

              // Function to get page info
              function getPageInfo() {
                try {
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                      type: 'GET_PAGE_INFO'
                    }, '*');
                  }
                } catch (e) {
                  console.error('Error getting page info:', e);
                }
              }

              // Listen for messages from React Native
              window.addEventListener('message', function(event) {
                const data = event.data;
                if (data && data.type && iframe && iframe.contentWindow) {
                  iframe.contentWindow.postMessage(data, '*');
                }
              });

              // Listen for messages from PDF viewer
              window.addEventListener('message', function(event) {
                const data = event.data;
                if (data && data.type === 'PAGE_INFO') {
                  pageInfoSent = true;
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAGE_INFO',
                    page: data.page || 1,
                    totalPages: data.totalPages || 1
                  }));
                }
              });

              // Send initial page info
              setTimeout(function() {
                if (!pageInfoSent) {
                  getPageInfo();
                }
              }, 1000);

              // Retry getting page info every 2 seconds until we get it
              const interval = setInterval(function() {
                if (!pageInfoSent) {
                  getPageInfo();
                } else {
                  clearInterval(interval);
                }
              }, 2000);

              // Clean up interval after 10 seconds
              setTimeout(function() {
                clearInterval(interval);
              }, 10000);
            })();
          </script>
        </body>
      </html>
    `;
  };

  if (!pdfUri) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden />
        <View style={styles.errorContainer}>
          <Icon name="file" size={64} color="#666" />
          <Text style={styles.errorText}>No PDF file provided</Text>
          <TouchableOpacity style={styles.retryButton} onPress={closePDF}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pdfHtml = generatePDFHTML(pdfUri);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar hidden />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={closePDF} style={styles.headerButton}>
            <Icon name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {pdfTitle && (
            <Text style={styles.pdfTitle} numberOfLines={1}>
              {pdfTitle}
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

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {pdfError ? (
          <View style={styles.errorContainer}>
            <Icon name="file" size={64} color="#666" />
            <Text style={styles.errorText}>Failed to load PDF</Text>
            <Text style={styles.errorSubText}>Please check the file and try again</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setLoading(true);
              setPdfError(false);
            }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: pdfHtml }}
            style={styles.webview}
            onLoadEnd={handleLoadEnd}
            onError={handleLoadError}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
            scalesPageToFit={false}
            scrollEnabled={true}
          />
        )}
      </View>

      {/* Navigation Controls */}
      {!pdfError && totalPages > 0 && (
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentPage <= 1 && styles.navButtonDisabled]}
            onPress={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <Icon name="chevron-left" size={24} color={currentPage <= 1 ? "#666" : "#FFFFFF"} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>
              {currentPage} / {totalPages}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, currentPage >= totalPages && styles.navButtonDisabled]}
            onPress={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <Icon name="chevron-right" size={24} color={currentPage >= totalPages ? "#666" : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      )}

      {/* Gesture Hint */}
      {!pdfError && (
        <View style={styles.gestureHint}>
          <Icon name="move" size={20} color="#FFFFFF" />
          <Text style={styles.gestureHintText}>
            Swipe to navigate • Pinch to zoom
          </Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  pdfTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 12,
    fontWeight: '500',
  },
  errorSubText: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  retryButton: {
    marginTop: 20,
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
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  navButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pageInfo: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  pageInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  footerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(79, 70, 229, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.5)',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  gestureHint: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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

export default PDFViewer;