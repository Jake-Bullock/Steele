import React, { useEffect, useState } from 'react'
import { Text, View, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import Button from '../components/Button'
import PostThumbnail from '../components/PostThumbnail'
import { useAuth } from '../_utils/hooks/useAuth'
import supabase from '../_utils/lib/supabase';

const Posts = (): JSX.Element => {
  const router = useRouter()
  const { user } = useAuth()
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('post') // Replace with your table name
        .select('*')
        .eq('user_id', user.id) // Filter posts by the current user
      if (error) {
        console.error('Error fetching posts:', error)
      } else {
        setPosts(data || [])
      }
    }

    fetchPosts()
  }, [user])

  return (
    <View style={GlobalStyles.container}>
      <View style={GlobalStyles.contentContainer}>
        <Text style={GlobalStyles.title}>Posts</Text>
        <Text style={GlobalStyles.subtitle}>Manage/view your posts</Text>
        <Button
          title="Create New Post"
          onPress={() => router.push('/screens/CreatePost')}
          style={GlobalStyles.buttonContainer}
        />
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostThumbnail
              title={item.title}
              postId={item.id}
              userId={item.user_id}
              qr_code_url={item.qr_code_url}
              onPress={() => {
                router.push(`/screens/PostDetail/${item.id}`)
            }}
            />
          )}
        />
      </View>
    </View>
  )
}

export default Posts