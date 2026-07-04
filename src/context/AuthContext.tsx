// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('userData');
      
      console.log('Token found:', !!token);
      console.log('User data found:', !!userData);
      
      if (token && userData) {
        // Verify token with backend (optional but recommended)
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // You can make a verify endpoint call here
          // const response = await api.get('/auth/verify');
          // if (response.data.success) {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
          // }
        } catch (error) {
          console.log('Token verification failed:', error);
          // If token is invalid, clear it
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('userData');
          await AsyncStorage.removeItem('isLoggedIn');
          delete api.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
        }
      } else {
        console.log('No token found, user is not authenticated');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      setAuthChecked(true);
      console.log('Auth check completed. isAuthenticated:', isAuthenticated);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store token and user data
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        
        // Set authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { success: false, message: response.data.message };
    } catch (error: any) {
      console.log('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('isLoggedIn');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      console.log('Logout successful');
    } catch (error) {
      console.log('Logout error:', error);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};