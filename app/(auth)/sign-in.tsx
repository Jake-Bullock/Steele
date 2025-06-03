import * as React from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from '../_utils/lib/supabase';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';

export default function SignInScreen(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const signInWithEmail = async () => {
    // Clear previous errors
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.session) {
        setErrorMessage('Email and password do not match');
        return;
      }

      router.replace('/(home)');
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Sign In</Text>

        <TextInput
          style={GlobalStyles.input}
          autoCapitalize="none"
          value={email}
          placeholder="Enter email"
          placeholderTextColor="#667"
          onChangeText={(text) => {
            setEmail(text);
            if (errorMessage) setErrorMessage('');
          }}
          editable={!loading}
          keyboardType="email-address"
        />

        <TextInput
          style={GlobalStyles.input}
          value={password}
          placeholder="Enter password"
          placeholderTextColor="#667"
          secureTextEntry={true}
          onChangeText={(text) => {
            setPassword(text);
            if (errorMessage) setErrorMessage('');
          }}
          editable={!loading}
        />

        {errorMessage ? (
          <Text style={{ color: 'red', marginTop: 4 }}>{errorMessage}</Text>
        ) : null}

        <Button
          title="Sign In"
          variant="primary"
          onPress={signInWithEmail}
          isLoading={loading}
          disabled={loading}
        />
        <Pressable onPress={() => router.push('/forgot-password')}>
        <Text style={{ color: 'blue', marginTop: 12, textAlign: 'center' }}>
          Forgot password?
        </Text>
        </Pressable>
      </View>
    </View>
  );
}
