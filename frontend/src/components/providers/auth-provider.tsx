"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { UserOut } from "@/types"
import { getStoredToken, login as loginService, register as registerService, getMe, logout as logoutService } from "@/lib/auth"

type AuthContextType = {
  user: UserOut | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserOut | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  const fetchUser = React.useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const userData = await getMe()
      setUser(userData)
    } catch {
      logoutService()
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    await loginService({ email, password })
    const userData = await getMe()
    setUser(userData)
  }

  const register = async (email: string, password: string) => {
    await registerService({ email, password })
  }

  const logout = () => {
    logoutService()
    setUser(null)
    router.push("/login")
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}