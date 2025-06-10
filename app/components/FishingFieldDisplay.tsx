import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import supabase from "../_utils/lib/supabase";

interface FishingFieldDisplayProps {
  postId: string;
}

const PostDetails = ({ postId, tableName = "post" }: PostDetailsProps) => {
  const [postData, setPostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  console.log("PostDetails component mounted with postId:", postId, "and tableName:", tableName);

  useEffect(() => {
    const fetchPostData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("fishing_details")
        .select("fish")
        .eq("post_id", postId)
        .single();

      if (error) {
        console.error("Error fetching post data:", error);
        setPostData(null);
      } else {
        console.log("Fetched post data:", data); // <-- Debug statement here
        setPostData(data);
      }
      setLoading(false);
    };
    
    fetchPostData();
  }, [postId, tableName]);
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!postData) {
    return (
      <View style={styles.centered}>
        <Text>No data found for this post.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {Object.entries(postData).map(([key, value]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{key}:</Text>
          <Text style={styles.value}>{String(value)}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  label: {
    fontWeight: "bold",
    marginRight: 8,
    minWidth: 90,
  },
  value: {
    flex: 1,
    flexWrap: "wrap",
  },
});

export default PostDetails;