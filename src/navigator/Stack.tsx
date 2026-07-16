// navigator/Stack.tsx
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import OnBoarding from '../pages/OnBoarding';
import Login from '../pages/Login';
import BottomNavigator from './BottomNavigator';
import JoinLive from '../pages/live/JoinLive';
import VideoCall from '../pages/live/VideoCall';
import Notification from '../pages/notification/Notification';
import ReadNotification from '../pages/notification/ReadNotification';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageViewer from '../components/ImageViewer';
import TakeAssessment from '../pages/assignment/TakeAssessment';

export type RootStackParamList = {
  OnBoarding: undefined;
  Login: undefined;
  BottomTabs: undefined;
  JoinLive: {
    sessionId: string;
    roomName: string;
    title: string;
    teacher: string;
    subject: string;
    batch: string;
  };
  VideoCall: {
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
  Notifications: undefined;
  ReadNotification: undefined;
  ImageViewer: {
    imageUri: string;
    imageTitle?: string;
    enableDownload?: boolean;
    enableShare?: boolean;
    onClose?: () => void;
  };
  TakeAssessment: {
    assessmentId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStack: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [initialRoute, setInitialRoute] = useState<'OnBoarding' | 'BottomTabs'>('OnBoarding');

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated ? "BottomTabs" : "OnBoarding"}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="OnBoarding" component={OnBoarding} />
          <Stack.Screen name="Login" component={Login} />
        </>
      ) : (
        <>
          <Stack.Screen name="BottomTabs" component={BottomNavigator} />
          {/* Add JoinLive and VideoCall screens */}
          <Stack.Screen
            name="JoinLive"
            component={JoinLive}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="VideoCall"
            component={VideoCall}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="Notifications"
            component={Notification}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="ReadNotification"
            component={ReadNotification}
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="ImageViewer"
            component={ImageViewer}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="TakeAssessment"
            component={TakeAssessment}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootStack;