import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
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
  const [feederIdInput, setFeederIdInput] = useState('')
  const [userFeeders, setUserFeeders] = useState<Feeder[]>([])
  const [linkingFeeder, setLinkingFeeder] = useState(false)

  useEffect(() => {
    getProfile()
    getUserFeeders() 
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

  async function signOut() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.replace('/(auth)/sign-in')
    } catch (error) {
      console.error('Error signing out:', error)
      Alert.alert('Error', 'Error signing out')
    } finally {
      setLoading(false)
    }
  }

  async function getUserFeeders() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
  
      // First get the user-feeder relationships
      const { data: relationships, error: relError } = await supabase
        .from('UserOwnedFeeders')
        .select('FeederID')  // Changed from 'feeder_id' to 'FeederID'
        .eq('UserID', session.user.id)  // Changed from 'user_id' to 'UserID'
  
      if (relError) throw relError
  
      if (relationships && relationships.length > 0) {
        // Get the feeder details for each relationship
        const feederIds = relationships.map(rel => rel.FeederID)  // Changed from feeder_id to FeederID
        
        const { data: feeders, error: feederError } = await supabase
          .from('feeder')
          .select('*')
          .in('feederid', feederIds)  // Changed from 'id' to 'feederid'
  
        if (feederError) throw feederError
        
        // Map the feeders to match your component's expected structure
        const mappedFeeders = feeders?.map(feeder => ({
          id: feeder.feederid,
          foodbrand: feeder.foodbrand,
          created_at: feeder.created_at || new Date().toISOString()
        })) || []
        
        setUserFeeders(mappedFeeders)
      } else {
        setUserFeeders([])
      }
    } catch (error) {
      console.error('Error loading user feeders:', error)
    }
  }
  
  async function linkFeeder() {
    try {
      console.log("Starting linkFeeder function with ID:", feederIdInput);
      setLinkingFeeder(true);
      
      if (!feederIdInput.trim()) {
        Alert.alert('Error', 'Please enter a feeder ID');
        return;
      }
  
      // Convert feederIdInput to a number
      const feederId = parseInt(feederIdInput.trim(), 10);
      
      // Check if it's a valid number
      if (isNaN(feederId)) {
        Alert.alert('Error', 'Please enter a valid numeric feeder ID');
        return;
      }
  
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Error', 'You must be logged in to link a feeder');
        return;
      }
  
      // Check if feeder exists (with the correct column name)
      console.log("Checking if feeder exists with ID:", feederId);
      const { data: feederExists, error: feederCheckError } = await supabase
        .from('feeder')
        .select('feederid')
        .eq('feederid', feederId)
        .single();
  
      console.log("Feeder check result:", feederExists || "not found", feederCheckError || "no error");
      
      if (feederCheckError || !feederExists) {
        Alert.alert('Error', 'Feeder not found with this ID');
        return;
      }
  
      // Instead of using .single() which can cause 406 errors, use filter and check array length
      const { data: existingLinks, error: checkLinkError } = await supabase
        .from('UserOwnedFeeders')
        .select('*')
        .eq('UserID', session.user.id)
        .eq('FeederID', feederId);
      
      if (checkLinkError) {
        console.error("Error checking existing links:", checkLinkError);
        throw checkLinkError;
      }
      
      // Check if any links were found
      if (existingLinks && existingLinks.length > 0) {
        Alert.alert('Info', 'This feeder is already linked to your account');
        return;
      }
  
      // Create the relationship with correct column names
      console.log("Creating relationship between user", session.user.id, "and feeder", feederId);
      const { error: linkError } = await supabase
        .from('UserOwnedFeeders')
        .insert([
          { 
            UserID: session.user.id,
            FeederID: feederId
          }
        ]);
  
      if (linkError) {
        console.error("Link error details:", linkError);
        throw linkError;
      }
  
      Alert.alert('Success', 'Feeder linked successfully!');
      setFeederIdInput('');
      getUserFeeders(); // Refresh feeder list
    } catch (error: any) {
      console.error('Error linking feeder:', error);
      Alert.alert('Error', `Failed to link feeder: ${error.message}`);
    } finally {
      setLinkingFeeder(false);
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
    <ScrollView style={GlobalStyles.container}>
      <View style={[GlobalStyles.contentContainer, { justifyContent: 'flex-start', paddingTop: 15, paddingBottom: 30 }]}>
        <Text style={[GlobalStyles.title, { fontSize: 22, marginBottom: 5 }]}>Profile</Text>
        
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
          
          {/* Feeder Link Section */}
          <View style={GlobalStyles.sectionDivider} />
          <Text style={GlobalStyles.sectionTitle}>Link a Feeder</Text>
          <Text style={GlobalStyles.sectionDescription}>Add a feeder to your account by entering its ID</Text>
          
          <TextInput
            style={GlobalStyles.input}
            value={feederIdInput}
            onChangeText={setFeederIdInput}
            placeholder="Enter Feeder ID"
            keyboardType="numeric"
          />
          <Button 
            title="Link Feeder"
            variant="primary"
            onPress={linkFeeder}
            isLoading={linkingFeeder}
            disabled={linkingFeeder || !feederIdInput.trim()}
          />
          
          {/* User's Linked Feeders */}
          {userFeeders.length > 0 && (
            <>
              <Text style={GlobalStyles.sectionTitle}>Your Feeders</Text>
              <View style={GlobalStyles.feedersScrollContainer}>
                <ScrollView 
                  horizontal={false} 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ width: '100%' }}
                >
                  {userFeeders.map((feeder, index) => (
                    <View key={feeder.id} style={GlobalStyles.feederItem}>
                      <Text style={GlobalStyles.feederTitle}>Feeder {index + 1}</Text>
                      <Text style={GlobalStyles.feederDetail}>ID: {feeder.id}</Text>
                      <Text style={GlobalStyles.feederDetail}>Brand: {feeder.foodbrand || 'Not set'}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <Button 
            title="Sign Out"
            variant="danger"
            onPress={signOut}
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    </ScrollView>
  )
}