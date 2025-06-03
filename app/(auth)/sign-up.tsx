import * as React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from '../_utils/lib/supabase';
import GlobalStyles from '../../assets/styles/GlobalStyles';
import Button from '../components/Button';
import { showSuccessToast } from '../../utils/showToast';

export default function SignUpScreen(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const validate = () => {
    let valid = true;

    // Reset previous errors
    setEmailError('');
    setPasswordError('');

    // Check for empty fields
    if (!email || !password) {
      if (!email) setEmailError('Please fill in your email');
      if (!password) setPasswordError('Please fill in your password');
      valid = false;
    }

    // Email validation
    if (email && (!email.includes('@') || !email.includes('.'))) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    // Password validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const isLongEnough = password.length >= 8;

    if (password && (!hasUpperCase || !hasNumber || !isLongEnough)) {
      setPasswordError(
        'Password must be at least 8 characters, include a capital letter and a number'
      );
      valid = false;
    }

    return valid;
  };

  const signUpWithEmail = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        if (error.message.includes('already registered')) {
          setEmailError('This email is already registered. Please sign in.');
          return;
        }
        throw error;
      }

      if (data?.user) {
        showSuccessToast('Account successfully created!');
        router.replace('/(auth)/sign-in');
      }
    } catch (error: any) {
      setEmailError('Something went wrong: ' + error.message);
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
          placeholderTextColor="#667"
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError('');
          }}
          editable={!loading}
          keyboardType="email-address"
        />
        {emailError ? (
          <Text style={{ color: 'red', marginTop: 4 }}>{emailError}</Text>
        ) : null}

        <TextInput
          style={GlobalStyles.input}
          value={password}
          placeholder="Enter password"
          placeholderTextColor="#667"
          secureTextEntry={true}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError('');
          }}
          editable={!loading}
        />
        {passwordError ? (
          <Text style={{ color: 'red', marginTop: 4 }}>{passwordError}</Text>
        ) : null}

        <Button
          title="Sign Up"
          variant="primary"
          onPress={signUpWithEmail}
          isLoading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
}
