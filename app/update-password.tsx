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
  const [passwordError, setPasswordError] = useState('');
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


  const validatePassword = () => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough || !hasUpperCase || !hasNumber) {
      setPasswordError(
        'Password must be at least 8 characters, include a capital letter and a number'
      );
      return false;
    }

    setPasswordError('');
    return true;
  };

  const updatePassword = async () => {
    if (!validatePassword()) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      console.log(error.message);
    } else {
      await supabase.auth.signOut();
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
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError('');
          }}
          style={GlobalStyles.input}
        />
        {passwordError ? (
          <Text style={{ color: 'red', marginTop: 4 }}>{passwordError}</Text>
        ) : null}
        <Button
          title="Update Password"
          onPress={updatePassword}
          isLoading={loading}
        />
      </View>
    </View>
  );
}
