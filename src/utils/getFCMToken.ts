import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied');
        return;
      }
    }

    await messaging().requestPermission();

    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.log(error);
  }
};