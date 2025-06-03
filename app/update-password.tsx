import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import Button from './components/Button';
import supabase from './_utils/lib/supabase';
import GlobalStyles from '../assets/styles/GlobalStyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showSuccessToast } from '../utils/showToast';

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  console.log('Search Params:', searchParams);

  useEffect(() => {
    const hash = window?.location?.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const type = params.get('type');
  
      console.log('Extracted from hash:', { access_token, refresh_token, type });
  
      if (type === 'recovery' && access_token && refresh_token) {
        supabase.auth.setSession({
          access_token,
          refresh_token,
        }).catch(err => {
          console.error('Failed to set session:', err.message);
        });
      }
    }
  }, []);

  const updatePassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      showSuccessToast('Password successfully updated!');
      router.replace('/');
    }
  };

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Enter New Password</Text>
        <TextInput
          placeholder="New password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={GlobalStyles.input}
        />
        <Button
          title="Update Password"
          onPress={updatePassword}
          isLoading={loading}
        />
      </View>
    </View>
  );
}
