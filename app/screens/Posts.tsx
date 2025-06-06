import React, { useEffect, useState } from 'react'
import { Text, View, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native'
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
  const { width } = useWindowDimensions()
  let numColumns = 1;
  if (width < 500) {
    numColumns = 1;
  } else if (width < 1200) {
    numColumns = 2;
  } else if (width < 1800) {
    numColumns = 3;
  } else {
    numColumns = 4;
  }

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <TouchableOpacity
         onPress={() => router.back()}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            minWidth: 50, // ensures space is reserved
            alignItems: 'flex-start',
          }}
      >
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[GlobalStyles.title, { fontSize: 22 }]}>Posts</Text>
        </View>

        {/* Invisible placeholder to balance space on right */}
        <View style={{ minWidth: 50 }} />
      </View>
        <Text style={GlobalStyles.subtitle}>Manage/view your posts</Text>
        <Button
          title="Create New Post"
          onPress={() => router.push('/screens/CreatePost')}
          style={GlobalStyles.buttonContainer}
        />
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          key={numColumns}
          numColumns={numColumns}
          columnWrapperStyle={ numColumns > 1 ? { justifyContent: 'space-between'}: undefined }
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