import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import supabase from '../lib/supabase'
import { AppState } from 'react-native'

type SupabaseContextType = {
  session: Session | null
  initialized: boolean
}

const SupabaseContext = createContext<SupabaseContextType>({
  session: null,
  initialized: false
})

function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Handle initialization
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setInitialized(true)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setInitialized(true)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Handle app state changes
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    })

    return () => {
      subscription.unsubscribe()
      appStateSubscription.remove()
    }
  }, [])

  return (
    <SupabaseContext.Provider value={{ session, initialized }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export default SupabaseProvider