import React from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'

interface PostThumbnailProps {
  title: string
  onPress: () => void
}

const PostThumbnail = ({ title, onPress }: PostThumbnailProps): JSX.Element => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default PostThumbnail