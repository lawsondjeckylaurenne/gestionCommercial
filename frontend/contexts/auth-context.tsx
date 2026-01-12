"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { type User, type UserRole, ROLE_PERMISSIONS } from "@/types"
import { apiRequest } from "@/lib/api"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, twoFactorToken?: string) => Promise<{ 
    success: boolean; 
    user?: User; 
    error?: string;
    require2FA?: boolean;
    require2FASetup?: boolean;
    userId?: string;
  }>
  logout: () => Promise<void>
  isLoading: boolean
  hasPermission: (permission: string) => boolean
  hasRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string, twoFactorToken?: string) => {
    setIsLoading(true)
    try {
      const requestBody: any = { email, password }
      if (twoFactorToken) {
        requestBody.twoFactorToken = twoFactorToken
      }

      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })

      if (response && response.content) {
        // Handle 2FA setup required
        if (response.content.require2FASetup) {
          setIsLoading(false)
          return { 
            success: false, 
            require2FASetup: true, 
            userId: response.content.userId,
            error: "Configuration 2FA requise pour votre rôle" 
          }
        }

        // Handle 2FA token required
        if (response.content.require2FA) {
          setIsLoading(false)
          return { 
            success: false, 
            require2FA: true, 
            userId: response.content.userId,
            error: "Code 2FA requis" 
          }
        }

        // Handle successful login
        if (response.content.accessToken) {
          localStorage.setItem("accessToken", response.content.accessToken)
        }
        if (response.content.user) {
          const user = response.content.user
          setUser(user)
          setIsLoading(false)
          return { success: true, user }
        }
      }
      
      setIsLoading(false)
      return { success: false, error: "Réponse invalide du serveur" }
    } catch (error: any) {
      console.error("Login failed:", error)
      setIsLoading(false)
      // Extract the specific error message from the API response error
      const errorMessage = error.message || "Une erreur est survenue lors de la connexion"
      return { success: false, error: errorMessage }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" })
    } catch (e) {
      console.error("Logout failed", e)
    }
    localStorage.removeItem("accessToken")
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false
      const permissions = ROLE_PERMISSIONS[user.role]
      // @ts-ignore
      return permissions.includes("*") || permissions.includes(permission)
    },
    [user],
  )

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false
      return roles.includes(user.role)
    },
    [user],
  )

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
