"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatCard } from "@/components/ui/stat-card"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Package, ShoppingCart, Users, TrendingUp, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { apiRequest } from "@/lib/api"
import type { DashboardStats, Sale } from "@/types"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest("/stats/dashboard")
      if (response && response.content) {
        setStats(response.content)
        if (response.content.recentSales) {
            setRecentSales(response.content.recentSales)
        }
        if (response.content.lowStock) {
            setLowStock(response.content.lowStock)
        }
      }
    } catch (error) {
      console.error("Failed to fetch stats", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <DashboardLayout variant="admin" allowedRoles={["DIRECTEUR", "GERANT"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Bonjour, {user?.name}</h1>
            <p className="text-muted-foreground">Voici un aperçu de votre commerce aujourd'hui</p>
          </div>
          <Button asChild>
            <Link href="/admin/sales">
              Voir les rapports
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Chiffre d'affaires"
            value={`${stats?.totalRevenue?.toLocaleString() || 0}€`}
            icon={TrendingUp}
            trend={{ value: 15, isPositive: true }}
            description="total"
          />
          <StatCard
            title="Ventes totales"
            value={stats?.totalSales || 0}
            icon={ShoppingCart}
            trend={{ value: 8, isPositive: true }}
            description="total"
          />
          <StatCard
            title="Produits en stock"
            value={stats?.totalProducts || 0}
            icon={Package}
            // trend={{ value: -3, isPositive: false }}
            description="références"
          />
          <StatCard title="Équipe" value={stats?.totalUsers || 0} icon={Users} description="membres actifs" />
        </div>

        {/* Charts & Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mocked chart data for now as backend might not return timeseries yet */}
          <RevenueChart data={[{ date: "Lun", amount: 0 }]} title="Ventes de la semaine" description="Évolution du chiffre d'affaires" />

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ventes récentes</CardTitle>
                <CardDescription>Les dernières transactions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/sales">Voir tout</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sale.user?.name || "Vente " + sale.id.substring(0,6)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="font-semibold">{sale.totalAmount}€</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        <Card className="bg-card border-border border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Alerte Stock Bas</CardTitle>
            <CardDescription>Ces produits nécessitent un réapprovisionnement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    {/* <p className="text-xs text-muted-foreground">Seuil: {product.threshold} unités</p> */}
                  </div>
                  <Badge variant="destructive">{product.stock} restants</Badge>
                </div>
              ))}
              {lowStock.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit en rupture de stock.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
