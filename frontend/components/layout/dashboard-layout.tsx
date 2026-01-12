"use client"

import type React from "react"

import { AppSidebar } from "./app-sidebar"
import { MobileNav } from "./mobile-nav"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { UserRole } from "@/types"
import { ThemeToggle } from "@/components/theme/theme-toggle"

interface DashboardLayoutProps {
  children: React.ReactNode
  variant: "superadmin" | "admin" | "app"
  allowedRoles?: UserRole[]
}

export function DashboardLayout({ children, variant, allowedRoles }: DashboardLayoutProps) {
  const { user, isLoading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
    if (!isLoading && user && allowedRoles && !hasRole(allowedRoles)) {
      if (user.role === "SUPERADMIN") {
        router.push("/superadmin")
      } else if (user.role === "DIRECTEUR") {
        router.push("/admin")
      } else {
        router.push("/app")
      }
    }
  }, [user, isLoading, router, allowedRoles, hasRole])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <AppSidebar variant={variant} />
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 md:hidden">
          <div className="flex items-center gap-4">
            <MobileNav variant={variant} />
            <span className="text-lg font-semibold">GestCom</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
