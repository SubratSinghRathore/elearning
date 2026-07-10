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
import Orientation from 'react-native-orientation-locker';
import SystemNavigationBar from 'react-native-system-navigation-bar';
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
import { Buffer } from "buffer";

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
  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenParticipantId, setFullscreenParticipantId] = useState<string | null>(null);

  // Actual renderable video tracks, keyed by participant identity.
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<Record<string, VideoTrackInfo>>({});
  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrackInfo | null>(null);

  const [room] = useState(() => new Room());

  const hideNavigationBar = async () => {
    if (Platform.OS === 'android') {
      try {
        await SystemNavigationBar.hide();
        StatusBar.setHidden(true);
      } catch (error) {
        console.log('Error hiding navigation bar:', error);
        StatusBar.setHidden(true);
      }
    } else if (Platform.OS === 'ios') {
      StatusBar.setHidden(true);
    }
  };

  const showNavigationBar = async () => {
    if (Platform.OS === 'android') {
      try {
        await SystemNavigationBar.show();
        StatusBar.setHidden(false);
      } catch (error) {
        console.log('Error showing navigation bar:', error);
        StatusBar.setHidden(false);
      }
    } else if (Platform.OS === 'ios') {
      StatusBar.setHidden(false);
    }
  };

  // Room event listeners
  useEffect(() => {
    // Required on React Native: sets up the audio session (speaker/earpiece routing, etc).
    AudioSession.startAudioSession();

    // Lock orientation to portrait when component mounts
    Orientation.lockToPortrait();

    room.on(RoomEvent.Connected, async () => {
      setStatus('Connected');
      setIsConnected(true);
      setLoading(false);

      const local = room.localParticipant;
      setParticipants([local]);
      setParticipantCount(1);

      try {
        await local.setCameraEnabled(video);
        await local.setMicrophoneEnabled(mic);

        // Add existing remote participants
        const remotes = Array.from(room.remoteParticipants.values());

        setParticipants([room.localParticipant, ...remotes]);
        setParticipantCount(remotes.length + 1);

        for (const participant of remotes) {
          console.log("Existing participant:", participant.identity);

          participant.trackPublications.forEach((publication) => {
            if (
              publication.kind === Track.Kind.Video &&
              publication.source === Track.Source.Camera &&
              publication.track
            ) {
              setRemoteVideoTracks(prev => ({
                ...prev,
                [participant.identity]: {
                  participant,
                  publication,
                },
              }));
            }
          });
        }
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

    room.on(RoomEvent.DataReceived, (payload, participant) => {
      const jsonString = Buffer.from(payload).toString("utf8");
      console.log(jsonString);
      const data = JSON.parse(jsonString);

      const myId = room.localParticipant.identity;
      const senderId = participant?.identity;

      switch (data.type) {
        case "toggle-mic":
          if (myId === data.targetId) {
            if (data.enabled) {
              onMic();
            } else if (!data.enabled) {
              offMic();
            }
          }
          break;
        case "toggle-video":
          if (myId === data.targetId) {
            if (data.enabled) {
              onVideo();
            } else if (!data.enabled) {
              offVideo();
            }
          }
          break;
        case "message":
          addChatMessage(data.senderName, data.content.trim());
          break
        default:
          break;
      }
    });

    connectRoom();

    return () => {
      room.disconnect();
      AudioSession.stopAudioSession();
      // Unlock orientation when component unmounts
      Orientation.unlockAllOrientations();
      showNavigationBar();
    };
  }, []);

//   const toggleScreenShare = async () => {
//   try {
//     if (room.localParticipant.isScreenShareEnabled) {
//       await room.localParticipant.setScreenShareEnabled(false);
//     } else {
//       await ScreenCapture.startCapture(); // Android permission dialog
//       await room.localParticipant.setScreenShareEnabled(true);
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
// toggleScreenShare();

  useEffect(() => {
    // Handle orientation changes
    const handleOrientation = (orientation: string) => {
      if (orientation.includes('LANDSCAPE') && !isFullscreen) {
        setIsFullscreen(true);
        hideNavigationBar();
      } else if (orientation.includes('PORTRAIT') && isFullscreen) {
        setIsFullscreen(false);
        setFullscreenParticipantId(null);
        showNavigationBar();
      }
    };

    // Add the listener
    Orientation.addOrientationListener(handleOrientation);

    // Cleanup - remove the listener
    return () => {
      Orientation.removeOrientationListener(handleOrientation);
    };
  }, [isFullscreen]);

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

  const addChatMessage = async (sender: string, message: string, isSystem = false) => {
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

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const messageJson = {
      id: "32b1fc1f-c70c-47b5-926a-99406b507056",// need random
      senderId: room.localParticipant.identity,
      senderName: participantName,
      content: chatInput,
      timestamp: Date.now(),
      type: "message",
    };

    await room.localParticipant.publishData(
      Buffer.from(JSON.stringify(messageJson), "utf8"),
      { reliable: true }
    );
    addChatMessage(participantName || 'You', chatInput.trim());
    setChatInput('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onMic = async () => {
    setMic(true);
    await room.localParticipant.setMicrophoneEnabled(true);
  }

  const offMic = async () => {
    setMic(false);
    await room.localParticipant.setMicrophoneEnabled(false);
  }

  const onVideo = async () => {
    setVideo(true);
    await room.localParticipant.setCameraEnabled(true);
  }
  const offVideo = async () => {
    await room.localParticipant.setCameraEnabled(false);
    setVideo(false);
  }

  const toggleHandRaise = async () => {
    if (!room.localParticipant) return;

    const newState = !isHandRaised;

    try {
      // Update LiveKit attributes
      await room.localParticipant.setAttributes({
        handRaised: String(newState),
      });

      // Update local UI
      setIsHandRaised(newState);

      addChatMessage(
        'system',
        `${participantName} ${newState ? 'raised' : 'lowered'} hand`,
        true,
      );

      console.log(
        'My Attributes:',
        room.localParticipant.attributes
      );
    } catch (err) {
      console.log('Failed to update hand status', err);
    }
  };

  const leaveRoom = () => {
    Alert.alert('End Call', 'Are you sure you want to leave the call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          room.disconnect();
          // Unlock orientation before navigating back
          Orientation.unlockAllOrientations();
          showNavigationBar();
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

  const toggleFullscreen = (participantId?: string) => {
    if (!isFullscreen) {
      // Enter fullscreen - landscape mode
      Orientation.lockToLandscape();
      hideNavigationBar();
      setFullscreenParticipantId(participantId || null);
      setIsFullscreen(true);
    } else {
      // Exit fullscreen - portrait mode
      Orientation.lockToPortrait();
      showNavigationBar();
      setFullscreenParticipantId(null);
      setIsFullscreen(false);
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

  // Get the participant that is in fullscreen
  const fullscreenParticipant = fullscreenParticipantId
    ? participants.find(p => p.identity === fullscreenParticipantId)
    : null;

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar barStyle="light-content" backgroundColor="#111" hidden={isFullscreen} />

      {/* Video Grid */}
      <View style={[styles.videoGrid, isFullscreen && styles.fullscreenVideoGrid]}>
        {/* Top bar with participant name - shown on ALL screens */}
        {!isFullscreen && (
          <View style={styles.topBar}>
            <View style={styles.participantInfo}>
              <Text style={styles.participantNameText}>
                {participantName || 'Unknown'}
              </Text>
              <Text style={styles.participantRoleText}>
                {participantRole || 'Participant'} • {subject || 'Class'}
              </Text>
            </View>
            <View style={styles.topBarBadges}>
              {isConnected && (
                <View style={styles.connectionBadge}>
                  <View style={styles.connectionDot} />
                  <Text style={styles.connectionText}>Connected</Text>
                </View>
              )}
              <Text style={styles.participantCountText}>
                {participantCount}
              </Text>
            </View>
          </View>
        )}

        {/* If in fullscreen, show only the fullscreen participant */}
        {isFullscreen && fullscreenParticipant ? (
          <View style={styles.fullscreenVideoContainer}>
            {(() => {
              const videoInfo = remoteVideoTracks[fullscreenParticipant.identity] ||
                (fullscreenParticipant.identity === room.localParticipant?.identity ? localVideoTrack : null);
              const isLocal = fullscreenParticipant.identity === room.localParticipant?.identity;

              return videoInfo ? (
                <LKVideoTrack
                  trackRef={{
                    participant: videoInfo.participant,
                    publication: videoInfo.publication,
                    source: Track.Source.Camera,
                  }}
                  style={styles.fullscreenVideoView}
                  objectFit="cover"
                  mirror={isLocal}
                />
              ) : (
                <View style={styles.fullscreenPlaceholder}>
                  <Text style={styles.fullscreenAvatarText}>
                    {(fullscreenParticipant.name || fullscreenParticipant.identity)?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                  <Text style={styles.fullscreenNameText}>
                    {fullscreenParticipant.name || fullscreenParticipant.identity}
                  </Text>
                </View>
              );
            })()}

            {/* Exit fullscreen button */}
            <TouchableOpacity
              style={styles.exitFullscreenButton}
              onPress={() => toggleFullscreen()}
            >
              <Icon name="minimize-2" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Participant name in fullscreen */}
            <View style={styles.fullscreenNameOverlay}>
              <Text style={styles.fullscreenNameOverlayText}>
                {fullscreenParticipant.name || fullscreenParticipant.identity}
                {fullscreenParticipant.identity === room.localParticipant?.identity ? ' (You)' : ''}
              </Text>
            </View>
          </View>
        ) : (
          /* Remote Participants - Normal view */
          <ScrollView
            style={styles.remoteParticipantsContainer}
          >
            {remoteParticipants.length > 0 ? (
              remoteParticipants.map((participant) => {
                const videoInfo = remoteVideoTracks[participant.identity];
                return (
                  <View
                    key={participant.identity}
                    style={styles.remoteParticipantWrapper}
                  >
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

                    {/* Participant name overlay */}
                    <View style={styles.remoteNameOverlay}>
                      <Text style={styles.remoteNameOverlayText}>
                        {participant.name || participant.identity}
                      </Text>
                    </View>

                    {/* Fullscreen button on each video tile */}
                    <TouchableOpacity
                      style={styles.videoFullscreenButton}
                      onPress={() => toggleFullscreen(participant.identity)}
                    >
                      <Icon name="maximize-2" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
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
        )}

        {/* Local Participant (small overlay) - Only show in normal view */}
        {!isFullscreen && (
          <View style={styles.localVideoContainer}>
            {localVideoTrack && video ? (
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
              {mic && <Icon name="mic" size={12} color="#FF4444" />}
              {isHandRaised && <Text style={styles.handRaisedIndicator}>🙋</Text>}
            </View>

            {/* Fullscreen button on local video */}
            <TouchableOpacity
              style={styles.localFullscreenButton}
              onPress={() => toggleFullscreen(room.localParticipant?.identity)}
            >
              <Icon name="maximize-2" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls - Hidden in fullscreen */}
      {!isFullscreen && (
        <View style={[styles.controlsContainer, !showControls && styles.controlsHidden]}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, !mic && styles.controlButtonActive]}
            // onPress={toggleMute}
            >
              <Icon name={!mic ? 'mic-off' : 'mic'} size={22} color={'#FFFFFF'} />
              <Text style={styles.controlButtonText}>{!mic ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, !video && styles.controlButtonActive]}
            // onPress={toggleVideo}
            >
              <Icon
                name={!video ? 'video-off' : 'video'}
                size={22}
                color={'#FFFFFF'}
              />
              <Text style={styles.controlButtonText}>{video ? 'Video On' : 'Video Off'}</Text>
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
      )}

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
  fullscreenContainer: {
    backgroundColor: '#000',
  },
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

  // Top bar styles
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    marginBottom: 8,
    zIndex: 5,
  },
  participantInfo: {
    flexDirection: 'column',
  },
  participantNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  participantRoleText: {
    color: '#818CF8',
    fontSize: 12,
    marginTop: 2,
  },
  topBarBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  connectionText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '500',
  },
  participantCountText: {
    color: '#9CA3AF',
    fontSize: 12,
  },

  videoGrid: {
    flex: 1,
    padding: 8,
    position: 'relative',
  },
  fullscreenVideoGrid: {
    padding: 0,
    backgroundColor: '#000',
  },
  remoteParticipantsContainer: {
    flex: 1,
  },
  remoteParticipantWrapper: {
    width: '100%',
    height: 200,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  remoteVideoView: {
    width: '100%',
    height: '100%',
  },
  remoteVideoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  remoteAvatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#4F46E5'
  },
  remoteNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  remoteNameOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  remoteNameOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
  },

  // Video fullscreen button on each tile
  videoFullscreenButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Fullscreen video container
  fullscreenVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenVideoView: {
    width: '100%',
    height: '100%',
  },
  fullscreenPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    width: '100%',
    height: '100%',
  },
  fullscreenAvatarText: {
    fontSize: 80,
    fontWeight: '700',
    color: '#4F46E5',
  },
  fullscreenNameText: {
    color: '#FFFFFF',
    fontSize: 24,
    marginTop: 16,
  },
  fullscreenNameOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  fullscreenNameOverlayText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Exit fullscreen button
  exitFullscreenButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
  localVideoView: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  localVideoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  localAvatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#4F46E5'
  },
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

  // Local fullscreen button
  localFullscreenButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  waitingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16
  },
  controlsContainer: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingTop: 12
  },
  controlsHidden: { display: 'none' },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative'
  },
  controlButtonActive: { opacity: 0.8 },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2
  },
  endCallButton: {
    backgroundColor: '#EF4444',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
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
    fontWeight: '700'
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  chatModalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.6
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
    fontWeight: '600'
  },
  chatMessagesList: {
    padding: 16,
    flexGrow: 1
  },
  chatMessageContainer: {
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  chatMessageOwn: {
    alignItems: 'flex-end'
  },
  chatMessageBubble: {
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 12,
    maxWidth: '80%'
  },
  chatMessageBubbleOwn: {
    backgroundColor: '#4F46E5'
  },
  chatMessageSender: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2
  },
  chatMessageText: {
    color: '#FFFFFF',
    fontSize: 14
  },
  chatSystemMessage: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  chatMessageTime: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end'
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1A1A1A'
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 8
  },
  chatSendButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  participantsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  participantsModalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.5
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
    fontWeight: '600'
  },
  participantsList: {
    padding: 16
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
  participantListAvatarLocal: { backgroundColor: '#4F46E5' },
  participantListAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600'
  },
  participantListInfo: { flex: 1 },
  participantListName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500'
  },
  participantListNameLocal: {
    color: '#818CF8'
  },
  participantListStatus: {
    color: '#4CAF50',
    fontSize: 12
  },
  handRaisedBadge: {
    fontSize: 20,
    marginLeft: 8
  },
});

export default VideoCall;