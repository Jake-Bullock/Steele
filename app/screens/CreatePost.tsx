import uuid from "react-native-uuid";
import React, { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import supabase from "../_utils/lib/supabase";
import { useAuth } from "../_utils/hooks/useAuth";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { useSupabase } from '../_utils/contexts/SupabaseProvider'

export default function CreatePost() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [images, setImages] = useState<{ uri: string; type: string; name?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { session } = useSupabase()

  const [postType, setPostType] = useState<"hunting" | "fishing">("hunting");
  const [animal, setAnimal] = useState("");
  const [fish, setFish] = useState("");

  // Helper function to get file extension and content type
  const getFileInfo = (type: string, uri: string) => {
    let extension = '.png';
    let contentType = 'image/png';
    
    if (type.startsWith('video/')) {
      if (type.includes('mp4')) {
        extension = '.mp4';
        contentType = 'video/mp4';
      } else if (type.includes('quicktime') || type.includes('mov')) {
        extension = '.mov';
        contentType = 'video/quicktime';
      } else if (type.includes('webm')) {
        extension = '.webm';
        contentType = 'video/webm';
      } else {
        extension = '.mp4'; // Default for videos
        contentType = 'video/mp4';
      }
    } else if (type.startsWith('image/')) {
      if (type.includes('jpeg') || type.includes('jpg')) {
        extension = '.jpg';
        contentType = 'image/jpeg';
      } else if (type.includes('png')) {
        extension = '.png';
        contentType = 'image/png';
      } else if (type.includes('gif')) {
        extension = '.gif';
        contentType = 'image/gif';
      } else if (type.includes('webp')) {
        extension = '.webp';
        contentType = 'image/webp';
      }
    }
    
    return { extension, contentType };
  };

  // Function to pick multiple images/videos
  const pickImages = async () => {
    if (Platform.OS === "web") {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,video/*"; 
        input.multiple = true;

        input.onchange = (event: Event) => {
          const target = event.target as HTMLInputElement | null;

          if (target && target.files) {
            const files = Array.from(target.files).map((file) => ({
              uri: URL.createObjectURL(file),
              type: file.type || "image/png",
              name: file.name,
            }));
            setImages((prevImages) => [...prevImages, ...files]);
            resolve(files);
          }
        };

        input.click();
      });
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          type: asset.type ?? "image",
          name: asset.fileName ?? undefined,
        }));
        setImages((prevImages) => [...prevImages, ...newFiles]);
      }
    }
  };

  // Function to remove an image from the selection
  const removeImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // Function to upload multiple images/videos to Supabase
  const uploadImages = async () => {
    if (images.length === 0) {
      Alert.alert("Error", "Please select at least one image or video.");
      return [];
    }

    const uploadedUrls: string[] = [];
    const failedUploads: string[] = [];

    const convertToBase64 = async (uri: string): Promise<string> => {
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result.split(",")[1]);
            } else {
              console.error("FileReader result is not a string:", reader.result);
              resolve("");
            }
          };
        });
      } else {
        return await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    };

    try {
      for (const file of images) {
        try {
          // Get proper file info based on type
          const { extension, contentType } = getFileInfo(file.type, file.uri);
          
          // Convert the file to base64
          const base64 = await convertToBase64(file.uri);

          // Check file size (base64 is ~33% larger than the binary)
          const approximateFileSizeInMB = (base64.length * 0.75) / (1024 * 1024);
          
          // Different size limits for different file types
          const sizeLimit = file.type.startsWith('video/') ? 50 : 5; // 50MB for videos, 5MB for images
          
          if (approximateFileSizeInMB > sizeLimit) {
            failedUploads.push(
              `File too large (${Math.round(approximateFileSizeInMB)}MB). Limit: ${sizeLimit}MB`
            );
            continue;
          }

          // Generate a unique file name with proper extension
          const fileName = `private/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}${extension}`;

          console.log(`Uploading ${file.type} file: ${fileName}`);

          // Upload the file to the 'posts' bucket with correct content type
          const { data, error } = await supabase.storage
            .from("posts")
            .upload(fileName, decode(base64), { 
              contentType: contentType,
              cacheControl: '3600'
            });

          if (error) {
            if (error.message.includes("timed out") && data) {
              console.warn("Timeout occurred, but the file was uploaded successfully.");
            } else {
              failedUploads.push(`${file.name || file.uri}: ${error.message}`);
              console.error("Upload error:", error);
              continue;
            }
          }

          // Get the public URL for the uploaded file
          const {
            data: { publicUrl },
          } = supabase.storage.from("posts").getPublicUrl(fileName);

          uploadedUrls.push(publicUrl);
          console.log(`Successfully uploaded: ${publicUrl}`);
        } catch (individualError) {
          failedUploads.push(`${file.name || file.uri}: ${individualError}`);
          console.error("Individual file error:", individualError);
        }
      }

      // If some uploads failed, show a warning
      if (failedUploads.length > 0) {
        Alert.alert(
          "Warning",
          `${failedUploads.length} of ${images.length} files failed to upload.\n\n${failedUploads.join('\n')}`
        );
      }

      return uploadedUrls;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return uploadedUrls;
    }
  };

  // Function to handle post creation
  const handleCreatePost = async () => {
    const postId = uuid.v4();
    if (!title || !description) {
      Alert.alert("Error", "Please fill in both title and description.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to create a post.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload all images/videos
      const fileUrls = await uploadImages();
      if (fileUrls.length === 0 && images.length > 0) {
        setLoading(false);
        return;
      }

      // 2. Create the post
      const { data: postData, error: postError } = await supabase
        .from("post")
        .insert([
          {
            id: postId,
            title,
            description,
            user_id: user.id,
            qr_code_url: `PostDetail/${postId}`,
            post_type: postType,
          },
        ])
        .select();

      if (postError) throw postError;

      if (!postData || postData.length === 0) {
        throw new Error("Failed to create post");
      }
      // 3. Insert into the correct details table
      if (postType === "hunting") {
        const { error: detailsError } = await supabase.from("hunting_details").insert([
        { post_id: postId, animal: animal }
      ]);
      if (detailsError) throw detailsError;
      } else if (postType === "fishing") {
        const { error: detailsError } = await supabase.from("fishing_details").insert([
        { post_id: postId, fish: fish }
      ]);
      if (detailsError) throw detailsError;
      }

      console.log("postId:::", postId);
      console.log("post Data:::", postData);

      // 4. Associate files with the post
      if (fileUrls.length > 0) {
        for (let i = 0; i < fileUrls.length; i++) {
          const url = fileUrls[i];
          const file = images[i];
          const imagesId = uuid.v4();
          
          const { data: postImageId, error: imagesError } = await supabase
            .from("post_images")
            .insert({
              id: imagesId,
              image_url: url,
              post_id: postId,
              file_type: file.type.startsWith('video/') ? 'video' : 'image', // Add file type if your schema supports it
            })
            .select();

          if (imagesError) throw imagesError;
        }
      }

      Alert.alert("Success", "Post created successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setImages([]);
      
      router.push(`/screens/PostDetail/${postId}`);
    } catch (error: any) {
      Alert.alert("Error creating post", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    router.push("/(auth)/sign-in");
    return null;
  } else {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create a Post</Text>
          <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Post Type</Text>
          <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5 }}>
            <Picker
              selectedValue={postType}
              onValueChange={(itemValue) => setPostType(itemValue)}
              style={{ height: 40 }}
            >
              <Picker.Item label="Hunting" value="hunting" />
              <Picker.Item label="Fishing" value="fishing" />
            </Picker>
          </View>
        </View>

        {postType === "hunting" && (
          <TextInput
            style={styles.input}
            placeholder="Enter Animal"
            value={animal}
            onChangeText={setAnimal}
          />
        )}
        {postType === "fishing" && (
          <TextInput
            style={styles.input}
            placeholder="Enter Fish"
            value={fish}
            onChangeText={setFish}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Enter Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.inputMultiline}
          placeholder="Enter Description"
          placeholderTextColor={"#667"}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Button title="Select Images/Videos" onPress={pickImages} />

        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.subtitle}>
              Selected Files: {images.length}
            </Text>
            <ScrollView horizontal style={styles.imageScroll}>
              {images.map((file, index) => (
                <VideoPreviewItem 
                  key={index} 
                  file={file} 
                  index={index} 
                  onRemove={removeImage}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <Button
          title={loading ? "Creating Post..." : "Create Post"}
          onPress={handleCreatePost}
          disabled={loading || !title || !description}
        />
      </ScrollView>
    );
  }
}

// Component for rendering video/image preview items
const VideoPreviewItem = ({ file, index, onRemove }) => {
  const player = useVideoPlayer(file.type.startsWith("video") ? file.uri : null, player => {
    if (player) {
      player.loop = false;
      // Don't auto-play in preview
    }
  });

  return (
    <View style={styles.imageWrapper}>
      {file.type.startsWith("video") ? (
        <VideoView
          style={styles.image}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={true}
          contentFit="cover"
        />
      ) : (
        <Image source={{ uri: file.uri }} style={styles.image} />
      )}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(index)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
      {/* File type indicator */}
      <View style={styles.fileTypeIndicator}>
        <Text style={styles.fileTypeText}>
          {file.type.startsWith("video") ? "VIDEO" : "IMAGE"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    height: 100,
    textAlignVertical: "top",
  },
  imagesContainer: {
    marginVertical: 15,
  },
  imageScroll: {
    flexDirection: "row",
    marginBottom: 20,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  fileTypeIndicator: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fileTypeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});