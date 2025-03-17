import React from 'react'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'

const Dashboard = (): JSX.Element => {
  const router = useRouter()

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Dashboard</Text>
        <Text style={GlobalStyles.subtitle}>Manage your feeders</Text>
        
        <Button 
          title="Go to Feeders"
          variant="primary"
          onPress={() => router.push('/screens/MainPage')}
        />
      </View>
    </View>
  )
}

export default Dashboard