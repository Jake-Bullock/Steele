import supabase from '../lib/supabase'

/**
 * Fetches the current user's profile picture URL from Supabase.
 * @returns The profile picture URL string, or null if not set or user not logged in.
 */
export async function getUserProfilePicture(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('pfp_url')
    .eq('id', session.user.id)
    .single()

  if (error) {
    console.error('Error fetching profile picture:', error)
    return null
  }

  return data?.pfp_url ?? null
}