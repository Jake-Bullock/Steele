import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import Button from '../components/Button';
import supabase from '../_utils/lib/supabase';
import GlobalStyles from '../../assets/styles/GlobalStyles';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://steele-ovwr.vercel.app/(auth)/update-password',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setMessage('Check your email for a password reset link.');
    }
  };

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Reset Password</Text>
        <TextInput
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          style={GlobalStyles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Button
          title="Send reset link"
          onPress={handleReset}
          isLoading={loading}
        />
        {message ? <Text style={{ marginTop: 16, color: 'green' }}>{message}</Text> : null}
      </View>
    </View>
  );
}
