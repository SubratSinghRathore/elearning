// pages/OnBoarding.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigator/Stack';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    'OnBoarding'
  >;
};

const OnBoarding: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [moveDot, setMoveDot] = useState(false);

  // If user is already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('BottomTabs');
    }
  }, [isAuthenticated, navigation]);

  const handleLogin = () => {
    setMoveDot(true);
    navigation.navigate('Login');
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>E - Learning</Text>
      </View>

      {/* Illustration */}
      <View style={styles.imageCard}>
        <Image
          source={require('../assets/images/onboarding.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text style={styles.title}>
        Unlock Your <Text style={styles.primary}>Potential</Text>
      </Text>

      <Text style={styles.subtitle}>
        Master new skills with our personalized learning paths designed for your
        success.
      </Text>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Get Started →</Text>
      </TouchableOpacity>

      {/* Login */}
      {/* <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.login}>Sign In</Text>
      </TouchableOpacity> */}

      {/* Pagination */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.active]} />
        <View style={[styles.dot, moveDot && styles.active]}/>
        <View style={styles.dot} />
      </View>
    </View>
  );
};

export default OnBoarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FF',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  logo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },

  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F46E5',
  },

  imageCard: {
    width: width * 0.9,
    height: 350,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  title: {
    marginTop: 30,
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },

  primary: {
    color: '#4F46E5',
  },

  subtitle: {
    textAlign: 'center',
    color: '#777',
    marginTop: 15,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  button: {
    width: '100%',
    backgroundColor: '#4F46E5',
    marginTop: 35,
    borderRadius: 15,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 18,
  },

  login: {
    marginTop: 22,
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 16,
  },

  dots: {
    flexDirection: 'row',
    marginTop: 30,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6D6D6',
    marginHorizontal: 4,
  },

  active: {
    width: 18,
    backgroundColor: '#4F46E5',
  },
});