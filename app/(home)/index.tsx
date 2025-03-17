import React from 'react'
import { Text, View } from "react-native"
import { useRouter } from 'expo-router'
import { useSupabase } from '../_utils/contexts/SupabaseProvider'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'

export default function HomePage(): JSX.Element {
  const { session } = useSupabase()
  const router = useRouter()

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Welcome to nibbleMate</Text>
        <Text style={GlobalStyles.subtitle}>Your Food Journey Starts Here</Text>
        
        {session ? (
          <View style={GlobalStyles.buttonContainer}>
            <Button 
              title="Dashboard"
              onPress={() => router.push('/screens/Dashboard')}
            />
            
            <Button 
              title="Profile"
              onPress={() => router.push('/screens/ProfilePage')}
            />
            
            <Button 
              title="Settings"
              variant="primary"
              onPress={() => router.push('/screens/Settings')}
            />
          </View>
        ) : (
          <View style={GlobalStyles.buttonContainer}>
            <Button 
              title="Sign In"
              onPress={() => router.push('/(auth)/sign-in')}
            />
            
            <Button 
              title="Sign Up"
              variant="primary"
              onPress={() => router.push('/(auth)/sign-up')}
            />
          </View>
        )}
      </View>
    </View>
  )
}