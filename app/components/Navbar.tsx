import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSupabase } from "../_utils/contexts/SupabaseProvider";
import GlobalStyles from "../../assets/styles/GlobalStyles";

export default function Navbar() {
  const router = useRouter();
  const { session, initialized } = useSupabase();
  const pathname = usePathname();

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
            activeOpacity={0.7} // Improves touch feedback
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
          activeOpacity={0.7} // Improves touch feedback
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
            <Text style={GlobalStyles.navButtonText}>Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
