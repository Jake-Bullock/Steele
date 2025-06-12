import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  Platform,
  TextInput,
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
import FishingFieldDisplay from '../../components/FishingFieldDisplay';
import HuntingFieldDisplay from '../../components/HuntingFieldDisplay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


// Helper function to determine if URL is a video
const isVideoFile = (url: string) => {
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// Component for rendering media items (images/videos)
type MediaItemProps = {
  url: string;
  style?: any;
  onPress?: () => void;
  isFullScreen?: boolean;
};

const MediaItem = ({ url, style, onPress, isFullScreen = false }: MediaItemProps) => {
  const isVideo = isVideoFile(url);
  
  const player = useVideoPlayer(isVideo ? url : null, player => {
    if (player) {
      player.loop = isFullScreen;
      // Don't auto-play unless in full screen
      if (!isFullScreen) {
        player.pause();
      }
    }
  });

  if (isVideo) {
    return (
      <TouchableOpacity onPress={onPress} disabled={isFullScreen}>
        <VideoView
          style={style}
          player={player}
          allowsFullscreen={isFullScreen}
          allowsPictureInPicture={isFullScreen}
          nativeControls={isFullScreen}
          contentFit={isFullScreen ? "contain" : "cover"}
          crossOrigin="anonymous"
        />
        {!isFullScreen && (
          <View style={styles.videoOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={isFullScreen}>
      <Image source={{ uri: url }} style={style} resizeMode={isFullScreen ? "contain" : "cover"} />
    </TouchableOpacity>
  );
};

export default function PostDetail() {
  const { post_id, edit  } = useLocalSearchParams();
  const router =  useRouter();
  const [post, setPost] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [mediaFiles, setMediaFiles] = useState<{url: string, type: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [isMediaViewerVisible, setIsMediaViewerVisible] = useState(false);



  // Animation values
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);


  const isPostOwner = user && post && user.id === post.user_id;

  useEffect(() => {
    if (post_id) {
      fetchPost();
    }
  }, [post_id]);

 
  
  useEffect(() => {
    if (isMediaViewerVisible && selectedMediaIndex !== null) {
      translateX.value = -selectedMediaIndex * screenWidth;
    }
  }, [isMediaViewerVisible, selectedMediaIndex]);

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
        const files = await fetchMediaFiles(postData.id);
        const cleaned = (files || []).filter(
        (file): file is { url: string; type: string; image_url: string } => file !== null
        );
        setMediaFiles(cleaned);
        setLoading(false);
      }
    } catch (error) {
      console.error("ERROR - fetchPost() crashed:", error);
    }
  };

  const fetchMediaFiles = async (postId: string) => {
    try {
      const { data: mediaData, error: mediaError } = await supabase
        .from('post_images')
        .select('image_url, file_type')
        .eq('post_id', postId);
  
      if (mediaError) {
        console.error("❌ Error fetching media files:", mediaError);
        return;
      }
  
      const updatedMediaFiles = mediaData.map((item: { image_url: string, file_type?: string }) => {
        // Extract path after "/object/public/"
        const filePath = item.image_url.split("/object/public/")[1];
  
        if (!filePath) {
          console.warn("⚠️ Could not extract file path from:", item.image_url);
          return null;
        }
  
        const proxiedUrl = `https://blue-cherry-c9d7.graysonlottes.workers.dev/${filePath}`;
  
        // Infer file type or use provided type
        const fileType = item.file_type || (proxiedUrl.endsWith('.mp4') ? 'video' : 'image');
  
        return {
          url: proxiedUrl,
          type: fileType,
          image_url: item.image_url,
        };
      }).filter(Boolean); // Remove any nulls
  
      return updatedMediaFiles || [];
    } catch (err) {
      console.error("❌ Unexpected error in fetchMediaFiles:", err);
    }
  };

  const openMediaViewer = (index: number) => {
    setSelectedMediaIndex(index);
    setIsMediaViewerVisible(true);
  };

  const closeMediaViewer = () => {
    setIsMediaViewerVisible(false);
    setSelectedMediaIndex(null);
    translateX.value = 0;
    scale.value = 1;
  };

  const goToNextMedia = () => {
    if (selectedMediaIndex !== null && selectedMediaIndex < mediaFiles.length - 1) {
      const newIndex = selectedMediaIndex + 1;
      setSelectedMediaIndex(newIndex);
      translateX.value = withSpring(-newIndex * screenWidth);
    }
  };

  const goToPreviousMedia = () => {
    if (selectedMediaIndex !== null && selectedMediaIndex > 0) {
      const newIndex = selectedMediaIndex - 1;
      setSelectedMediaIndex(newIndex);
      translateX.value = withSpring(-newIndex * screenWidth);
    }
  };

  // Handle pan gesture
  const handlePanGesture = (event: any) => {
    const { translationX, velocityX, state } = event.nativeEvent;
    
    if (state === State.END) {
      const SWIPE_THRESHOLD = 50;
      const VELOCITY_THRESHOLD = 500;
      
      if (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
        goToPreviousMedia();
      } else if (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
        goToNextMedia();
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
     
        
      {isPostOwner && (
        <View style={{ position: 'absolute', top: 40, right: 20, zIndex: 2000 }}>
          <TouchableOpacity
              onPress={() => router.push({ 
                pathname: '/screens/EditPostDetail',
                params: { post_id: Array.isArray(post_id) ? post_id[0] : post_id },
              })}
              >
            <Text style={{ fontSize: 18, color: '#007AFF', fontWeight: 'bold' }}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView style={styles.container}>
       
        <Text style={styles.title}>{post.title}</Text>
        
        {post.post_type === 'fishing' ? (  
          <FishingFieldDisplay
            postId={Array.isArray(post_id) ? post_id[0] : post_id}
          />
        ) : (
          <HuntingFieldDisplay
            postId={Array.isArray(post_id) ? post_id[0] : post_id}
          />
        )}
      
        <Text style={styles.description}>{post.description}</Text>
        
        {mediaFiles.length > 0 && (
          <View style={styles.mediaContainer}>
            {mediaFiles.map((mediaFile, index) => (
              <View key={index} style={styles.mediaWrapper}>
                <MediaItem
                  url={mediaFile.url}
                  style={styles.media}
                  onPress={() => openMediaViewer(index)}
                />
                {/* Media type indicator */}
                <View style={styles.mediaTypeIndicator}>
                  <Text style={styles.mediaTypeText}>
                    {mediaFile.type.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {/* QR Code below media */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <QRCode
            value={`https://steele-ovwr.vercel.app/screens/PostDetail/${post_id}`}
            size={180}
          />
          <Text style={{ color: '#888', marginTop: 8 }}>Scan to view post</Text>
        </View>
      </ScrollView>

      {/* Full Screen Media Viewer Modal */}
      <Modal
        visible={isMediaViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMediaViewer}
      >
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={closeMediaViewer}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Media counter */}
          <View style={styles.mediaCounter}>
            <Text style={styles.mediaCounterText}>
              {selectedMediaIndex !== null ? selectedMediaIndex + 1 : 0} / {mediaFiles.length}
            </Text>
          </View>

          {/* Media type indicator in full screen */}
          {selectedMediaIndex !== null && (
            <View style={styles.fullScreenMediaType}>
              <Text style={styles.fullScreenMediaTypeText}>
                {mediaFiles[selectedMediaIndex]?.type.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Swipeable media container */}
          <PanGestureHandler onHandlerStateChange={handlePanGesture}>
            <View style={{ width: screenWidth, height: screenHeight, overflow: 'hidden', alignSelf: 'center' }}>
              <Animated.View
                style={[
                  styles.mediaContainer,
                  { width: mediaFiles.length * screenWidth },
                  animatedStyle,
                ]}
              >
                {mediaFiles.map((mediaFile, index) => (
                  <View key={index} style={styles.fullScreenMediaWrapper}>
                    <MediaItem
                      url={mediaFile.url}
                      style={styles.fullScreenMedia}
                      isFullScreen={true}
                      onPress={() => {}}
                    />
                  </View>
                ))}
              </Animated.View>
            </View>
          </PanGestureHandler>
          
          {/* Navigation buttons for web/easier navigation */}
          {Platform.OS === 'web' && (
            <>
              {selectedMediaIndex !== null && selectedMediaIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.prevButton]}
                  onPress={goToPreviousMedia}
                >
                  <Text style={styles.navButtonText}>‹</Text>
                </TouchableOpacity>
              )}
              {selectedMediaIndex !== null && selectedMediaIndex < mediaFiles.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton]}
                  onPress={goToNextMedia}
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
    textAlign: 'center',
  },
  titleEdit: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',  
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
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mediaWrapper: {
    width: '48%',
    marginBottom: 10,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mediaTypeIndicator: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediaTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 24,
    marginLeft: 4, // Slight offset to center the play icon
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
  mediaCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  mediaCounterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  fullScreenMediaType: {
    position: 'absolute',
    top: 50,
    left: '50%',
    transform: [{ translateX: -25 }],
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  fullScreenMediaTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  fullScreenMediaWrapper: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMedia: {
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