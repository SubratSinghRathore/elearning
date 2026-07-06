// pages/JoinLive.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const { width, height } = Dimensions.get('window');

interface JoinLiveProps {
  navigation: any;
  route: {
    params: {
      sessionId: string;
      roomName: string;
      title: string;
      teacher: string;
      subject: string;
      batch: string;
    };
  };
}

interface JoinResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    liveClass: {
      id: string;
      roomName: string;
      participantName: string;
      participantId: string;
      participantRole: string;
    };
    liveKit: {
      token: string;
      roomName: string;
      serverURL: string;
    };
  };
}

const JoinLive: React.FC<JoinLiveProps> = ({ navigation, route }) => {
  const { sessionId, roomName, title, teacher, subject, batch } = route.params || {};
  
  console.log('🔍 JoinLive - sessionId:', sessionId);
  console.log('🔍 JoinLive - roomName:', roomName);
  
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinData, setJoinData] = useState<JoinResponse['data'] | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!roomName) {
      Alert.alert('Error', 'No room name provided', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      setLoading(false);
      return;
    }
    fetchJoinToken();
  }, [roomName]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (joinData && !joining && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && joinData && !joining) {
      handleJoinSession();
    }
    return () => clearTimeout(timer);
  }, [countdown, joinData, joining]);

  const fetchJoinToken = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/live-classes/${roomName}/join`);
      
      console.log('✅ Join response:', response.data);
      
      if (response.data.success) {
        setJoinData(response.data.data);
        console.log('🎫 Token received successfully');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to join live class');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('❌ Error fetching join token:', error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = () => {
    if (!joinData) {
      Alert.alert('Error', 'No join data available');
      return;
    }

    try {
      setJoining(true);
      console.log('🚀 Joining live session...');
      
      // Navigate to VideoCall with LiveKit credentials
      navigation.navigate('VideoCall', {
        roomName: joinData.liveKit.roomName,
        token: joinData.liveKit.token,
        serverURL: joinData.liveKit.serverURL,
        participantName: joinData.liveClass.participantName,
        participantRole: joinData.liveClass.participantRole,
        sessionId: joinData.liveClass.id,
        title: title || 'Live Class',
        teacher: teacher || 'Teacher',
        subject: subject || 'Subject',
        batch: batch || 'N/A',
      });
    } catch (error) {
      console.error('❌ Error joining session:', error);
      Alert.alert('Error', 'Failed to join the live session');
      setJoining(false);
    }
  };

  const handleGoBack = () => {
    if (joining) {
      Alert.alert('Joining in Progress', 'Are you sure you want to cancel?', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() }
      ]);
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Preparing your session...</Text>
          <Text style={styles.loadingSubText}>Please wait while we connect you</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FF" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} disabled={false}>
          <Icon name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Live Class</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <Text style={styles.sessionStatus}>Now</Text>
          </View>

          <Text style={styles.sessionTitle}>{title || 'Live Class'}</Text>
          
          <View style={styles.sessionDetails}>
            <View style={styles.detailRow}>
              <Icon name="user" size={18} color="#6B7280" />
              <Text style={styles.detailText}>{teacher || 'Teacher'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="book-open" size={18} color="#6B7280" />
              <Text style={styles.detailText}>{subject || 'Subject'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="users" size={18} color="#6B7280" />
              <Text style={styles.detailText}>Batch: {batch || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="hash" size={18} color="#6B7280" />
              <Text style={styles.detailText}>Room: {roomName?.substring(0, 8) || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.participantCard}>
          <Text style={styles.participantLabel}>You are joining as</Text>
          <Text style={styles.participantName}>
            {joinData?.liveClass.participantName || user?.name || 'Student'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {joinData?.liveClass.participantRole || 'STUDENT'}
            </Text>
          </View>
        </View>

        <View style={styles.joinContainer}>
          {!joining ? (
            <>
              <Text style={styles.joinInfo}>
                You will be joined automatically in {countdown}s
              </Text>
              <TouchableOpacity style={styles.joinButton} onPress={handleJoinSession} disabled={joining}>
                <Icon name="video" size={24} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Join Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={joining}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.joiningContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.joiningText}>Joining session...</Text>
              <Text style={styles.joiningSubText}>Please wait</Text>
            </View>
          )}
        </View>

        <View style={styles.securityNotice}>
          <Icon name="shield" size={16} color="#6B7280" />
          <Text style={styles.securityText}>Your connection is encrypted and secure</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: width * 0.05 },
  loadingText: { fontSize: width * 0.045, fontWeight: '600', color: '#111827', marginTop: height * 0.02 },
  loadingSubText: { fontSize: width * 0.035, color: '#6B7280', marginTop: height * 0.005 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: width * 0.04, paddingVertical: height * 0.02, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { padding: width * 0.02, zIndex: 10 },
  headerTitle: { fontSize: width * 0.045, fontWeight: '600', color: '#111827' },
  headerPlaceholder: { width: width * 0.08 },
  content: { flex: 1, paddingHorizontal: width * 0.05, paddingTop: height * 0.02 },
  sessionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: width * 0.05, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: height * 0.015 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: width * 0.03, paddingVertical: height * 0.005, borderRadius: 12 },
  liveDot: { width: width * 0.02, height: width * 0.02, borderRadius: width * 0.01, backgroundColor: '#EF4444', marginRight: width * 0.015 },
  liveBadgeText: { color: '#EF4444', fontSize: width * 0.03, fontWeight: '600' },
  sessionStatus: { color: '#10B981', fontSize: width * 0.03, fontWeight: '600' },
  sessionTitle: { fontSize: width * 0.05, fontWeight: '700', color: '#111827', marginBottom: height * 0.02 },
  sessionDetails: { gap: height * 0.01 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: width * 0.035, color: '#374151', marginLeft: width * 0.025 },
  participantCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: width * 0.05, marginTop: height * 0.02, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  participantLabel: { fontSize: width * 0.03, color: '#6B7280', marginBottom: height * 0.005 },
  participantName: { fontSize: width * 0.05, fontWeight: '700', color: '#111827' },
  roleBadge: { marginTop: height * 0.01, backgroundColor: '#EEF2FF', paddingHorizontal: width * 0.04, paddingVertical: height * 0.005, borderRadius: 12 },
  roleBadgeText: { color: '#4F46E5', fontSize: width * 0.03, fontWeight: '600' },
  joinContainer: { marginTop: height * 0.03, alignItems: 'center' },
  joinInfo: { fontSize: width * 0.035, color: '#6B7280', marginBottom: height * 0.015 },
  joinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', width: '100%', paddingVertical: height * 0.018, borderRadius: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  joinButtonText: { color: '#FFFFFF', fontSize: width * 0.045, fontWeight: '600', marginLeft: width * 0.025 },
  cancelButton: { marginTop: height * 0.015, paddingVertical: height * 0.015 },
  cancelButtonText: { color: '#6B7280', fontSize: width * 0.035 },
  joiningContainer: { alignItems: 'center' },
  joiningText: { fontSize: width * 0.045, fontWeight: '600', color: '#111827', marginTop: height * 0.02 },
  joiningSubText: { fontSize: width * 0.035, color: '#6B7280', marginTop: height * 0.005 },
  securityNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: height * 0.03 },
  securityText: { fontSize: width * 0.03, color: '#6B7280', marginLeft: width * 0.02 },
});

export default JoinLive;