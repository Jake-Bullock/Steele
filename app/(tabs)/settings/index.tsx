import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, Stack } from "expo-router";
import { useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import { router } from "expo-router";

// Import User type from Supabase
import { User } from "@supabase/supabase-js";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        Alert.alert("Error Accessing User");
      }
    });
  }, []);

  async function doLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error Signing Out User", error.message);
    }
  }

  return (
    <ScrollView>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: true, title: "Settings" }} />
        <View style={{ padding: 16 }}>
          <Text>{JSON.stringify(user, null, 2)}</Text>
          <TouchableOpacity onPress={doLogout} style={styles.link}>
            <Text style={{ color: "white" }}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );

  // return (
  //   <>
  //     <Stack.Screen options={{ headerShown: true, title: "Settings" }} />
  //     <View style={styles.container}>
  //       <Text>Index of Settings Tab</Text>
  //       <Link
  //         href={{
  //           pathname: "/settings/[settingType]",
  //           params: { settingType: "account" },
  //         }}
  //       >
  //         <Text style={styles.link}>Goto Account Settings</Text>
  //       </Link>
  //       <Link href={{
  //           pathname: "/settings/[settingType]",
  //           params: { settingType: "network" },
  //         }}>
  //         <Text style={styles.link}>Goto Network Settings</Text>
  //       </Link>
  //     </View>
  //   </>
  // );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  link: {
    color: "white", // Change text color for better contrast
    backgroundColor: "blue", // Button background color
    paddingVertical: 10, // Vertical padding for button height
    paddingHorizontal: 20, // Horizontal padding for button width
    borderRadius: 5, // Rounded corners
    textAlign: "center",
  },
});
