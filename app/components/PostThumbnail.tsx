import React, { useState, useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet, View, Pressable, Modal, Alert, Platform, Image, Animated } from "react-native";
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
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Animation values
  const layoutAnimation = new Animated.Value(0);
  const imageScale = new Animated.Value(1);
  const buttonsOpacity = new Animated.Value(0);

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

  // Animation effect when dropdown state changes
  useEffect(() => {
    if (showDropdown) {
      // Animate to dropdown state
      Animated.parallel([
        Animated.timing(layoutAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(imageScale, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate back to normal state
      Animated.parallel([
        Animated.timing(layoutAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [showDropdown]);

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

  const handleEdit = () => {
    router.push({ pathname: '/screens/PostDetail/[post_id]', params: { post_id: postId, edit: 'true' } });
    console.log('Edit post');
  };

  const handleDelete = () => {
    setShowDropdown(false);
    if (Platform.OS === 'web') {
      setShowWebDeletePostModal(true);
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
  };

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
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={() => setShowDropdown((prev) => !prev)}>
              <Image source={require('../../assets/images/ellipsis-h-solid.png')} style={styles.ellipsisIcon} />
            </TouchableOpacity>
          </View>
          
        <View style={styles.contentContainer}>
      {imageUrl ? (
        <Animated.View style={[
          styles.imageContainer,
          { transform: [{ scale: imageScale }] }
        ]}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </Animated.View>
      ) : (
        <Animated.View style={[
          styles.noImageContainer,
          { transform: [{ scale: imageScale }] }
        ]}>
          <Text style={styles.noImageText}>Image not available</Text>
        </Animated.View>
      )}

      {showDropdown && (
        <Animated.View style={[
          styles.buttonContainer,
          {
            opacity: buttonsOpacity,
            transform: [{
              translateX: layoutAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              })
            }]
          }
        ]}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Image source={require('../../assets/images/edit-regular.png')} style={styles.actionIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={[ styles.deleteButton]} onPress={handleDelete}>
            <Image source={require('../../assets/images/trash-alt-solid.png')} style={styles.actionIcon} />
            
          </TouchableOpacity>
        </Animated.View>
      )}
  </View>
      </TouchableOpacity>
      
      <Modal
        visible={showWebDeletePostModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWebDeletePostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to delete this post?</Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowWebDeletePostModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowWebDeletePostModal(false);
                  deletePost(postId, userId);
                }}
                style={styles.modalButton}
              >
                <Text style={styles.deleteModalText}>Delete Post</Text>
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
    margin: 10,
    marginVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    justifyContent: 'center',
    // Remove any flex: 1 or height that would force extra space
    alignSelf: 'flex-start', // Let the container hug its content
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  ellipsisIcon: {
    width: 32,
    height: 32,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // Hug content horizontally
  },
  contentContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'flex-start', // Hug content horizontally
  },
  imageContainer: {
    marginVertical: 0, // Remove extra vertical margin
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: 200,
    height: 200,
    marginVertical: 0, // Remove extra vertical margin
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    // Remove flex: 1 to prevent stretching
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
    gap: 16,
    alignSelf: 'flex-start', // Hug content horizontally
    
  },
  actionButton: {
    backgroundColor: 'transparent', // No background
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    minWidth: undefined,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
  backgroundColor: 'transparent', // No background
  },
  
  actionIcon: {
    width: 28,
    height: 28,
    marginRight: 0,
    tintColor: '#007AFF', // Or 'white' if you want colored icons
  },
  deleteText: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalText: {
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 15,
  },
  cancelText: {
    color: 'red',
    fontSize: 16,
  },
  deleteModalText: {
    color: 'red',
    fontSize: 16,
  },
});

export default PostThumbnail;