"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, TrendingUp, Users, Package, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { apiRequest } from "@/lib/api"
import type { DashboardStats } from "@/types"

// Mock chart data (backend doesn't provide time series yet)
const revenueData = [
  { day: "Lun", revenue: 1200, orders: 15 },
  { day: "Mar", revenue: 1800, orders: 22 },
  { day: "Mer", revenue: 1500, orders: 18 },
  { day: "Jeu", revenue: 2200, orders: 28 },
  { day: "Ven", revenue: 2800, orders: 35 },
  { day: "Sam", revenue: 3500, orders: 42 },
  { day: "Dim", revenue: 1500, orders: 19 },
]

const categoryData = [
  { name: "Smartphones", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Ordinateurs", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Audio", value: 15, color: "hsl(var(--chart-3))" },
  { name: "Accessoires", value: 15, color: "hsl(var(--chart-4))" },
]

const topProductsMock = [
  { name: "iPhone 15 Pro", sales: 45, revenue: 53955, growth: 12 },
  { name: "MacBook Air M3", sales: 28, revenue: 36372, growth: 8 },
  { name: "AirPods Pro 2", sales: 65, revenue: 18135, growth: 22 },
  { name: "iPad Pro 12.9", sales: 18, revenue: 21582, growth: -5 },
  { name: "Apple Watch Ultra 2", sales: 22, revenue: 19778, growth: 15 },
]

const sellerPerformance = [
  { name: "Pierre Durand", sales: 85, revenue: 42500, target: 40000 },
  { name: "Sophie Bernard", sales: 72, revenue: 36000, target: 35000 },
  { name: "Marie Martin", sales: 58, revenue: 29000, target: 30000 },
  { name: "Luc Petit", sales: 45, revenue: 22500, target: 25000 },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState("week")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiRequest("/stats/dashboard")
        if (response && response.content) {
          setStats(response.content)
        }
      } catch (error) {
        console.error("Failed to fetch reports stats", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <DashboardLayout variant="admin" allowedRoles={["DIRECTEUR", "GERANT"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Rapports</h1>
            <p className="text-muted-foreground">Analyse détaillée des performances</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                  <p className="text-2xl font-bold">{stats?.totalRevenue?.toLocaleString() || 0}€</p>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                    +15% vs semaine dernière
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commandes</p>
                  <p className="text-2xl font-bold">{stats?.totalSales || 0}</p>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                    +8%
                  </div>
                </div>
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Panier moyen</p>
                  <p className="text-2xl font-bold">
                    {stats && stats.totalSales > 0 
                        ? Math.round(stats.totalRevenue / stats.totalSales) 
                        : 0}€
                  </p>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                    +5%
                  </div>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clients uniques</p>
                  <p className="text-2xl font-bold">142</p>
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <ArrowDownRight className="h-4 w-4" />
                    -3%
                  </div>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Évolution du chiffre d'affaires</CardTitle>
                  <CardDescription>Revenus quotidiens</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="day" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(v) => `${v}€`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Répartition par catégorie</CardTitle>
                  <CardDescription>Ventes par catégorie de produits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categoryData.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {categoryData.map((c) => (
                      <div key={c.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-sm text-muted-foreground">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Top produits</CardTitle>
                <CardDescription>Produits les plus vendus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProductsMock.map((product, i) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.sales} ventes • {product.revenue.toLocaleString()}€
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm ${product.growth >= 0 ? "text-primary" : "text-destructive"}`}
                      >
                        {product.growth >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {Math.abs(product.growth)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Performance de l'équipe</CardTitle>
                <CardDescription>Objectifs et résultats par vendeur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {sellerPerformance.map((seller) => {
                    const progress = (seller.revenue / seller.target) * 100
                    const isOnTarget = progress >= 100
                    return (
                      <div key={seller.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{seller.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {seller.sales} ventes • {seller.revenue.toLocaleString()}€
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${isOnTarget ? "text-primary" : "text-muted-foreground"}`}>
                              {Math.round(progress)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Objectif: {seller.target.toLocaleString()}€</p>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isOnTarget ? "bg-primary" : "bg-muted-foreground"}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
