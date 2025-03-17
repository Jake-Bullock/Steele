import React from 'react'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'

const Posts = (): JSX.Element => {
  const router = useRouter()

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Posts</Text>
        <Text style={GlobalStyles.subtitle}>Manage/view your posts</Text>
    
      </View>
    </View>
  )
}

export default Posts