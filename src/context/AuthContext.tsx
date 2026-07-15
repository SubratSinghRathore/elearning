import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!accessToken || !refreshToken) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Axios interceptor automatically adds:
      // Cookie: accessToken=...; refreshToken=...
      const response = await api.get('/auth/me');

      setUser(response.data.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('Auth check failed', error);

      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('isLoggedIn');

      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message,
        };
      }

      const { accessToken, refreshToken } = response.data.data;

      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('isLoggedIn', 'true');

      // Verify immediately using cookies sent by interceptor
      const me = await api.get('/auth/me');

      setUser(me.data.data);
      setIsAuthenticated(true);

      await AsyncStorage.setItem('userRole', me.data.data.role);
      // await AsyncStorage.setItem('userEmail', response.data.data.email);
      // await AsyncStorage.setItem('userphoneNumber', response.data.data.phoneNumber);
      // await AsyncStorage.setItem('userName', response.data.data.personalInfo.name);
      // await AsyncStorage.setItem('userGender', response.data.data.personalInfo.gender);
      // await AsyncStorage.setItem('userId', response.data.data.id);

      return { success: true };
    } catch (error: any) {
      console.log(error);

      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('isLoggedIn');

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        checkAuthStatus,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};