import React, { useState } from 'react'
import { View, Text, TextInput, Alert } from 'react-native'
import supabase from '../_utils/lib/supabase'
import { useRouter } from 'expo-router'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'
import LoadingIndicator from '../components/LoadingIndicator'

const CreateFeeder = (): JSX.Element => {
  const [foodBrand, setFoodBrand] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreateFeeder = async () => {
    if (!foodBrand) {
      Alert.alert('Error', 'Please enter a food brand')
      return
    }

    setLoading(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session Error:', sessionError)
        Alert.alert('Error', 'Failed to retrieve user session')
        return
      }

      if (!session?.user) {
        Alert.alert('Error', 'You must be logged in to create a feeder')
        return
      }

      // Insert feeder data
      const { data: feederData, error: feederError } = await supabase
        .from('feeder')
        .insert([{ foodbrand: foodBrand }])
        .select()

      if (feederError) {
        console.error('Insert Error:', feederError)
        Alert.alert('Error', `Failed to create feeder: ${feederError.message}`)
        return
      }

      if (!feederData || feederData.length === 0) {
        Alert.alert('Error', 'Failed to create feeder: No data returned')
        return
      }

      const feederId = feederData[0].feederid  // Changed from 'id' to 'feederid'

      // Link the new feeder to the user
      const { error: linkError } = await supabase
        .from('UserOwnedFeeders')
        .insert([
          { 
            UserID: session.user.id,    // Changed from 'user_id' to 'UserID'
            FeederID: feederId          // Changed from 'feeder_id' to 'FeederID'
          }
        ])

      if (linkError) {
        console.error('Link Error:', linkError)
        Alert.alert('Warning', 'Feeder created but could not be linked to your account')
        return
      }

      Alert.alert('Success', 'Feeder created and linked to your account!', [
        { text: 'OK', onPress: () => router.push('/screens/MainPage') }
      ])
    } catch (error: any) {
      console.error('Error:', error)
      Alert.alert('Error', `Unexpected Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Create Feeder</Text>
        <TextInput
          style={GlobalStyles.input}
          placeholder="Enter food brand"
          value={foodBrand}
          onChangeText={setFoodBrand}
          editable={!loading}
        />
        {loading ? (
          <LoadingIndicator />
        ) : (
          <Button 
            title="Create Feeder"
            variant="primary"
            onPress={handleCreateFeeder}
            disabled={loading}
          />
        )}
      </View>
    </View>
  )
}

export default CreateFeeder