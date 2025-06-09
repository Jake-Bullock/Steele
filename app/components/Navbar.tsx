import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSupabase } from "../_utils/contexts/SupabaseProvider";
import GlobalStyles from "../../assets/styles/GlobalStyles";
import { getUserProfilePicture } from "../_utils/lib/getUserProfilePicture.ts";

export default function Navbar() {
  const router = useRouter();
  const { session, initialized } = useSupabase();
  const pathname = usePathname();

  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfilePic() {
      if (session) {
        const url = await getUserProfilePicture();
        if (isMounted) setProfilePic(url);
      } else {
        setProfilePic(null);
      }
    }
    fetchProfilePic();
    return () => { isMounted = false; };
  }, [session]);

  // Check if we're on the profile page
  const isProfilePage = pathname === "/screens/ProfilePage";
  const isHomePage = pathname === "/";

  // Don't show navigation elements until auth is initialized
  if (!initialized) {
    return (
      <View style={GlobalStyles.navbar}>
        <Text style={GlobalStyles.navbarLogo}>Stele</Text>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  // Navigate to profile page
  const navigateToProfile = () => {
    router.push("/screens/ProfilePage");
  };

  // Navigate to create page
  const navigateToCreatePage = () => {
    router.push("/screens/CreatePost");
  };

  return (
    <View style={GlobalStyles.navbar}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {!isHomePage && (
          <TouchableOpacity
            style={GlobalStyles.navButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Image source={require("../../assets/images/arrow-left-solid.png")} style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={GlobalStyles.navbarLogo}>Stele</Text>
        </TouchableOpacity>
      </View>
      {session && (
        <TouchableOpacity
          style={GlobalStyles.navCenterButton}
          onPress={navigateToCreatePage}
          activeOpacity={0.7}
        >
          <Text style={GlobalStyles.navCenterButtonText}>+</Text>
        </TouchableOpacity>
      )}
      <View style={GlobalStyles.navLinks}>
        {session && !isProfilePage && (
          <TouchableOpacity
            style={GlobalStyles.navButton}
            onPress={navigateToProfile}
            activeOpacity={0.7}
          >
            {profilePic ? (
              <Image
                source={{ uri: profilePic }}
                style={{ width: "100%", height: "100%", borderRadius: 25, backgroundColor: "#eee" }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                width: "100%",
                height: "100%",
                borderRadius: 25,
                backgroundColor: "#ccc",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>P</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}