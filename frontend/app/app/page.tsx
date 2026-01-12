"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Package, ShoppingCart, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { apiRequest } from "@/lib/api"
import type { Product, Sale } from "@/types"

export default function AppDashboard() {
  const { user, hasRole } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  const isVendeur = hasRole(["VENDEUR"])
  const isMagasinier = hasRole(["MAGASINIER"])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productsRes, salesRes] = await Promise.all([
            apiRequest("/products/list"),
            apiRequest("/sales/list")
        ])

        if (productsRes && productsRes.content) setProducts(productsRes.content)
        if (salesRes && salesRes.content) setSales(salesRes.content)
      } catch (error) {
        console.error("Failed to fetch app data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const salesStats = useMemo(() => {
    if (!user) return { todaySales: 0, todayRevenue: 0, avgBasket: 0 }
    
    // Filter sales for current user
    const mySales = sales.filter(s => s.userId === user.id)
    
    // Filter for today
    const today = new Date().toDateString()
    const todaySalesList = mySales.filter(s => new Date(s.createdAt).toDateString() === today)
    
    // @ts-ignore
    const todayRevenue = todaySalesList.reduce((acc, s) => acc + s.totalAmount, 0)
    // @ts-ignore
    const totalRevenue = mySales.reduce((acc, s) => acc + s.totalAmount, 0)
    
    const avgBasket = mySales.length > 0 ? Math.round(totalRevenue / mySales.length) : 0

    return {
        todaySales: todaySalesList.length,
        todayRevenue,
        avgBasket
    }
  }, [sales, user])

  const stockStats = useMemo(() => {
      const lowStock = products.filter(p => p.stock < 5 && p.stock > 0)
      const outOfStock = products.filter(p => p.stock === 0)
      
      return {
          totalProducts: products.length,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          lowStockList: [...outOfStock, ...lowStock].slice(0, 5)
      }
  }, [products])

  return (
    <DashboardLayout variant="app" allowedRoles={["GERANT", "VENDEUR", "MAGASINIER"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Bienvenue, {user?.name}</h1>
          <p className="text-muted-foreground">
            {isVendeur && "Accédez à la caisse pour enregistrer vos ventes"}
            {isMagasinier && "Gérez le stock et l'inventaire"}
            {!isVendeur && !isMagasinier && "Supervisez les opérations de votre équipe"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(isVendeur || hasRole(["GERANT"])) && (
            <Card className="bg-card border-border hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Caisse
                </CardTitle>
                <CardDescription>Enregistrer une nouvelle vente</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/app/pos">Ouvrir la caisse</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Produits
              </CardTitle>
              <CardDescription>Consulter le catalogue</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/app/products">Voir les produits</Link>
              </Button>
            </CardContent>
          </Card>

          {(isMagasinier || hasRole(["GERANT"])) && (
            <Card className="bg-card border-border hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Stock
                </CardTitle>
                <CardDescription>Gérer l'inventaire</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/app/inventory">Gérer le stock</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats pour vendeur */}
        {isVendeur && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Mes performances aujourd'hui</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Ventes du jour" value={salesStats.todaySales} icon={ShoppingCart} description="transactions" />
              <StatCard
                title="Chiffre d'affaires"
                value={`${salesStats.todayRevenue.toLocaleString()}€`}
                icon={TrendingUp}
                trend={{ value: 15, isPositive: true }}
              />
              <StatCard title="Panier moyen" value={`${salesStats.avgBasket}€`} icon={Package} />
              <StatCard title="Temps moyen" value="3 min" icon={Clock} description="par transaction" />
            </div>
          </div>
        )}

        {/* Stats pour magasinier */}
        {isMagasinier && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">État du stock</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Produits en stock" value={stockStats.totalProducts} icon={Package} />
              <StatCard title="Stock bas" value={stockStats.lowStockCount} icon={Package} description="produits à réapprovisionner" />
              <StatCard title="Ruptures" value={stockStats.outOfStockCount} icon={Package} description="produits épuisés" />
            </div>

            <Card className="bg-card border-border border-l-4 border-l-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Produits à réapprovisionner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stockStats.lowStockList.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                      <span>{product.name}</span>
                      <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                        {product.stock === 0 ? "Rupture" : `${product.stock} restants`}
                      </Badge>
                    </div>
                  ))}
                  {stockStats.lowStockList.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit en alerte.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
