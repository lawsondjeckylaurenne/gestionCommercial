"use client"

import { useState } from "react"
import { Menu, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/ui/sidebar-nav"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/types"
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, Settings, Warehouse, CreditCard } from "lucide-react"

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
  { title: "Équipe", href: "/admin/team", icon: Users },
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

interface MobileNavProps {
  variant: "superadmin" | "admin" | "app"
}

export function MobileNav({ variant }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const navItems = variant === "superadmin" ? superadminNav : variant === "admin" ? adminNav : appNav

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">GestCom</span>
        </div>
        <div className="px-4 py-4">
          <SidebarNav items={navItems} />
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-sm text-sidebar-foreground/60">
          Connecté: {user?.name}
        </div>
      </SheetContent>
    </Sheet>
  )
}
