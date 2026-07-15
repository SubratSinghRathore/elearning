// App.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import RootStack from './navigator/Stack';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context'
import { StatusBar } from 'react-native'
import { AuthProvider } from './context/AuthContext';
import AppBootstrap from './AppBootstrap';

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar
          translucent={false}
          backgroundColor="#ffffff"
          barStyle="dark-content"
        />
        <SafeAreaView
          edges={['top']}
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
          }}
        >
          <NavigationContainer>
            <AppBootstrap />
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  )
}