// context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabaseClient } from '../utils/supabase/client'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data?.user || null)
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)