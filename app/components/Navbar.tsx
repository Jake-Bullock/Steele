import React from "react"
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { useSupabase } from '../_utils/contexts/SupabaseProvider'
import GlobalStyles from '../../assets/styles/GlobalStyles'

export default function Navbar() {
  const router = useRouter()
  const { session, initialized } = useSupabase()
  const pathname = usePathname()
  
  // Check if we're on the profile page
  const isProfilePage = pathname === '/screens/ProfilePage'

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
    router.push('/screens/ProfilePage');
  }

  return (
    <View style={GlobalStyles.navbar}>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={GlobalStyles.navbarLogo}>Stele</Text>
      </TouchableOpacity>
      
      <View style={GlobalStyles.navLinks}>
        {session && !isProfilePage && (
          <TouchableOpacity 
            style={GlobalStyles.navButton}
            onPress={navigateToProfile}
            activeOpacity={0.7} // This improves touch feedback
          >
            <Text style={GlobalStyles.navButtonText}>Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}