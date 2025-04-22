import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView } from 'react-native';
import supabase from '../../_utils/lib/supabase'


export default function PostDetail() {
  const { post_id } = useLocalSearchParams(); // Get dynamic ID from route
  const [post, setPost] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  console.log("Post Id: ", useLocalSearchParams());
  console.log("Real post id", post_id);
  useEffect(() => {
    if (post_id) {
      fetchPost();
    }
  }, [post_id]);

  const fetchPost = async () => {
    console.log("DEBUG - Fetching post with ID:", post_id);
    
  
    try {
      const { data: postData, error: postError } = await supabase
        .from('post')
        .select('*')
        .eq('id', String(post_id)) // ✅ Force it to be a string
        .maybeSingle(); // ✅ Prevents errors if 0 rows are returned
  
      console.log("DEBUG - Post Data:", postData);
      console.log("DEBUG - Post Fetch Error:", postError);
  
      if (postError) {
        console.error("ERROR - Fetching post failed:", postError);
      } else if (!postData) {
        console.warn("⚠️ No post found for ID:", post_id);
      } else {
        setPost(postData);
        fetchImages(postData.id);
      }
    } catch (error) {
      console.error("ERROR - fetchPost() crashed:", error);
    }
  };
  

  const fetchImages = async (postId: string) => {
    try {
      const { data: imageData, error: imageError } = await supabase
        .from('post_images')
        .select('image_url')
        .eq('post_id', postId);
  
      if (imageError) {
        console.error("❌ Error fetching images:", imageError);
        return;
      }
  
      const updatedImages = await Promise.all(
        imageData.map(async (img: { image_url: string }) => {
          // Extract the relative file path from the public URL
          const filePath = img.image_url.split("/object/public/posts/")[1];
  
          if (!filePath) {
            console.warn("⚠️ Could not extract file path from:", img.image_url);
            return null;
          }
  
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('posts')
            .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours
  
          if (signedUrlError) {
            console.error("❌ Error creating signed URL:", signedUrlError);
            return null;
          }
  
          return signedUrlData.signedUrl;
        })
      );
  
      // Remove nulls and update state
      setImages(updatedImages.filter((url): url is string => url !== null));
    } catch (error) {
      console.error("❌ fetchImages() crashed:", error);
    }
    setLoading(false);
  };
  
  

  console.log("DEBUG - Final image URLs to render:", images);

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