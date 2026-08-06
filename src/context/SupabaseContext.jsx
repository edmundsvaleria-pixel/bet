import { createContext, useContext, useState, useEffect } from 'react'
import supabase, { getSupabaseAdmin } from '../lib/supabase'
import { authService } from '../services/supabase/authService'
import { walletService } from '../services/supabase/walletService'

const SupabaseContext = createContext()

export const SupabaseProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [balance, setBalance] = useState({ available: 0, withdrawable: 0 })

  // ... (all existing functions: loadUser, signIn, signUp, signOut, refreshBalance, getAllUsers, adminUpdateUser, adminDeleteUser)

  // ✅ NEW: Direct balance updater
  const updateBalance = (newBalance) => {
    setBalance(newBalance)
  }

  const value = {
    signIn,
    signUp,
    signOut,
    refreshBalance,
    updateBalance,   // ✅ Exposed
    getAllUsers,
    adminUpdateUser,
    adminDeleteUser,
    auth: authService,
    wallet: walletService,
    supabase,
    user,
    balance,
    loading,
    session,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) throw new Error('useSupabase must be used within a SupabaseProvider')
  return context
}