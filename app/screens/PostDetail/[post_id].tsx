import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  Dimensions,
  Platform
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import supabase from '../../_utils/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PostDetail() {
  const { post_id } = useLocalSearchParams();
  const [post, setPost] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  // Animation values
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    
    if (post_id) {
      fetchPost();
    }
  }, [post_id]);

  useEffect(() => {
  if (isImageViewerVisible && selectedImageIndex !== null) {
    translateX.value = -selectedImageIndex * screenWidth;
  }
  }, [isImageViewerVisible, selectedImageIndex]);

  const fetchPost = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('post')
        .select('*')
        .eq('id', post_id)
        .maybeSingle();

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
          const filePath = img.image_url.split("/object/public/posts/")[1];

          if (!filePath) {
            console.warn("⚠️ Could not extract file path from:", img.image_url);
            return null;
          }

          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('posts')
            .createSignedUrl(filePath, 60 * 60 * 24);

          if (signedUrlError) {
            console.error("❌ Error creating signed URL:", signedUrlError);
            return null;
          }

          return signedUrlData.signedUrl;
        })
      );

      setImages(updatedImages.filter((url): url is string => url !== null));
    } catch (error) {
      console.error("❌ fetchImages() crashed:", error);
    }
    setLoading(false);
  };

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageViewerVisible(true);
    //translateX.value = -index * screenWidth;
  };

  const closeImageViewer = () => {
    setIsImageViewerVisible(false);
    setSelectedImageIndex(null);
    translateX.value = 0;
    scale.value = 1;
  };

  const goToNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      translateX.value = withSpring(-newIndex * screenWidth);
    }
  };

  const goToPreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      translateX.value = withSpring(-newIndex * screenWidth);
    }
  };

  // Handle pan gesture - zak hand code shi
  const handlePanGesture = (event) => {
    const { translationX, velocityX, state } = event.nativeEvent;
    
    // Only trigger on gesture end
    if (state === State.END) {
      const SWIPE_THRESHOLD = 50; // Minimum distance for swipe
      const VELOCITY_THRESHOLD = 500; // Minimum velocity for swipe
      
      // Check if it's a swipe right
      if (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
        goToPreviousImage();
      }
      // Check if it's a swipe left
      else if (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
        goToNextImage();
      }
    }
  };



  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!post) {
    return <Text style={styles.error}>Post not found.</Text>;
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.description}>{post.description}</Text>
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            {images.map((url, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => openImageViewer(index)}
                style={styles.imageWrapper}
              >
                <Image source={{ uri: url }} style={styles.image} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Image counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} / {images.length}
            </Text>
          </View>

          {/* Swipeable image container */}
          {/*<PanGestureHandler onGestureEvent={gestureHandler}>*/}
          <PanGestureHandler onHandlerStateChange={handlePanGesture}>
            <View style={{ width: screenWidth, height: screenHeight, overflow: 'hidden', alignSelf: 'center' }}>
              <Animated.View
                style={[
                  styles.imageContainer,
                  { width: images.length * screenWidth },
                  animatedStyle,
                ]}
              >
                {images.map((url, index) => (
                  <View key={index} style={styles.fullScreenImageWrapper}>
                    <Image
                      source={{ uri: url }}
                      style={styles.fullScreenImage}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </Animated.View>
            </View>
          </PanGestureHandler>
          

          {/* Navigation buttons for web/easier navigation */}
          {Platform.OS === 'web' && (
            <>
              {selectedImageIndex !== null && selectedImageIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.prevButton]}
                  onPress={goToPreviousImage}
                >
                  <Text style={styles.navButtonText}>‹</Text>
                </TouchableOpacity>
              )}
              {selectedImageIndex !== null && selectedImageIndex < images.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton]}
                  onPress={goToNextImage}
                >
                  <Text style={styles.navButtonText}>›</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>
    </>
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
  imageWrapper: {
    width: '48%',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    flexDirection: 'row',
    height: screenHeight,
    alignItems: 'center',
  },
  fullScreenImageWrapper: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  // Navigation buttons for web
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  navButtonText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
});