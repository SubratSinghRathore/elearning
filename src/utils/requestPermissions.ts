import {PermissionsAndroid, Platform} from 'react-native';

export async function requestPermissions() {
  if (Platform.OS !== 'android') return true;

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]);

  return (
    result['android.permission.CAMERA'] ===
      PermissionsAndroid.RESULTS.GRANTED &&
    result['android.permission.RECORD_AUDIO'] ===
      PermissionsAndroid.RESULTS.GRANTED
  );
}