import { Session, User } from '@supabase/supabase-js'

// User profile type
export type Profile = {
  id: string
  email: string
  username: string | null
  updated_at: string
}

// Feeder type
export type Feeder = {
  id: number
  foodbrand: string | null
  created_at: string
}

// User-Feeder relationship type
export type UserOwnedFeeder = {
  user_id: string
  feeder_id: number
  created_at: string
}

// Auth context type
export type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  initialized: boolean
}

// Supabase error type
export type SupabaseError = {
  message: string
  status?: number
}

// Auth form data type
export type AuthFormData = {
  email: string
  password: string
}

// Profile update data type
export type ProfileUpdateData = {
  username?: string
  avatar_url?: string
}

export default {}; // avoid error