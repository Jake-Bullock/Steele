import React from 'react'
import { Stack, Redirect } from 'expo-router'
import { useSupabase } from '../_utils/contexts/SupabaseProvider'

export default function AuthLayout() {
  const { session, initialized } = useSupabase()

  if (!initialized) return null

  if (session) {
    return <Redirect href="/" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#000000',
      }}
    />
  )
}