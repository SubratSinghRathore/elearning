// pages/VideoCall.tsx - Full featured LiveKit video call
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  StatusBar,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  Room,
  RoomEvent,
  Participant,
  Track,
  RemoteParticipant,
  LocalParticipant,
  TrackPublication,
} from 'livekit-client';
import { VideoTrack as LKVideoTrack, AudioSession } from '@livekit/react-native';

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

// Minimal shape @livekit/react-native's <VideoTrack /> needs to render a tile.
interface VideoTrackInfo {
  participant: Participant;
  publication: TrackPublication;
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

  const [status, setStatus] = useState('Connecting...');
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Actual renderable video tracks, keyed by participant identity.
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<Record<string, VideoTrackInfo>>({});
  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrackInfo | null>(null);

  const [room] = useState(() => new Room());

  // Room event listeners
  useEffect(() => {
    // Required on React Native: sets up the audio session (speaker/earpiece routing, etc).
    AudioSession.startAudioSession();

    room.on(RoomEvent.Connected, async () => {
      setStatus('Connected');
      setIsConnected(true);
      setLoading(false);

      const local = room.localParticipant;
      setParticipants([local]);
      setParticipantCount(1);


      try {
        await local.setCameraEnabled(true);
        await local.setMicrophoneEnabled(true);
      } catch (e) {
        console.log('Failed to enable camera/mic:', e);
      }
    });

    room.on(RoomEvent.Disconnected, () => {
      setStatus('Disconnected');
      setIsConnected(false);
      setLoading(false);
    });

    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      setStatus(state);
    });

