import uuid from "react-native-uuid";
import React, { useState } from "react";
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
import { useAuth } from "../_utils/hooks/useAuth"; // Assume you have an auth context
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { useSupabase } from '../_utils/contexts/SupabaseProvider'

export default function CreatePost() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Get current authenticated user
  const { session } = useSupabase()

  // Function to pick multiple images
  const pickImages = async () => {
    if (Platform.OS === "web") {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;

        input.onchange = (event: Event) => {
          const target = event.target as HTMLInputElement | null;

          if (target && target.files) {
            // ✅ Type guard to prevent null error
            const files = Array.from(target.files).map((file) =>
              URL.createObjectURL(file)
            );
            setImages((prevImages) => [...prevImages, ...files]);
            resolve(files);
          }
        };

        input.click();
      });
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const newImageUris = result.assets.map((asset) => asset.uri);
        setImages((prevImages) => [...prevImages, ...newImageUris]);
      }
    }
  };

  // Function to remove an image from the selection
  const removeImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // Function to upload multiple images to Supabase
  // Function to upload multiple images to Supabase
  const uploadImages = async () => {
    if (images.length === 0) {
      Alert.alert("Error", "Please select at least one image.");
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
              resolve(reader.result.split(",")[1]); // ✅ Safe because result is a string
            } else {
              console.error(
                "FileReader result is not a string:",
                reader.result
              );
              resolve(""); // Return an empty string if something goes wrong
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
      for (const imageUri of images) {
        try {
          // Convert the image to base64
          const base64 = await convertToBase64(imageUri);

          // Check file size (base64 is ~33% larger than the binary)
          const approximateFileSizeInMB =
            (base64.length * 0.75) / (1024 * 1024);
          if (approximateFileSizeInMB > 5) {
            // 5MB limit as an example
            failedUploads.push(
              `File too large (${Math.round(approximateFileSizeInMB)}MB)`
            );
            continue;
          }

          // Generate a unique file name
          const fileName = `private/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.png`;

          // Upload the image to the 'posts' bucket
          const { data, error } = await supabase.storage
            .from("posts")
            .upload(fileName, decode(base64), { contentType: "image/png" });

          if (error) {
            // Check if the error is a timeout but the image was uploaded successfully
            if (error.message.includes("timed out") && data) {
              console.warn(
                "Timeout occurred, but the image was uploaded successfully."
              );
            } else {
              failedUploads.push(imageUri);
              console.error("Upload error:", error);
              continue; // Continue with the next image
            }
          }

          // Get the public URL for the uploaded file
          const {
            data: { publicUrl },
          } = supabase.storage.from("posts").getPublicUrl(fileName);

          // Add the public URL to the list
          uploadedUrls.push(publicUrl);
        } catch (individualError) {
          failedUploads.push(imageUri);
          console.error("Individual image error:", individualError);
        }
      }

      // If some uploads failed, show a warning
      if (failedUploads.length > 0) {
        Alert.alert(
          "Warning",
          `${failedUploads.length} of ${images.length} images failed to upload.`
        );
      }

      return uploadedUrls;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      return uploadedUrls; // Return any successfully uploaded URLs
    }
  };
  // Function to handle post creation
  const handleCreatePost = async () => {
    const postId = uuid.v4(); // Generate a unique post ID for the images
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
      // 1. Upload all images
      const imageUrls = await uploadImages();
      if (imageUrls.length === 0 && images.length > 0) {
        setLoading(false);
        //setIsUploading(false); // Reset uploading state
        return; // Error already shown in uploadImages
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
            // Optional: Add QR code URL if you have it
            // qr_code_url: qrCodeUrl
          },
        ])
        .select();

      if (postError) throw postError;

      if (!postData || postData.length === 0) {
        throw new Error("Failed to create post");
      }

      console.log("postId:::", postId);
      console.log("post Data:::", postData);
      // 3. Associate images with the post
      if (imageUrls.length > 0) {
        for (const url of imageUrls) {
          const imagesId = uuid.v4();
          const { data: postImageId, error: imagesError } = await supabase
            .from("post_images")
            .insert({
              id: imagesId,
              image_url: url,
              post_id: postId,
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
    } catch (error: any) {
      Alert.alert("Error creating post", error.message);
    } finally {
      setLoading(false);
    }
    router.push(`/screens/PostDetail/${postId}`); // Navigate to the PostDetail screen after creating the post
  };

  if (!session) {
    router.push("/(auth)/sign-in");
    return null;
  } else {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create a Post</Text>
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

        <Button title="Select Images" onPress={pickImages} />

        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.subtitle}>
              Selected Images: {images.length}
            </Text>
            <ScrollView horizontal style={styles.imageScroll}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: img }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
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
});
