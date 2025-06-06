import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  Platform,
   Modal, 
   Pressable,
   TouchableOpacity
} from 'react-native'
import { useRouter } from 'expo-router'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import supabase from '../_utils/lib/supabase'
import { Profile, Feeder } from '../_utils/lib/types'
import Button from '../components/Button'
import LoadingIndicator from '../components/LoadingIndicator'

export default function ProfilePage(): JSX.Element {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editedUsername, setEditedUsername] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showWebSignOutModal, setShowWebSignOutModal] = useState(false);

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace('/(auth)/sign-in')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, updated_at')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      if (data) {
        setProfile(data)
        setEditedUsername(data.username || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      Alert.alert('Error', 'Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No user on the session!')

      if (!editedUsername.trim()) {
        Alert.alert('Error', 'Username cannot be empty')
        return
      }

      const updates = {
        username: editedUsername.trim(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)

      if (error) throw error
      Alert.alert('Success', 'Profile updated successfully!')
      setIsEditing(false)
      getProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', 'Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  async function confirmSignOut() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Error signing out');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <LoadingIndicator />
      </View>
    )
  }

  return (
    <>
    <ScrollView style={GlobalStyles.container}>
      <View style={[GlobalStyles.contentContainer, { justifyContent: 'flex-start', paddingTop: 15, paddingBottom: 30 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
        <Text style={[GlobalStyles.title, { fontSize: 22, flex: 1, textAlign: 'center', marginRight: 25 }]}>
          Profile
        </Text>
      </View>
        
        <View style={GlobalStyles.infoContainer}>
          {isEditing ? (
            <>
              <View style={GlobalStyles.row}>
                <Text style={GlobalStyles.label}>Username</Text>
                <TextInput
                  style={GlobalStyles.input}
                  value={editedUsername}
                  onChangeText={setEditedUsername}
                  placeholder="Enter username"
                />
              </View>
              
              <View style={GlobalStyles.row}>
                <Text style={GlobalStyles.label}>Email</Text>
                <Text style={GlobalStyles.value}>{profile?.email}</Text>
              </View>

              <Button 
                title="Save Changes"
                variant="primary"
                onPress={updateProfile}
                isLoading={loading}
                disabled={loading}
              />

              <Button 
                title="Cancel"
                onPress={() => {
                  setIsEditing(false)
                  setEditedUsername(profile?.username || '')
                }}
              />
            </>
          ) : (
            <>
              <View style={GlobalStyles.row}>
                <Text style={GlobalStyles.label}>Username</Text>
                <Text style={GlobalStyles.value}>{profile?.username || 'Not set'}</Text>
              </View>

              <View style={GlobalStyles.row}>
                <Text style={GlobalStyles.label}>Email</Text>
                <Text style={GlobalStyles.value}>{profile?.email}</Text>
              </View>

              <Button 
                title="Edit Profile"
                variant="primary"
                onPress={() => setIsEditing(true)}
              />
            </>
          )}
          
          
          
          

          <Button 
            title="Sign Out"
            variant="danger"
            onPress={() => {
              if (Platform.OS === 'web') {
                setShowWebSignOutModal(true); // show custom modal
              } else {
                Alert.alert(
                  'Are you sure you want to sign out?',
                  undefined,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes', onPress: confirmSignOut },
                  ]
                );
              }
            }}
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    </ScrollView>
    <Modal
    visible={showWebSignOutModal}
    transparent
    animationType="fade"
    onRequestClose={() => setShowWebSignOutModal(false)}
  >
    <View style={{
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 400
      }}>
        <Text style={{ marginBottom: 20 }}>Are you sure you want to sign out?</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => setShowWebSignOutModal(false)}
            style={{ marginRight: 15 }}
          >
            <Text style={{ color: 'blue' }}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowWebSignOutModal(false);
              confirmSignOut();
            }}
          >
            <Text style={{ color: 'red' }}>Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
</>
  )
  
}