// pages/VideoCall.tsx - Using WebView for LiveKit
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

interface VideoCallProps {
  navigation: any;
  route: {
    params: {
      roomName: string;
      token: string;
      serverURL: string;
      participantName: string;
      participantRole: string;
      sessionId: string;
      title: string;
      teacher: string;
      subject: string;
      batch: string;
    };
  };
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
  isSystem?: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ navigation, route }) => {
  const {
    roomName,
    token,
    serverURL,
    participantName,
    participantRole,
    sessionId,
    title,
    teacher,
    subject,
    batch,
  } = route.params || {};

  const [isConnected, setIsConnected] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [webViewError, setWebViewError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webViewRef = useRef<WebView>(null);

  // HTML for LiveKit WebView
  const getLiveKitHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>LiveKit Call</title>
          <style>
            body { margin: 0; padding: 0; background: #1a1a1a; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            #container { width: 100%; height: 100%; display: flex; flex-direction: column; background: #0a0a0a; }
            #header { background: #1a1a1a; padding: 15px; text-align: center; border-bottom: 1px solid #333; }
            #header h1 { margin: 0; color: #fff; font-size: 18px; }
            #video-container { flex: 1; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; padding: 10px; gap: 10px; background: #0a0a0a; }
            .video-box { background: #2a2a2a; border-radius: 12px; min-width: 200px; min-height: 150px; display: flex; flex-direction: column; justify-content: center; align-items: center; flex: 1; border: 2px solid #4F46E5; position: relative; }
            .video-box .participant-name { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 4px 12px; border-radius: 6px; color: #fff; font-size: 12px; }
            .avatar { width: 60px; height: 60px; border-radius: 30px; background: #4F46E5; display: flex; justify-content: center; align-items: center; font-size: 24px; color: #fff; font-weight: bold; margin-bottom: 8px; }
            .participant-status { color: #4CAF50; font-size: 12px; }
            #status-bar { background: rgba(0,0,0,0.8); padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #333; }
            #status-bar .status-text { color: #FF4444; font-size: 14px; font-weight: 600; }
            #status-bar .duration { color: #4CAF50; font-size: 14px; font-weight: 500; }
            #status-bar .participants { color: #999; font-size: 14px; }
            .connecting { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #fff; }
            .connecting .spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #4F46E5; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .connecting p { margin-top: 20px; color: #999; }
            .error { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #fff; }
            .error .icon { font-size: 48px; }
            .error h2 { color: #EF4444; }
            .error p { color: #999; }
          </style>
        </head>
        <body>
          <div id="container">
            <div id="header">
              <h1>${title || 'Live Class'}</h1>
            </div>
            <div id="video-container">
              <div class="video-box">
                <div class="avatar">${participantName?.charAt(0).toUpperCase() || 'U'}</div>
                <div style="color:#fff;font-weight:600;">${participantName || 'You'}</div>
                <div class="participant-status">● Connected</div>
                <div class="participant-name">You</div>
              </div>
              <div class="video-box" style="border-color:#666;">
                <div class="avatar" style="background:#6B7280;">T</div>
                <div style="color:#fff;font-weight:600;">${teacher || 'Teacher'}</div>
                <div class="participant-status">● Connected</div>
                <div class="participant-name">Teacher</div>
              </div>
            </div>
            <div id="status-bar">
              <span class="status-text">🔴 Live</span>
              <span class="duration">⏱ 00:00</span>
              <span class="participants">👥 2</span>
            </div>
          </div>
          <script>
            // Log connection info
            console.log('Room Name:', '${roomName}');
            console.log('Token:', '${token?.substring(0, 50)}...');
            console.log('Server URL:', '${serverURL}');
            console.log('Participant:', '${participantName}');
            
            // Update duration
            let seconds = 0;
            setInterval(() => {
              seconds++;
              const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
              const secs = String(seconds % 60).padStart(2, '0');
              document.querySelector('.duration').textContent = '⏱ ' + mins + ':' + secs;
            }, 1000);
          </script>
        </body>
      </html>
    `;
  };

  useEffect(() => {
    console.log('📱 VideoCall screen mounted');
    console.log('📋 Room Name:', roomName);
    console.log('👤 Participant:', participantName);

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    // Add system messages
    setTimeout(() => {
      addChatMessage('system', `${teacher} joined the call`);
    }, 2000);

    setTimeout(() => {
      addChatMessage('system', 'Student 1 joined the call');
    }, 4000);

    return () => {
      clearInterval(timer);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const addChatMessage = (sender: string, message: string, isSystem = false) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender,
      message,
      timestamp: new Date(),
      isOwn: sender === participantName || sender === 'You',
      isSystem,
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    addChatMessage(participantName || 'You', chatInput.trim());
    setChatInput('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (!showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    const message = !isHandRaised ? '🙋 Raised hand' : 'Lowered hand';
    addChatMessage('system', `${participantName}: ${message}`);
  };

  const handleDisconnect = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to leave the call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            setIsConnected(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderChatMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.chatMessageContainer, item.isOwn && styles.chatMessageOwn]}>
      <View style={[styles.chatMessageBubble, item.isOwn && styles.chatMessageBubbleOwn]}>
        {!item.isOwn && !item.isSystem && (
          <Text style={styles.chatMessageSender}>{item.sender}</Text>
        )}
        {item.isSystem ? (
          <Text style={styles.chatSystemMessage}>{item.message}</Text>
        ) : (
          <Text style={styles.chatMessageText}>{item.message}</Text>
        )}
        <Text style={styles.chatMessageTime}>{formatTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Connecting to call...</Text>
          <Text style={styles.loadingSubText}>Please wait while we connect you</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* WebView for LiveKit */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: getLiveKitHTML() }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setWebViewError(true);
            setLoading(false);
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.webViewLoadingText}>Loading video call...</Text>
            </View>
          )}
        />
      </View>

      {/* Native Controls Overlay */}
      <View style={styles.controlsOverlay}>
        {/* Call Info Bar */}
        <View style={styles.callInfoBar}>
          <Text style={styles.callInfoTitle}>{title || 'Live Class'}</Text>
          <Text style={styles.callInfoDuration}>⏱ {formatDuration(callDuration)}</Text>
          <Text style={styles.callInfoParticipants}>👥 2</Text>
        </View>

        {/* Controls */}
        <View style={[styles.controlsContainer, !showControls && styles.controlsHidden]}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <Icon
                name={isMuted ? 'mic-off' : 'mic'}
                size={22}
                color={isMuted ? '#FF4444' : '#FFFFFF'}
              />
              <Text style={styles.controlButtonText}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={() => setIsVideoOff(!isVideoOff)}
            >
              <Icon
                name={isVideoOff ? 'video-off' : 'video'}
                size={22}
                color={isVideoOff ? '#FF4444' : '#FFFFFF'}
              />
              <Text style={styles.controlButtonText}>
                {isVideoOff ? 'Video On' : 'Video Off'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isHandRaised && styles.controlButtonActive]}
              onPress={toggleHandRaise}
            >
              <Icon
                name="upload"
                size={22}
                color={isHandRaised ? '#FFD700' : '#FFFFFF'}
              />
              <Text style={styles.controlButtonText}>
                {isHandRaised ? 'Lower' : 'Raise'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowChat(true)}
            >
              <Icon name="message-square" size={22} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Chat</Text>
              {chatMessages.length > 0 && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>{chatMessages.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowParticipants(true)}
            >
              <Icon name="users" size={22} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>2</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleDisconnect}
            >
              <Icon name="phone-off" size={22} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Toggle Controls Button */}
      <TouchableOpacity style={styles.toggleControlsButton} onPress={toggleControls}>
        <Icon name={showControls ? 'chevron-down' : 'chevron-up'} size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showChat}
        onRequestClose={() => setShowChat(false)}
      >
        <View style={styles.chatModalContainer}>
          <View style={styles.chatModalContent}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Live Chat</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Icon name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={chatMessages}
              renderItem={renderChatMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatMessagesList}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={100}
            >
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={sendChatMessage}
                />
                <TouchableOpacity style={styles.chatSendButton} onPress={sendChatMessage}>
                  <Icon name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      {/* Participants Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showParticipants}
        onRequestClose={() => setShowParticipants(false)}
      >
        <View style={styles.participantsModalContainer}>
          <View style={styles.participantsModalContent}>
            <View style={styles.participantsHeader}>
              <Text style={styles.participantsHeaderTitle}>Participants (2)</Text>
              <TouchableOpacity onPress={() => setShowParticipants(false)}>
                <Icon name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.participantsList}>
              <View style={styles.participantListItem}>
                <View style={[styles.participantListAvatar, styles.participantListAvatarLocal]}>
                  <Text style={styles.participantListAvatarText}>
                    {participantName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.participantListInfo}>
                  <Text style={[styles.participantListName, styles.participantListNameLocal]}>
                    {participantName} (You)
                  </Text>
                  <Text style={styles.participantListStatus}>🔵 Connected</Text>
                </View>
                {isHandRaised && <Text style={styles.handRaisedBadge}>🙋</Text>}
              </View>
              <View style={styles.participantListItem}>
                <View style={styles.participantListAvatar}>
                  <Text style={styles.participantListAvatarText}>T</Text>
                </View>
                <View style={styles.participantListInfo}>
                  <Text style={styles.participantListName}>{teacher}</Text>
                  <Text style={styles.participantListStatus}>🔴 Speaking</Text>
                </View>
              </View>
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
    backgroundColor: '#0A0A0A',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
  },

  loadingSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },

  webViewContainer: {
    flex: 1,
  },

  webView: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },

  webViewLoadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },

  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  callInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },

  callInfoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  callInfoDuration: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },

  callInfoParticipants: {
    color: '#999',
    fontSize: 14,
  },

  controlsContainer: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingTop: 12,
  },

  controlsHidden: {
    display: 'none',
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
  },

  controlButtonActive: {
    opacity: 0.8,
  },

  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2,
  },

  endCallButton: {
    backgroundColor: '#EF4444',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  toggleControlsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    zIndex: 20,
  },

  chatBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  chatBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Chat Modal
  chatModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },

  chatModalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.6,
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  chatHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  chatMessagesList: {
    padding: 16,
    flexGrow: 1,
  },

  chatMessageContainer: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },

  chatMessageOwn: {
    alignItems: 'flex-end',
  },

  chatMessageBubble: {
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 12,
    maxWidth: '80%',
  },

  chatMessageBubbleOwn: {
    backgroundColor: '#4F46E5',
  },

  chatMessageSender: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },

  chatMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  chatSystemMessage: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  chatMessageTime: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  chatInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1A1A1A',
  },

  chatInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 8,
  },

  chatSendButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Participants Modal
  participantsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },

  participantsModalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.5,
  },

  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  participantsHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  participantsList: {
    padding: 16,
  },

  participantListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  participantListAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  participantListAvatarLocal: {
    backgroundColor: '#4F46E5',
  },

  participantListAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  participantListInfo: {
    flex: 1,
  },

  participantListName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  participantListNameLocal: {
    color: '#818CF8',
  },

  participantListStatus: {
    color: '#4CAF50',
    fontSize: 12,
  },

  handRaisedBadge: {
    fontSize: 20,
    marginLeft: 8,
  },
});

export default VideoCall;