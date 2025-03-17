import React from 'react'
import { Text, View, TouchableOpacity } from "react-native"
import { useRouter } from 'expo-router'
import { useSupabase } from './_utils/contexts/SupabaseProvider'
import GlobalStyles from '../assets/styles/GlobalStyles'

export default function HomePage() {
  const { session } = useSupabase()
  const router = useRouter()

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Welcome to nibbleMate</Text>
        <Text style={GlobalStyles.subtitle}>Your Food Journey Starts Here</Text>
        
        {session ? (
          <View style={GlobalStyles.buttonContainer}>
            <TouchableOpacity 
              style={GlobalStyles.button} 
              onPress={() => router.push('/screens/Dashboard')}
            >
              <Text style={GlobalStyles.buttonText}>Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={GlobalStyles.button} 
              onPress={() => router.push('/screens/ProfilePage')}
            >
              <Text style={GlobalStyles.buttonText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[GlobalStyles.button, GlobalStyles.primaryButton]} 
              onPress={() => router.push('/screens/Settings')}
            >
              <Text style={GlobalStyles.primaryButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={GlobalStyles.buttonContainer}>
            <TouchableOpacity 
              style={GlobalStyles.button}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Text style={GlobalStyles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[GlobalStyles.button, GlobalStyles.primaryButton]}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Text style={GlobalStyles.primaryButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}