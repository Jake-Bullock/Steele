import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import supabase from "../_utils/lib/supabase";

interface HuntingFieldDisplayProps {
  postId: string;
}

// This is the list of acceptable post details that we want to display
const acceptablePostDetails= [
  "created_at",
  "animal",
];

// for display purposes, we can map these keys to more user-friendly labels
const displayLabels: Record<string, string> = {
  created_at: "Time & Date",
  animal: "Animal",
};

const PostDetails = ({ postId }: HuntingFieldDisplayProps) => {
  const [postData, setPostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  console.log("HuntingPostDetails component mounted with postId:", postId);

  useEffect(() => {
    const fetchPostData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hunting_details")
        .select("*")
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
  }, [postId]);
  
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
      <View style={styles.grid}>
        {Object.entries(postData)
          .filter(([key]) => acceptablePostDetails.includes(key))
          .map(([key, value]) => (
            <View key={key} style={styles.gridItem}>
              <Text style={styles.label}>{displayLabels[key] || key}</Text>
              <Text style={styles.value}>
                {key === "created_at"
                  ? (() => {
                      const dateObj = new Date(value);
                      const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const date = dateObj.toLocaleDateString();
                      return `${time} • ${date}`;
                    })()
                  : String(value)}
              </Text>
            </View>
          ))}
      </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#f5f5f5",
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  value: {
    flexWrap: "wrap",
  },
});

export default PostDetails;