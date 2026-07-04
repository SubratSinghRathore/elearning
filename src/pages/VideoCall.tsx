// pages/VideoCall.tsx - Complete working version
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
  ScrollView,
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

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    console.log('📱 VideoCall mounted');
    console.log('📋 Room Name:', roomName);
    console.log('👤 Participant:', participantName);
    console.log('🔑 Token:', token?.substring(0, 50) + '...');
    console.log('🌐 Server URL:', serverURL);

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    setTimeout(() => {
      addChatMessage('system', `${teacher} is hosting the class`);
    }, 3000);

    setTimeout(() => {
      setLoading(false);
    }, 5000);

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
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.sendChatMessage) {
          window.sendChatMessage('${participantName}', '${chatInput.trim()}');
        }
      `);
    }
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
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.toggleHandRaise) {
          window.toggleHandRaise(${!isHandRaised});
        }
      `);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.toggleMute) {
          window.toggleMute(${!isMuted});
        }
      `);
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.toggleVideo) {
          window.toggleVideo(${!isVideoOff});
        }
      `);
    }
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

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Message from WebView:', data);
      
      if (data.type === 'participant_joined') {
        setParticipantCount(prev => prev + 1);
        addChatMessage('system', `${data.name} joined the call`);
      } else if (data.type === 'participant_left') {
        setParticipantCount(prev => Math.max(1, prev - 1));
        addChatMessage('system', `${data.name} left the call`);
      } else if (data.type === 'chat_message') {
        addChatMessage(data.sender, data.message);
      } else if (data.type === 'connected') {
        setIsConnected(true);
        setLoading(false);
        addChatMessage('system', '🎉 You joined the call!');
      } else if (data.type === 'error') {
        Alert.alert('Connection Error', data.message || 'Failed to connect');
        setLoading(false);
      } else if (data.type === 'participant_count') {
        setParticipantCount(data.count);
      } else if (data.type === 'log') {
        console.log('WebView log:', data.message);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
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

  const getLiveKitHTML = () => {
    const escapedToken = token.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>LiveKit Call</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              background: #0a0a0a; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              height: 100vh;
              overflow: hidden;
              color: #fff;
            }
            #container {
              display: flex;
              flex-direction: column;
              height: 100vh;
              background: #0a0a0a;
            }
            #header {
              background: #1a1a1a;
              padding: 10px 16px;
              text-align: center;
              border-bottom: 1px solid #333;
            }
            #header h1 {
              color: #fff;
              font-size: 16px;
              font-weight: 600;
              margin: 0;
            }
            #video-grid {
              flex: 1;
              display: flex;
              flex-wrap: wrap;
              padding: 8px;
              gap: 8px;
              align-content: flex-start;
              overflow-y: auto;
              position: relative;
            }
            .video-box {
              flex: 1;
              min-width: calc(50% - 4px);
              min-height: 150px;
              background: #1a1a1a;
              border-radius: 12px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              position: relative;
              border: 2px solid #333;
              aspect-ratio: 4/3;
            }
            .video-box.active {
              border-color: #4F46E5;
            }
            .video-box .avatar {
              width: 50px;
              height: 50px;
              border-radius: 25px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 20px;
              color: #fff;
              font-weight: bold;
              margin-bottom: 6px;
            }
            .video-box .name {
              color: #fff;
              font-size: 13px;
              font-weight: 500;
            }
            .video-box .status {
              color: #4CAF50;
              font-size: 11px;
              margin-top: 2px;
            }
            .video-box .label {
              position: absolute;
              bottom: 8px;
              left: 8px;
              background: rgba(0,0,0,0.7);
              padding: 2px 10px;
              border-radius: 4px;
              color: #fff;
              font-size: 10px;
            }
            .video-box .hand-raise {
              position: absolute;
              top: 8px;
              right: 8px;
              font-size: 20px;
            }
            #status-bar {
              background: rgba(0,0,0,0.8);
              padding: 8px 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid #333;
            }
            #status-bar .live {
              color: #FF4444;
              font-size: 13px;
              font-weight: 600;
            }
            #status-bar .duration {
              color: #4CAF50;
              font-size: 13px;
              font-weight: 500;
            }
            #status-bar .participants {
              color: #999;
              font-size: 13px;
            }
            .connecting-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0,0,0,0.8);
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              z-index: 100;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 4px solid #333;
              border-top: 4px solid #4F46E5;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .connecting-text {
              color: #fff;
              margin-top: 16px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div id="container">
            <div id="header">
              <h1>${title || 'Live Class'}</h1>
            </div>
            <div id="video-grid" style="position:relative;">
              <div class="video-box active" id="local-video">
                <div class="avatar" style="background:#4F46E5;">${participantName?.charAt(0).toUpperCase() || 'U'}</div>
                <div class="name">${participantName || 'You'}</div>
                <div class="status" id="local-status">● Connecting...</div>
                <div class="label">You</div>
                <div class="hand-raise" id="hand-raise-indicator" style="display:none;">🙋</div>
              </div>
              <div class="video-box" id="remote-video">
                <div class="avatar" style="background:#6B7280;">${teacher?.charAt(0).toUpperCase() || 'T'}</div>
                <div class="name">${teacher || 'Teacher'}</div>
                <div class="status" id="teacher-status">● Waiting...</div>
                <div class="label">Teacher</div>
              </div>
              <div class="connecting-overlay" id="connecting-overlay">
                <div class="spinner"></div>
                <div class="connecting-text" id="connecting-text">Connecting to LiveKit...</div>
              </div>
            </div>
            <div id="status-bar">
              <span class="live" id="live-status">🔴 Connecting...</span>
              <span class="duration" id="duration-display">⏱ 00:00</span>
              <span class="participants">👥 <span id="participant-count">1</span></span>
            </div>
          </div>

          <!-- Load LiveKit from CDN -->
          <script src="https://cdn.jsdelivr.net/npm/livekit-client@1.15.0/dist/livekit-client.umd.min.js"></script>
          
          <script>
            // Configuration
            const config = {
              roomName: '${roomName}',
              token: '${escapedToken}',
              serverURL: '${serverURL}',
              participantName: '${participantName}'
            };

            function sendMessageToRN(data) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
              }
            }

            function sendLog(message) {
              console.log('[WebView]', message);
              sendMessageToRN({ type: 'log', message: message });
            }

            let room = null;
            let localParticipant = null;
            let isConnected = false;
            let seconds = 0;
            let durationInterval = null;
            let participantCount = 1;

            // Poll for LiveKitClient
            let attempts = 0;
            const maxAttempts = 30;

            function checkLiveKit() {
              attempts++;
              sendLog('Checking for LiveKitClient (attempt ' + attempts + '/' + maxAttempts + ')');
              
              if (typeof LiveKitClient !== 'undefined') {
                sendLog('✅ LiveKitClient found!');
                startLiveKit(LiveKitClient);
              } else if (window.LiveKitClient) {
                sendLog('✅ LiveKitClient found on window!');
                startLiveKit(window.LiveKitClient);
              } else if (attempts < maxAttempts) {
                sendLog('⏳ LiveKitClient not ready, retrying...');
                setTimeout(checkLiveKit, 500);
              } else {
                sendLog('❌ LiveKitClient not found after ' + maxAttempts + ' attempts');
                document.getElementById('connecting-text').textContent = '⚠️ SDK Load Failed';
                document.getElementById('connecting-overlay').style.display = 'none';
                sendMessageToRN({ type: 'error', message: 'LiveKit SDK not available' });
              }
            }

            function startLiveKit(LiveKitClient) {
              try {
                sendLog('🚀 Starting LiveKit...');
                sendLog('Room: ' + config.roomName);
                sendLog('Server: ' + config.serverURL);

                room = new LiveKitClient.Room({
                  adaptiveStream: true,
                  dynacast: true,
                });

                room.on('participantConnected', (participant) => {
                  sendLog('👤 Participant connected: ' + participant.identity);
                  participantCount++;
                  document.getElementById('participant-count').textContent = participantCount;
                  sendMessageToRN({
                    type: 'participant_joined',
                    name: participant.name || participant.identity
                  });
                });

                room.on('participantDisconnected', (participant) => {
                  sendLog('👤 Participant disconnected: ' + participant.identity);
                  participantCount = Math.max(1, participantCount - 1);
                  document.getElementById('participant-count').textContent = participantCount;
                  sendMessageToRN({
                    type: 'participant_left',
                    name: participant.name || participant.identity
                  });
                });

                room.on('connected', () => {
                  sendLog('✅ Connected to LiveKit room!');
                  isConnected = true;
                  document.getElementById('live-status').textContent = '🔴 Live';
                  document.getElementById('live-status').style.color = '#FF4444';
                  document.getElementById('local-status').textContent = '● Connected';
                  document.getElementById('local-status').style.color = '#4CAF50';
                  document.getElementById('connecting-overlay').style.display = 'none';
                  sendMessageToRN({ type: 'connected' });
                  sendMessageToRN({ type: 'participant_count', count: participantCount });
                  
                  durationInterval = setInterval(() => {
                    seconds++;
                    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
                    const secs = String(seconds % 60).padStart(2, '0');
                    document.getElementById('duration-display').textContent = '⏱ ' + mins + ':' + secs;
                  }, 1000);
                });

                room.on('disconnected', () => {
                  sendLog('Disconnected from room');
                  isConnected = false;
                  document.getElementById('live-status').textContent = '🔴 Disconnected';
                  document.getElementById('live-status').style.color = '#666';
                  if (durationInterval) {
                    clearInterval(durationInterval);
                  }
                });

                // Connect
                sendLog('Connecting with token...');
                room.connect(config.serverURL, config.token)
                  .then(() => {
                    localParticipant = room.localParticipant;
                    sendLog('✅ Connected successfully!');
                    sendMessageToRN({ type: 'connected' });
                  })
                  .catch((error) => {
                    sendLog('❌ Connection error: ' + error.message);
                    document.getElementById('live-status').textContent = '⚠️ Failed';
                    document.getElementById('connecting-overlay').style.display = 'none';
                    sendMessageToRN({
                      type: 'error',
                      message: error.message || 'Failed to connect'
                    });
                  });

                // Expose functions for RN to call
                window.toggleMute = function(muted) {
                  if (localParticipant) {
                    localParticipant.setMicrophoneEnabled(!muted);
                    sendLog('Microphone: ' + (muted ? 'Muted' : 'Unmuted'));
                  }
                };

                window.toggleVideo = function(off) {
                  if (localParticipant) {
                    localParticipant.setCameraEnabled(!off);
                    sendLog('Camera: ' + (off ? 'Off' : 'On'));
                  }
                };

                window.toggleHandRaise = function(raised) {
                  const indicator = document.getElementById('hand-raise-indicator');
                  if (indicator) {
                    indicator.style.display = raised ? 'block' : 'none';
                  }
                  sendLog('Hand raise: ' + (raised ? 'Raised' : 'Lowered'));
                };

                window.sendChatMessage = function(sender, message) {
                  sendMessageToRN({
                    type: 'chat_message',
                    sender: sender,
                    message: message
                  });
                  sendLog('Chat from ' + sender + ': ' + message);
                };

              } catch (error) {
                sendLog('❌ Initialization error: ' + error.message);
                document.getElementById('live-status').textContent = '⚠️ Error';
                document.getElementById('connecting-overlay').style.display = 'none';
                sendMessageToRN({
                  type: 'error',
                  message: error.message || 'Failed to initialize'
                });
              }
            }

            // Start checking for LiveKit
            sendLog('Starting LiveKit check...');
            setTimeout(checkLiveKit, 1000);

            // Send initial participant count
            setTimeout(() => {
              document.getElementById('participant-count').textContent = '1';
              sendMessageToRN({ type: 'participant_count', count: 1 });
            }, 1000);
          </script>
        </body>
      </html>
    `;
  };

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

      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: getLiveKitHTML() }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onLoadStart={() => console.log('WebView loading...')}
          onLoadEnd={() => console.log('WebView loaded')}
          onError={(error) => {
            console.error('WebView error:', error);
            Alert.alert('Error', 'Failed to load video call');
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

      <View style={styles.controlsOverlay}>
        <View style={styles.callInfoBar}>
          <Text style={styles.callInfoTitle}>{title || 'Live Class'}</Text>
          <Text style={styles.callInfoDuration}>⏱ {formatDuration(callDuration)}</Text>
          <Text style={styles.callInfoParticipants}>👥 {participantCount}</Text>
        </View>

        <View style={[styles.controlsContainer, !showControls && styles.controlsHidden]}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
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
              onPress={toggleVideo}
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
              <Text style={styles.controlButtonText}>{participantCount}</Text>
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

      <TouchableOpacity style={styles.toggleControlsButton} onPress={toggleControls}>
        <Icon name={showControls ? 'chevron-down' : 'chevron-up'} size={20} color="#FFFFFF" />
      </TouchableOpacity>

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

      <Modal
        animationType="slide"
        transparent={true}
        visible={showParticipants}
        onRequestClose={() => setShowParticipants(false)}
      >
        <View style={styles.participantsModalContainer}>
          <View style={styles.participantsModalContent}>
            <View style={styles.participantsHeader}>
              <Text style={styles.participantsHeaderTitle}>Participants ({participantCount})</Text>
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
                  <Text style={styles.participantListStatus}>
                    {isConnected ? '🔵 Connected' : 'Connecting...'}
                  </Text>
                </View>
                {isHandRaised && <Text style={styles.handRaisedBadge}>🙋</Text>}
              </View>
              <View style={styles.participantListItem}>
                <View style={styles.participantListAvatar}>
                  <Text style={styles.participantListAvatarText}>
                    {teacher?.charAt(0).toUpperCase() || 'T'}
                  </Text>
                </View>
                <View style={styles.participantListInfo}>
                  <Text style={styles.participantListName}>{teacher}</Text>
                  <Text style={styles.participantListStatus}>🔴 Online</Text>
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