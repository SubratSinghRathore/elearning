import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://elearning.mssplonline.in/api/v1',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    "X-Client-Type": "mobile"
  },
});

api.interceptors.request.use(
  async config => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      config.headers.Cookie =
        `accessToken=${accessToken}; refreshToken=${refreshToken}`;
    }

    return config;
  },
  error => Promise.reject(error),
);

export default api;