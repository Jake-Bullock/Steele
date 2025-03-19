import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

export default function PostDetail() {
  const { id } = useLocalSearchParams(); // Get dynamic ID from route
  const [post, setPost] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    const { data: postData, error: postError } = await supabase
      .from('post') // Replace with your actual table name
      .select('*')
      .eq('id', id)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
    } else {
      setPost(postData);
      fetchImages(postData.id);
    }
  };

  const fetchImages = async (postId: string) => {
    const { data: imageData, error: imageError } = await supabase
      .from('post_images')
      .select('image_url')
      .eq('post_id', postId);

    if (imageError) {
      console.error('Error fetching images:', imageError);
    } else {
      setImages(imageData.map((img: { image_url: string }) => img.image_url));
    }
    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!post) {
    return <Text style={styles.error}>Post not found.</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.description}>{post.description}</Text>
      {images.length > 0 && (
        <View style={styles.imagesContainer}>
          {images.map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.image} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  image: {
    width: '48%',
    height: 200,
    marginBottom: 10,
    borderRadius: 8,
  },
});