    room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      setParticipants((prev) => [...prev, participant]);
      setParticipantCount((prev) => prev + 1);
      addChatMessage('system', `${participant.name || participant.identity} joined the call`, true);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      setParticipants((prev) => prev.filter((p) => p.identity !== participant.identity));
      setParticipantCount((prev) => Math.max(1, prev - 1));
      setRemoteVideoTracks((prev) => {
        const next = { ...prev };
        delete next[participant.identity];
        return next;
      });
      addChatMessage('system', `${participant.name || participant.identity} left the call`, true);
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Video && publication.source === Track.Source.Camera) {
        setRemoteVideoTracks((prev) => ({
          ...prev,
          [participant.identity]: { participant, publication },
        }));
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Video && publication.source === Track.Source.Camera) {
        setRemoteVideoTracks((prev) => {
          const next = { ...prev };
          delete next[participant.identity];
          return next;
        });
      }
    });

    room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
      if (publication.source === Track.Source.Camera) {
        setLocalVideoTrack({ participant, publication });
      }
    });

    room.on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
      if (publication.source === Track.Source.Camera) {
        setLocalVideoTrack(null);
      }
    });

    connectRoom();

    return () => {
      room.disconnect();
      AudioSession.stopAudioSession();
    };
  }, []);

  const connectRoom = async () => {
    try {
      await room.connect(serverURL, token);
    } catch (e) {
      console.log(e);
      setConnectionError('Unable to connect');
      setLoading(false);
      Alert.alert('Error', 'Unable to connect to the call');
    }
  };

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

  const toggleMute = async () => {
    if (room.localParticipant) {
      await room.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (room.localParticipant) {
      await room.localParticipant.setCameraEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    const message = !isHandRaised ? '🙋 Raised hand' : 'Lowered hand';
    addChatMessage('system', `${participantName}: ${message}`, true);
  };

  const leaveRoom = () => {
    Alert.alert('End Call', 'Are you sure you want to leave the call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          room.disconnect();
          navigation.navigate('BottomTabs');
        },
      },
    ]);
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

  const renderParticipantItem = (participant: Participant) => {
    const isLocal = participant.identity === room.localParticipant?.identity;
    return (
      <View key={participant.identity} style={styles.participantListItem}>
        <View style={[styles.participantListAvatar, isLocal && styles.participantListAvatarLocal]}>
          <Text style={styles.participantListAvatarText}>
            {(participant.name || participant.identity)?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.participantListInfo}>
          <Text style={[styles.participantListName, isLocal && styles.participantListNameLocal]}>
            {participant.name || participant.identity} {isLocal ? '(You)' : ''}
          </Text>
          <Text style={styles.participantListStatus}>
            {participant.isSpeaking ? '🔴 Speaking' : 'Connected'}
          </Text>
        </View>
        {isLocal && isHandRaised && <Text style={styles.handRaisedBadge}>🙋</Text>}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Connecting to call...</Text>
          <Text style={styles.loadingSubText}>Please wait</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (connectionError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={60} color="#EF4444" />
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorText}>{connectionError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={connectRoom}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const remoteParticipants = participants.filter(
    (p) => p.identity !== room.localParticipant?.identity
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      {/* Video Grid */}
      <View style={styles.videoGrid}>
        {/* Remote Participants */}
        <ScrollView style={styles.remoteParticipantsContainer}>
          {remoteParticipants.length > 0 ? (
            remoteParticipants.map((participant) => {
              const videoInfo = remoteVideoTracks[participant.identity];
              return (
                <View key={participant.identity} style={styles.remoteParticipantWrapper}>
                  {videoInfo ? (
                    <LKVideoTrack
                      trackRef={{
                        participant: videoInfo.participant,
                        publication: videoInfo.publication,
                        source: Track.Source.Camera,
                      }}
                      style={styles.remoteVideoView}
                      objectFit="cover"
                    />
                  ) : (
                    <View style={styles.remoteVideoPlaceholder}>
                      <Text style={styles.remoteAvatarText}>
                        {(participant.name || participant.identity)?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                      <Text style={styles.remoteNameText}>
                        {participant.name || participant.identity}
                      </Text>
                    </View>
                  )}
                  {participant.isSpeaking && <View style={styles.speakingIndicator} />}
                </View>
              );
            })
          ) : (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.waitingText}>Waiting for others to join...</Text>
            </View>
          )}
        </ScrollView>

        {/* Local Participant (small overlay) */}
        <View style={styles.localVideoContainer}>
          {localVideoTrack && !isVideoOff ? (
            <LKVideoTrack
              trackRef={{
                participant: localVideoTrack.participant,
                publication: localVideoTrack.publication,
                source: Track.Source.Camera,
              }}
              style={styles.localVideoView}
              objectFit="cover"
              mirror
            />
          ) : (
            <View style={styles.localVideoPlaceholder}>
              <Text style={styles.localAvatarText}>
                {participantName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.localInfoRow}>
            <Text style={styles.localNameText}>You</Text>
            {isMuted && <Icon name="mic-off" size={12} color="#FF4444" />}
            {isHandRaised && <Text style={styles.handRaisedIndicator}>🙋</Text>}
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controlsContainer, !showControls && styles.controlsHidden]}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Icon name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#FF4444' : '#FFFFFF'} />
            <Text style={styles.controlButtonText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
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
            <Text style={styles.controlButtonText}>{isVideoOff ? 'Video On' : 'Video Off'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isHandRaised && styles.controlButtonActive]}
            onPress={toggleHandRaise}
          >
            <Icon name="upload" size={22} color={isHandRaised ? '#FFD700' : '#FFFFFF'} />
            <Text style={styles.controlButtonText}>{isHandRaised ? 'Lower' : 'Raise'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => setShowChat(true)}>
            <Icon name="message-square" size={22} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Chat</Text>
            {chatMessages.length > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{chatMessages.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => setShowParticipants(true)}>
            <Icon name="users" size={22} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>{participantCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={leaveRoom}>
            <Icon name="phone-off" size={22} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Modal */}
      <Modal animationType="slide" transparent visible={showChat} onRequestClose={() => setShowChat(false)}>
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
                  placeholderTextColor="#666"
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
        transparent
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
            <ScrollView style={styles.participantsList}>{participants.map(renderParticipantItem)}</ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginTop: 20 },
  loadingSubText: { fontSize: 14, color: '#666', marginTop: 8 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginTop: 16 },
  errorText: { fontSize: 14, color: '#666', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  retryButton: { backgroundColor: '#4F46E5', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12, marginBottom: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  goBackButton: { paddingHorizontal: 40, paddingVertical: 12 },
  goBackButtonText: { color: '#6B7280', fontSize: 16 },
  videoGrid: { flex: 1, padding: 8, position: 'relative' },
  remoteParticipantsContainer: { flex: 1 },
  remoteParticipantWrapper: {
    width: '100%',
    height: 200,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideoView: { width: '100%', height: '100%' },
  remoteVideoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  remoteAvatarText: { fontSize: 40, fontWeight: '700', color: '#4F46E5' },
  remoteNameText: { color: '#FFFFFF', fontSize: 14, marginTop: 8 },
  speakingIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  localVideoContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 120,
    height: 160,
    zIndex: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4F46E5',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoView: { width: '100%', height: '100%', position: 'absolute' },
  localVideoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  localAvatarText: { fontSize: 30, fontWeight: '700', color: '#4F46E5' },
  localInfoRow: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  localNameText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  handRaisedIndicator: { fontSize: 14 },
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  waitingText: { color: '#666', fontSize: 16, marginTop: 16 },
  controlsContainer: { backgroundColor: 'rgba(0,0,0,0.85)', paddingBottom: Platform.OS === 'ios' ? 34 : 16, paddingTop: 12 },
  controlsHidden: { display: 'none' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 8 },
  controlButton: { alignItems: 'center', justifyContent: 'center', padding: 6, position: 'relative' },
  controlButtonActive: { opacity: 0.8 },
  controlButtonText: { color: '#FFFFFF', fontSize: 9, marginTop: 2 },
  endCallButton: { backgroundColor: '#EF4444', borderRadius: 30, width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
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
  chatBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  chatModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  chatModalContent: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: height * 0.6 },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatHeaderTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  chatMessagesList: { padding: 16, flexGrow: 1 },
  chatMessageContainer: { marginBottom: 8, alignItems: 'flex-start' },
  chatMessageOwn: { alignItems: 'flex-end' },
  chatMessageBubble: { backgroundColor: '#2A2A2A', padding: 10, borderRadius: 12, maxWidth: '80%' },
  chatMessageBubbleOwn: { backgroundColor: '#4F46E5' },
  chatMessageSender: { color: '#818CF8', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  chatMessageText: { color: '#FFFFFF', fontSize: 14 },
  chatSystemMessage: { color: '#666', fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  chatMessageTime: { color: '#666', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  chatInputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1A1A1A' },
  chatInput: { flex: 1, backgroundColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, color: '#FFFFFF', fontSize: 14, marginRight: 8 },
  chatSendButton: { backgroundColor: '#4F46E5', borderRadius: 25, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  participantsModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  participantsModalContent: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: height * 0.5 },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  participantsHeaderTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  participantsList: { padding: 16 },
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
  participantListAvatarLocal: { backgroundColor: '#4F46E5' },
  participantListAvatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  participantListInfo: { flex: 1 },
  participantListName: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  participantListNameLocal: { color: '#818CF8' },
  participantListStatus: { color: '#4CAF50', fontSize: 12 },
  handRaisedBadge: { fontSize: 20, marginLeft: 8 },
});

export default VideoCall;