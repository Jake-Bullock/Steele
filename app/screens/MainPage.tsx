import React, { useState, useEffect } from 'react'
import { Text, View, FlatList, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import supabase from '../_utils/lib/supabase'
import Button from '../components/Button'
import LoadingIndicator from '../components/LoadingIndicator'
import { Feeder } from '../_utils/lib/types'

const MainPage = (): JSX.Element => {
  const router = useRouter()
  const [userFeeders, setUserFeeders] = useState<Feeder[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    getUserFeeders()
  }, [])
  
  async function getUserFeeders() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace('/(auth)/sign-in')
        return
      }
  
      // First get the user-feeder relationships
      const { data: relationships, error: relError } = await supabase
        .from('UserOwnedFeeders')
        .select('FeederID')
        .eq('UserID', session.user.id)
  
      if (relError) throw relError
  
      if (relationships && relationships.length > 0) {
        // Get the feeder details for each relationship
        const feederIds = relationships.map(rel => rel.FeederID)
        
        const { data: feeders, error: feederError } = await supabase
          .from('feeder')
          .select('*')
          .in('feederid', feederIds)
  
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
      Alert.alert('Error', 'Failed to load feeders')
    } finally {
      setLoading(false)
    }
  }
  
  const renderFeederItem = ({ item, index }: { item: Feeder, index: number }) => (
    <View style={GlobalStyles.feederCard}>
      <View style={GlobalStyles.feederHeader}>
        <Text style={GlobalStyles.feederTitle}>Feeder {index + 1}</Text>
        <Text style={GlobalStyles.feederSubtitle}>ID: {item.id}</Text>
      </View>
      <View style={GlobalStyles.feederContent}>
        <Text style={GlobalStyles.feederLabel}>Food Brand:</Text>
        <Text style={GlobalStyles.feederValue}>{item.foodbrand || 'Not set'}</Text>
      </View>
      <TouchableOpacity 
        style={GlobalStyles.configureButton}
        onPress={() => {
          router.push({
            pathname: '/screens/Scheduler',
            params: { 
              feederId: item.id,
              feederName: `Feeder ${index + 1}` 
            }
          });
        }}
      >
        <Text style={GlobalStyles.configureButtonText}>Configure</Text>
      </TouchableOpacity>
    </View>
  )

  const goBack = () => {
    router.back();
  };

  return (
    <View style={GlobalStyles.container}>
      <View style={[GlobalStyles.contentContainer, { justifyContent: 'flex-start', paddingTop: 20 }]}>
        {/* Back button */}
        <TouchableOpacity 
          style={[GlobalStyles.backButton, { alignSelf: 'flex-start'}]} 
          onPress={goBack}
        >
          <Text style={GlobalStyles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={GlobalStyles.title}>Feeders</Text>
        
        {loading ? (
          <LoadingIndicator />
        ) : (
          <>
            {userFeeders.length > 0 ? (
              <FlatList
                data={userFeeders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderFeederItem}
                style={GlobalStyles.feederList}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <View style={GlobalStyles.noFeedersContainer}>
                <Text style={GlobalStyles.noFeedersText}>
                  You don't have any feeders linked to your account yet.
                </Text>
                <Text style={GlobalStyles.noFeedersSubtext}>
                  Create a new feeder or link an existing one from your profile.
                </Text>
              </View>
            )}
            
            <Button 
              title="Create Feeder"
              variant="primary"
              onPress={() => router.push('/screens/CreateFeeder')}
            />
          </>
        )}
      </View>
    </View>
  )
}

export default MainPage