import React, { useState } from 'react'
import { View, Text, TextInput, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import GlobalStyles from '../assets/styles/GlobalStyles'
import supabase from './_utils/lib/supabase'
import Button from './components/Button'
import LoadingIndicator from './components/LoadingIndicator'

export default function VerifyCodeScreen(): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const router = useRouter()

  const verifyEmail = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.verifyOtp({
        token: code,
        type: 'signup'
      })
      if (error) throw error
      router.replace('/(home)')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Verify Email</Text>
        <TextInput
          value={code}
          style={GlobalStyles.input}
          placeholder="Verification Code"
          onChangeText={setCode}
          editable={!loading}
        />
        <Button
          title={loading ? 'Verifying...' : 'Verify Email'}
          variant="primary"
          onPress={verifyEmail}
          isLoading={loading}
          disabled={loading}
        />
      </View>
    </View>
  )
}