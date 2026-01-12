"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye, ShoppingCart, TrendingUp, CreditCard, Receipt } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api"
import type { Sale } from "@/types"

const paymentLabels = { CASH: "Espèces", CARD: "Carte", MOBILE: "Mobile" }

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  const fetchSales = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest("/sales/list")
      if (response && response.content) {
        setSales(response.content)
      }
    } catch (error) {
      console.error("Failed to fetch sales", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [])

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // @ts-ignore - backend includes user relation
      (sale.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    // Date filtering
    let matchesDate = true
    if (dateFilter !== "all") {
        const saleDate = new Date(sale.createdAt)
        const now = new Date()
        
        if (dateFilter === "today") {
            matchesDate = saleDate.toDateString() === now.toDateString()
        } else if (dateFilter === "week") {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = saleDate >= weekAgo
        } else if (dateFilter === "month") {
            matchesDate = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
        }
    }

    // Payment method filtering not yet supported by backend model, so we skip it or mock it if we had it
    // Assuming backend doesn't return paymentMethod yet, or it's default
    const matchesPayment = paymentFilter === "all" // || sale.paymentMethod === paymentFilter
    return matchesSearch && matchesPayment && matchesDate
  })

  const stats = {
    // @ts-ignore
    totalSales: sales.reduce((acc, s) => acc + s.totalAmount, 0),
    totalTransactions: sales.length,
    averageBasket: sales.length > 0 ? Math.round(
      // @ts-ignore
      sales.reduce((acc, s) => acc + s.totalAmount, 0) / sales.length
    ) : 0,
    refunds: 0, // Not tracked yet
  }

  return (
    <DashboardLayout variant="admin" allowedRoles={["DIRECTEUR", "GERANT"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Ventes</h1>
            <p className="text-muted-foreground">Historique et suivi des ventes</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Ventes totales"
            value={`${stats.totalSales.toLocaleString()}€`}
            icon={TrendingUp}
            // trend={{ value: 12, isPositive: true }}
            description="global"
          />
          <StatCard
            title="Transactions"
            value={stats.totalTransactions}
            icon={ShoppingCart}
            description="total"
          />
          <StatCard
            title="Panier moyen"
            value={`${stats.averageBasket}€`}
            icon={CreditCard}
            // trend={{ value: 5, isPositive: true }}
            description="global"
          />
          <StatCard title="Remboursements" value={stats.refunds} icon={Receipt} description="total" />
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Historique des ventes</CardTitle>
                <CardDescription>{filteredSales.length} transactions</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="all">Tout</SelectItem>
                  </SelectContent>
                </Select>
                {/* Payment filter disabled as data not available */}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf.</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Vendeur</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">{sale.id.substring(0, 8)}...</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleString()}
                      </TableCell>
                      {/* @ts-ignore */}
                      <TableCell className="hidden md:table-cell">{sale.user?.name || 'Inconnu'}</TableCell>
                      <TableCell className="font-medium">{sale.totalAmount}€</TableCell>
                      <TableCell>
                        <Badge variant="outline">Terminé</Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Détails de la vente</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-medium">{new Date(sale.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Vendeur</p>
                                  <p className="font-medium">{sale.user?.name || 'Inconnu'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Articles</p>
                                  <p className="font-medium">{sale.items?.length || 0}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total</p>
                                  <p className="font-medium text-lg">{sale.totalAmount}€</p>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <h4 className="font-medium mb-2">Articles</h4>
                                <div className="space-y-2">
                                    {sale.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.product?.name || item.productId} (x{item.quantity})</span>
                                            <span>{(item.unitPrice * item.quantity).toFixed(2)}€</span>
                                        </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
