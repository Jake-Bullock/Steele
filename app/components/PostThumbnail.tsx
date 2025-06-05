import React, { useState, useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet, View, Pressable, Modal, Alert, Platform, Image } from "react-native";
import QRCode from "react-native-qrcode-svg";
import supabase from '../_utils/lib/supabase';
import { useRouter } from 'expo-router'
import Button from '../components/Button'
import GlobalStyles from '../../assets/styles/GlobalStyles'
import LoadingIndicator from '../components/LoadingIndicator'


interface PostThumbnailProps {
  title: string;
  postId: string;
  userId: string;
  qr_code_url?: string;
  onPress: () => void;
}

const PostThumbnail = ({ title, onPress, postId, userId }: PostThumbnailProps): JSX.Element => {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false)
  const [showWebDeletePostModal, setShowWebDeletePostModal] = useState(false);


  useEffect(() => {
  const fetchFirstImage = async () => {
    const { data, error } = await supabase
      .from('post_images')
      .select('image_url')
      .eq('post_id', postId)
      .eq('file_type', 'image')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching image:', error);
      setImageUrl(null);
    } else if (data && data.image_url) {
      // Extract the file path from the image_url
      const filePath = data.image_url.split("/object/public/posts/")[1] || data.image_url;
      // Generate a signed URL (valid for 24 hours)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('posts')
        .createSignedUrl(filePath, 60 * 60 * 24);

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        setImageUrl(null);
      } else {
        setImageUrl(signedUrlData.signedUrl);
      }
    } else {
      setImageUrl(null);
      console.log('No image found for this post');
    }
  };

  fetchFirstImage();
}, [postId]);

  const deletePost = async (postId: string, userId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('post')
        .delete()
        .eq('id', postId); 
      
      if (error) {
        console.error('Error deleting post:', error);
      } else {
        console.log('Post deleted successfully');
      }
    } catch (error) {
      console.error('Unexpected error deleting post:', error);
    }
    try {
      const { error } = await supabase
        .from('post_images')
        .delete()
        .eq('post_id', postId)

      if (error) {
        console.error('Error deleting post image:', error);
      } else {
        console.log('Post image deleted successfully');
      }
    } catch (error) {
      console.error('Unexpected error deleting images:', error);
    } finally {
      setLoading(false);
      router.push('/screens/Posts')
    }
  }

  if (loading) {
    return (
      <View style={[GlobalStyles.container, GlobalStyles.contentContainer]}>
        <LoadingIndicator />
      </View>
    )
  }
  
  return (
    <>
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <Text style={styles.title}>{title}</Text>
      
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <Text style={styles.title}>Image not available</Text>
      )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.deleteButton}
            onPress={() => {
              if (Platform.OS === 'web') {
                setShowWebDeletePostModal(true); // show custom modal
              } else {
                Alert.alert(
                  'Are you sure you want to delete this post?',
                  undefined,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Yes', onPress: deletePost.bind(null, postId, userId) },
                  ]
                );
              }
            }}>
            <Text style={styles.deleteButtonText}>Delete Post</Text>
          </TouchableOpacity>
    <Modal
    visible={showWebDeletePostModal}
    transparent
    animationType="fade"
    onRequestClose={() => setShowWebDeletePostModal(false)}
  >
    <View style={{
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 400
      }}>
        <Text style={{ marginBottom: 20 }}>Are you sure you want to delete this post?</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => setShowWebDeletePostModal(false)}
            style={{ marginRight: 15 }}
          >
            <Text style={{ color: 'blue' }}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowWebDeletePostModal(false);
              deletePost(postId, userId);
            }}
          >
            <Text style={{ color: 'red' }}>Delete Post</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButtonText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#FFAAAC",
    borderRadius: 5,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
    resizeMode: 'cover',
  },
});

export default PostThumbnail;