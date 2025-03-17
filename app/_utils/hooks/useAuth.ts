import { useState } from 'react'
import supabase from '../lib/supabase'
import { useRouter } from 'expo-router'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.replace('/(home)')
    } catch (error: any) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return true
    } catch (error: any) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.replace('/(auth)/sign-in')
    } catch (error: any) {
      throw error
    }
  }

  return {
    signIn,
    signUp,
    signOut,
    loading
  }
}
export default useAuth