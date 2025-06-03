import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import Button from './components/Button';
import supabase from './_utils/lib/supabase';
import GlobalStyles from '../assets/styles/GlobalStyles';
import { useRouter } from 'expo-router';
import { showSuccessToast } from '../utils/showToast';


export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updatePassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      showSuccessToast("Password successfully updated!")
      router.replace('/(auth)/sign-in');
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
