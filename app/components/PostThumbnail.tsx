import React from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface PostThumbnailProps {
  title: string;
  qr_code_url?: string;
  onPress: () => void;
}

const PostThumbnail = ({ title, qr_code_url, onPress }: PostThumbnailProps): JSX.Element => {
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
});

export default PostThumbnail;
