import React from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import supabase from '../_utils/lib/supabase';
import { useRouter } from 'expo-router'

interface PostThumbnailProps {
  title: string;
  postId: string;
  userId: string;
  qr_code_url?: string;
  onPress: () => void;
}

const PostThumbnail = ({ title, qr_code_url, onPress, postId, userId }: PostThumbnailProps): JSX.Element => {
  const router = useRouter();

  const deletePost = async (postId: string, userId: string) => {
    try {
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
    }
    router.push('/screens/Posts')
  }
  
  return (
    <>
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
      {qr_code_url ? (
        //<QRCode value={`${process.env.EXPO_PUBLIC_NGROK_SERVER}/screens/${qr_code_url}`} />
        <QRCode value={`https://steele-ovwr.vercel.app/screens/${qr_code_url}`} />
      ) : (
        <Text style={styles.title}>QR Code not available</Text>
      )}
      <TouchableOpacity style={styles.deleteButton} onPress={() => deletePost(postId, userId)}>
        <Text style={styles.title}>Delete Post</Text>
      </TouchableOpacity>
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
  deleteButton: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#ff0000",
    borderRadius: 5,
  },
});

export default PostThumbnail;
