import * as React from 'react';
import { Text, TextInput, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from '../_utils/lib/supabase';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';

export default function SignInScreen(): JSX.Element {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const signInWithEmail = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data?.session) {
        router.replace('/(home)')
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Sign In</Text>
        <TextInput
          style={GlobalStyles.input}
          autoCapitalize="none"
          value={email}
          placeholder="Enter email"
          onChangeText={setEmail}
          editable={!loading}
          keyboardType="email-address"
        />
        <TextInput
          style={GlobalStyles.input}
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={setPassword}
          editable={!loading}
        />
        <Button
          title="Sign In"
          variant="primary"
          onPress={signInWithEmail}
          isLoading={loading}
          disabled={loading}
        />
      </View>
    </View>
  )
}