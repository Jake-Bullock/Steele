import React from 'react'
import { Stack } from 'expo-router'
import { SafeAreaView, View } from 'react-native'
import SupabaseProvider from './_utils/contexts/SupabaseProvider'
import Navbar from './components/Navbar'

export default function RootLayout() {
  return (
    <SupabaseProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Navbar />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: 'white' }
          }} 
        />
      </SafeAreaView>
    </SupabaseProvider>
  )
}