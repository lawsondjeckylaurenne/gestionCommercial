import { useAuth } from "@/contexts/auth-context"

export function usePermissions() {
  const { user, hasPermission, hasRole } = useAuth()

  return {
    // Stock management permissions
    canManageStock: hasPermission("manage_stock") || hasRole(["DIRECTEUR", "GERANT", "MAGASINIER"]),
    canDeleteStock: hasRole(["DIRECTEUR", "GERANT", "MAGASINIER"]), // Vendeur cannot delete stock
    canEditStock: hasRole(["DIRECTEUR", "GERANT", "MAGASINIER"]),
    canViewStock: hasPermission("view_products") || hasPermission("*"),

    // Product management permissions
    canCreateProduct: hasRole(["DIRECTEUR", "GERANT"]),
    canEditProduct: hasRole(["DIRECTEUR", "GERANT"]),
    canDeleteProduct: hasRole(["DIRECTEUR", "GERANT"]),
    canViewProducts: hasPermission("view_products") || hasPermission("*"),

    // Sales permissions
    canCreateSale: hasPermission("create_sale") || hasRole(["DIRECTEUR", "GERANT", "VENDEUR"]),
    canViewAllSales: hasRole(["DIRECTEUR", "GERANT"]),
    canViewOwnSales: hasPermission("view_own_sales") || hasPermission("*"),
    canDeleteSale: hasRole(["DIRECTEUR", "GERANT"]),

    // Team management permissions
    canManageTeam: hasPermission("manage_team") || hasRole(["DIRECTEUR"]),
    canManageStaff: hasPermission("manage_staff") || hasRole(["DIRECTEUR", "GERANT"]),
    canViewTeam: hasRole(["DIRECTEUR", "GERANT"]),

    // Reports and analytics
    canViewReports: hasPermission("view_reports") || hasRole(["DIRECTEUR", "GERANT"]),
    canViewDashboard: hasPermission("view_dashboard") || hasPermission("*"),

    // Subscription and settings
    canManageSubscription: hasPermission("manage_subscription") || hasRole(["DIRECTEUR"]),
    canViewSettings: hasRole(["DIRECTEUR", "GERANT"]),

    // Global admin permissions
    canManageTenants: hasRole(["SUPERADMIN"]),
    canViewGlobalAnalytics: hasRole(["SUPERADMIN"]),

    // User info
    currentUser: user,
    userRole: user?.role,
    isAdmin: hasRole(["SUPERADMIN"]),
    isDirector: hasRole(["DIRECTEUR"]),
    isManager: hasRole(["GERANT"]),
    isSeller: hasRole(["VENDEUR"]),
    isWarehouseManager: hasRole(["MAGASINIER"])
  }
}
