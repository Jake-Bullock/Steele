import * as React from 'react';
import { Text, TextInput, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from '../_utils/lib/supabase';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import LoadingIndicator from '../components/LoadingIndicator';

export default function SignUpScreen(): JSX.Element {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const signUpWithEmail = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    setLoading(true);
    try {
      // Attempt to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
  
      if (error) {
        // Handle duplicate email error
        if (error.message.includes('already registered')) {
          Alert.alert('Error', 'This email is already registered. Please sign in.');
          return;
        }
        throw error;
      }
  
      if (data?.user) {
        Alert.alert(
          'Success',
          'Registration successful! Please check your email for verification.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  
  };

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Create Account</Text>
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
          title="Sign Up"
          variant="primary" 
          onPress={signUpWithEmail}
          isLoading={loading}
          disabled={loading}
        />
      </View>
    </View>
  )
}