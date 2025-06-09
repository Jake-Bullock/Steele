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
  TouchableOpacity,
  Image,
  StyleSheet
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import uuid from 'react-native-uuid'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import supabase from '../_utils/lib/supabase'
import { Profile } from '../_utils/lib/types'
import Button from '../components/Button'
import LoadingIndicator from '../components/LoadingIndicator'

export default function ProfilePage(): JSX.Element {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editedUsername, setEditedUsername] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showWebSignOutModal, setShowWebSignOutModal] = useState(false)
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null)

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
        .select('id, email, username, updated_at, pfp_url')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      if (data) {
        setProfile(data)
        setEditedUsername(data.username || '')
        setProfileImageUri(data.pfp_url || null)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      Alert.alert('Error', 'Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  // Function to pick profile image
  const pickProfileImage = async () => {
    if (Platform.OS === "web") {
      return new Promise((resolve) => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.multiple = false

        input.onchange = async (event: Event) => {
          const target = event.target as HTMLInputElement | null
          if (target && target.files && target.files[0]) {
            const file = target.files[0]
            const imageUri = URL.createObjectURL(file)
            await uploadProfileImage({
              uri: imageUri,
              type: file.type || "image/png",
              name: file.name,
            })
            resolve(imageUri)
          }
        }
        input.click()
      })
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        await uploadProfileImage({
          uri: asset.uri,
          type: asset.type ?? "image",
          name: asset.fileName ?? undefined,
        })
      }
    }
  }

  // Function to upload profile image to Supabase
  const uploadProfileImage = async (image: { uri: string; type: string; name?: string }) => {
    setUploadingImage(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No user session')

      // Helper function to get file extension and content type
      const getFileInfo = (type: string) => {
        let extension = '.png'
        let contentType = 'image/png'
        
        if (type.includes('jpeg') || type.includes('jpg')) {
          extension = '.jpg'
          contentType = 'image/jpeg'
        } else if (type.includes('png')) {
          extension = '.png'
          contentType = 'image/png'
        } else if (type.includes('gif')) {
          extension = '.gif'
          contentType = 'image/gif'
        } else if (type.includes('webp')) {
          extension = '.webp'
          contentType = 'image/webp'
        }
        
        return { extension, contentType }
      }

      const convertToBase64 = async (uri: string): Promise<string> => {
        if (Platform.OS === "web") {
          const response = await fetch(uri)
          const blob = await response.blob()
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(blob)
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result.split(",")[1])
              } else {
                console.error("FileReader result is not a string:", reader.result)
                resolve("")
              }
            }
          })
        } else {
          return await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          })
        }
      }

      // Get proper file info based on type
      const { extension, contentType } = getFileInfo(image.type)
      
      // Convert the file to base64
      const base64 = await convertToBase64(image.uri)

      // Check file size (5MB limit for profile images)
      const approximateFileSizeInMB = (base64.length * 0.75) / (1024 * 1024)
      if (approximateFileSizeInMB > 5) {
        Alert.alert('Error', `Image too large (${Math.round(approximateFileSizeInMB)}MB). Please choose an image under 5MB.`)
        return
      }

      // Delete old profile picture if it exists
      if (profile?.pfp_url) {
        try {
          // Extract filename from URL
          const oldFileName = profile.pfp_url.split('/').pop()
          if (oldFileName) {
            await supabase.storage
              .from('avatars')
              .remove([`profile/${oldFileName}`])
          }
        } catch (deleteError) {
          console.warn('Could not delete old profile picture:', deleteError)
        }
      }

      // Generate a unique file name with proper extension
      const fileName = `profile_pictures/${session.user.id}-${Date.now()}${extension}`

      console.log(`Uploading profile image: ${fileName}`)

      // Upload the file to the 'profile-pictures' bucket
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64), { 
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        throw error
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update the profile with the new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          pfp_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)

      if (updateError) throw updateError

      // Update local state
      setProfileImageUri(publicUrl)
      setProfile(prev => prev ? { ...prev, pfp_url: publicUrl } : null)

      Alert.alert('Success', 'Profile picture updated successfully!')
      
    } catch (error: any) {
      console.error('Error uploading profile image:', error)
      Alert.alert('Error', `Failed to upload profile picture: ${error.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  // Function to remove profile picture
  const removeProfileImage = async () => {
    try {
      setUploadingImage(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No user session')

      // Delete from storage if exists
      if (profile?.pfp_url) {
        try {
          const oldFileName = profile.pfp_url.split('/').pop()
          if (oldFileName) {
            await supabase.storage
              .from('profile-pictures')
              .remove([`profile/${oldFileName}`])
          }
        } catch (deleteError) {
          console.warn('Could not delete profile picture from storage:', deleteError)
        }
      }

      // Update the profile to remove the image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          pfp_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)

      if (updateError) throw updateError

      // Update local state
      setProfileImageUri(null)
      setProfile(prev => prev ? { ...prev, pfp_url: null } : null)

      Alert.alert('Success', 'Profile picture removed successfully!')
      
    } catch (error: any) {
      console.error('Error removing profile image:', error)
      Alert.alert('Error', `Failed to remove profile picture: ${error.message}`)
    } finally {
      setUploadingImage(false)
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
      setLoading(true)
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
      router.replace('/')
    } catch (error) {
      console.error('Error signing out:', error)
      Alert.alert('Error', 'Error signing out')
    } finally {
      setLoading(false)
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
            <Text style={[GlobalStyles.title, { fontSize: 22, flex: 1, textAlign: 'center' }]}>
              Profile
            </Text>
          </View>

          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profilePictureContainer}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profilePicture} />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Text style={styles.profilePicturePlaceholderText}>
                    {profile?.username?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <LoadingIndicator />
                </View>
              )}
            </View>

            {isEditing && (
              <View style={styles.profilePictureActions}>
                <TouchableOpacity
                  style={styles.profilePictureButton}
                  onPress={pickProfileImage}
                  disabled={uploadingImage}
                >
                  <Text style={styles.profilePictureButtonText}>
                    {profileImageUri ? 'Change Photo' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>

                {profileImageUri && (
                  <TouchableOpacity
                    style={[styles.profilePictureButton, styles.removeButton]}
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        if (confirm('Are you sure you want to remove your profile picture?')) {
                          removeProfileImage()
                        }
                      } else {
                        Alert.alert(
                          'Remove Profile Picture',
                          'Are you sure you want to remove your profile picture?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', onPress: removeProfileImage, style: 'destructive' },
                          ]
                        )
                      }
                    }}
                    disabled={uploadingImage}
                  >
                    <Text style={[styles.profilePictureButtonText, styles.removeButtonText]}>
                      Remove Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
                  setShowWebSignOutModal(true)
                } else {
                  Alert.alert(
                    'Are you sure you want to sign out?',
                    undefined,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Yes', onPress: confirmSignOut },
                    ]
                  )
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
                  setShowWebSignOutModal(false)
                  confirmSignOut()
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

const styles = StyleSheet.create({
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicturePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#666',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureActions: {
    flexDirection: 'row',
    gap: 10,
  },
  profilePictureButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  profilePictureButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
  },
  removeButtonText: {
    color: 'white',
  },
})