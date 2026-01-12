"use client"

import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Building2,
  Warehouse,
  CreditCard,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { SidebarNav } from "@/components/ui/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UserRole } from "@/types"
import { ThemeToggle } from "@/components/theme/theme-toggle"

const superadminNav = [
  { title: "Tableau de bord", href: "/superadmin", icon: LayoutDashboard },
  { title: "Commerces", href: "/superadmin/tenants", icon: Building2 },
  { title: "Utilisateurs", href: "/superadmin/users", icon: Users },
  { title: "Abonnements", href: "/superadmin/subscriptions", icon: CreditCard },
  { title: "Statistiques", href: "/superadmin/analytics", icon: BarChart3 },
  { title: "Paramètres", href: "/superadmin/settings", icon: Settings },
]

const adminNav = [
  { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { title: "Équipe", href: "/admin/team", icon: Users, permission: "manage_team" },
  { title: "Produits", href: "/admin/products", icon: Package },
  { title: "Ventes", href: "/admin/sales", icon: ShoppingCart },
  { title: "Rapports", href: "/admin/reports", icon: BarChart3 },
  { title: "Abonnement", href: "/admin/subscription", icon: CreditCard },
  { title: "Paramètres", href: "/admin/settings", icon: Settings },
]

const appNav = [
  { title: "Accueil", href: "/app", icon: LayoutDashboard },
  { title: "Caisse", href: "/app/pos", icon: ShoppingCart, roles: ["VENDEUR", "GERANT"] as UserRole[] },
  { title: "Produits", href: "/app/products", icon: Package },
  { title: "Stock", href: "/app/inventory", icon: Warehouse, roles: ["MAGASINIER", "GERANT"] as UserRole[] },
  { title: "Mes ventes", href: "/app/my-sales", icon: BarChart3, roles: ["VENDEUR"] as UserRole[] },
]

interface AppSidebarProps {
  variant: "superadmin" | "admin" | "app"
}

export function AppSidebar({ variant }: AppSidebarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const navItems = variant === "superadmin" ? superadminNav : variant === "admin" ? adminNav : appNav

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return (name || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">GestCom</span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <SidebarNav items={navItems} />
      </div>

      {/* User menu */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                  {user ? getInitials(user.name) : "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium text-sidebar-foreground">{user?.name}</span>
                <span className="text-xs text-sidebar-foreground/60">{user?.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres du compte
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
