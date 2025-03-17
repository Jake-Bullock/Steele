import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://cfkfyktmqlkuonhqlvza.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNma2Z5a3RtcWxrdW9uaHFsdnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0OTMxMjMsImV4cCI6MjA1NTA2OTEyM30.HowNfE0YbXflOn30j-86SOKaNbf8IX7QVZ54qaKKvdQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export default supabase;