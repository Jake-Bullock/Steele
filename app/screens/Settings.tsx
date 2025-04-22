import React from 'react'
import { Text, View } from 'react-native'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'

const Settings = (): JSX.Element => {
  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Settings</Text>
        <Text style={GlobalStyles.subtitle}>This is a placeholder for the Settings screen.</Text>
        
        <Button
          title="Coming Soon"
          disabled={true}
        />
      </View>
    </View>
  )
}

export default Settings