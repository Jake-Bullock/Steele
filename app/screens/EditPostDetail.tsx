import React from 'react';
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
  Alert,
  TextInput,
} from 'react-native';
import supabase from '../_utils/lib/supabase';

export default function EditPostDetail() {
  const { post_id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mediaFiles, setMediaFiles] = useState<{url: string, type: string}[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [postType, setPostType] = useState(''); 
  const [details, setPostDetails] = useState('');       

  const [deletedMedia, setDeletedMedia] = useState<string[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);
  useEffect(() => {
        if (post_id) {
            fetchPost();
        }
    }, [post_id]);

  useEffect(() => {
    if (post_id && postType) {
      fetchPost();
      fetchPostDetails();
    }
  }, [post_id, postType]);

  const fetchPost = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('post')
        .select('*')
        .eq('id', post_id)
        .maybeSingle();

      if (postError) {
        console.error("ERROR - Fetching post failed:", postError);
        Alert.alert('Error', 'Failed to load post');
        return;
      } 
      
      if (!postData) {
        console.warn("⚠️ No post found for ID:", post_id);
        Alert.alert('Error', 'Post not found');
        return;
      }

      // Check if user owns this post
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id !== postData.user_id) {
        Alert.alert('Unauthorized', 'You can only edit your own posts');
        router.back();
        return;
      }
      const files = await fetchMediaFiles(postData.id);
      const cleaned = (files || []).filter(
      (file): file is { url: string; type: string; image_url: string } => file !== null
      );
      setMediaFiles(cleaned);
      setPost(postData);
      setTitle(postData.title || '');
      setDescription(postData.description || '');
      setPostType(postData.post_type || ''); 
      setLoading(false);
    } catch (error) {
      console.error("ERROR - fetchPost() crashed:", error);
      Alert.alert('Error', 'Failed to load post');
    }
  };

  const fetchPostDetails = async () => {
    if (postType == 'fishing') {
        try {
            const { data: postDetails, error: detailsError } = await supabase
            .from('fishing_details')
            .select('fish')
            .eq('post_id', post_id)
            .single();
            
            setPostDetails(postDetails?.fish || '');
        }
        catch (error) {
            console.error("ERROR - fetchPostDetails() for fishing details crashed:", error);
            Alert.alert('Error', 'Failed to load post details');
        }
    } else if (postType === 'hunting') {
        try {
            const { data: postDetails, error: detailsError } = await supabase
            .from('hunting_details')
            .select('animal')
            .eq('post_id', post_id)
            .single();
            
            setPostDetails(postDetails?.animal || '');
        }
        catch (error) {
            console.error("ERROR - fetchPostDetails() for hunting details crashed:", error);
            Alert.alert('Error', 'Failed to load post details');
        }
    }    
  }

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

  const handleSave = async () => {
    console.log('deletedMedia URLs:', deletedMedia);
    if (!title.trim()) {
        Alert.alert('Error', 'Title is required');
        return;
    }

    setSaving(true);
    try {
      // Update post
      const { error: updateError } = await supabase
        .from('post')
        .update({
          title: title.trim(),
          description: description.trim(),
        })
        .eq('id', post_id);

      if (updateError) {
        throw updateError;
      }

      // update post_images
      for (const file of deletedMedia) {
        const { error: deleteError } = await supabase
          .from('post_images')
          .delete()
          .eq('image_url', file)
          .eq('post_id', post_id);
        if (deleteError) {
          throw deleteError;
        }
      }

      // update post details based on post type
      if (postType === 'fishing') {
        const { error: fishingError } = await supabase
          .from('fishing_details')
          .update({
            fish: details.trim(),
          })
          .eq('post_id', post_id);
        if (fishingError) {
          throw fishingError;
        }
      } else if (postType === 'hunting') {
        const { error: huntingError } = await supabase
          .from('hunting_details')
          .update({
            animal: details.trim(),
          })
          .eq('post_id', post_id);
        if (huntingError) {
          throw huntingError;
        }
      }
      // Navigate back to PostDetail page
      router.replace(`/screens/PostDetail/${post_id}`);
    } catch (error) {
      console.error('Error saving post:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Check if there are any changes
    const hasChanges = 
      title !== (post?.title || '') || 
      description !== (post?.description || '');

    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.error}>Post not found.</Text>
      </View>
    );
  }
  //console.log('mediaFiles:', mediaFiles);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Post</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.headerButton}
          disabled={saving}
        >
          <Text style={[styles.saveButton, saving && styles.disabledButton]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter post title..."
            maxLength={100}
          />
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>

        {/* Post Type Fields----=-=-=-=-=-=-=- */}
        <View style={styles.fieldsContainer}>
          {post.post_type === 'fishing' ? (  
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Fish:</Text>
                <TextInput
                    style={styles.detailsInput}
                    value={details}
                    onChangeText={setPostDetails}
                    placeholder="Enter type of fish..."
                    maxLength={50}
                />
                <Text style={styles.characterCount}>{title.length}/50</Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Fish:</Text>
                <TextInput
                    style={styles.detailsInput}
                    value={details}
                    onChangeText={setPostDetails}
                    placeholder="Enter post title..."
                    maxLength={50}
                />
                <Text style={styles.characterCount}>{title.length}/50</Text>
            </View>
        
          )}
        </View>

        {/* Description Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter post description..."
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>


        {/* Media Grid */}
        {mediaFiles.filter(file => !deletedMedia.includes(file.image_url)).length > 0 && (
        <View style={styles.mediaGrid}>
            {mediaFiles
            .filter(file => !deletedMedia.includes(file.image_url))
            .map((file, idx) => (
                <View key={file.url} style={styles.mediaWrapper}>
                <Image source={{ uri: file.url }} style={styles.mediaImage} />
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setDeletedMedia(prev => [...prev, file.image_url])}
                >
                    <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
                </View>
            ))}
        </View>
        )}
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  error: {
    color: 'red',
    fontSize: 18,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'right',
  },
  disabledButton: {
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  detailsInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  descriptionInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  fieldsContainer: {
    marginTop: 20,
  },
  mediaSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  media: {
    width: '100%',
    height: 150,
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
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 2,
  },
  bottomSpacing: {
    height: 50,
  },
  mediaGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  marginTop: 10,
  marginBottom: 20,
},
mediaWrapper: {
  width: '30%',
  aspectRatio: 1,
  margin: '1.5%',
  position: 'relative',
  borderRadius: 8,
  overflow: 'hidden',
},
mediaImage: {
  width: '100%',
  height: '100%',
  borderRadius: 8,
},
deleteButton: {
  position: 'absolute',
  top: 5,
  right: 5,
  backgroundColor: 'rgba(255,0,0,0.8)',
  borderRadius: 12,
  width: 24,
  height: 24,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},
deleteButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
});