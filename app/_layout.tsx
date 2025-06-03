import React from 'react'
import { Stack } from 'expo-router'
import { SafeAreaView, View } from 'react-native'
import SupabaseProvider from './_utils/contexts/SupabaseProvider'
import Navbar from './components/Navbar'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ToastProvider from '../utils/ToastProvider';

export default function RootLayout() {
  return (
    <SupabaseProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <Navbar />
            <Stack 
              screenOptions={{ 
                headerShown: false,
                contentStyle: { backgroundColor: 'white' }
              }} 
            />
          </SafeAreaView>
        </ToastProvider>
      </GestureHandlerRootView>
      
    </SupabaseProvider>
  )
}