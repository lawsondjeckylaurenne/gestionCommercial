// Types pour le système RBAC et Multi-tenant

export type UserRole = "SUPERADMIN" | "DIRECTEUR" | "GERANT" | "VENDEUR" | "MAGASINIER"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId?: string
  imagePath?: string
  twoFactorEnabled?: boolean
  createdAt: Date
}

export interface Tenant {
  id: string
  name: string
  slug: string
  users: User[]
  _count?: {
    users: number
    products: number
    sales: number
  }
  createdAt: string
}

export interface Product {
  id: string
  name: string
  description?: string
  sku: string
  price: number
  stock: number
  category?: string
  tenantId: string
  imagePath?: string
  status?: "ACTIVE" | "DRAFT" | "OUT_OF_STOCK"
}

export interface Sale {
  id: string
  tenantId: string
  userId: string
  user?: {
    name: string
    email: string
    imagePath?: string
  }
  totalAmount: number
  items: SaleItem[]
  createdAt: string
}

export interface SaleItem {
  id?: string
  productId: string
  quantity: number
  unitPrice: number
  product?: Product
  remainingStock?: number
}

export interface DashboardStats {
  totalRevenue: number
  totalSales: number
  totalProducts: number
  totalUsers: number
  totalTenants?: number // For Superadmin
  activeSubscriptions?: number // For Superadmin
  revenueByPeriod: { date: string; amount: number }[]
  topProducts: { name: string; sales: number }[]
  recentSales?: Sale[]
  lowStock?: Product[]
}

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPERADMIN: ["*"], // Accès total
  DIRECTEUR: ["view_dashboard", "manage_team", "view_reports", "manage_subscription", "view_products", "view_sales"],
  GERANT: ["view_dashboard", "manage_staff", "view_reports", "manage_products", "view_sales"],
  VENDEUR: ["view_products", "create_sale", "view_own_sales"],
  MAGASINIER: ["view_products", "manage_stock", "view_inventory"],
}
