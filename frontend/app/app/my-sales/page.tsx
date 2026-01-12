"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { useAuth } from "@/contexts/auth-context"
import { TrendingUp, ShoppingCart, Target, Award, Eye } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api"
import { formatCurrency, formatCurrencyCompact } from "@/lib/currency"
import type { Sale } from "@/types"

const paymentLabels = { CASH: "Espèces", CARD: "Carte", MOBILE: "Mobile" }

export default function MySalesPage() {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [period, setPeriod] = useState("week")
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

  const mySales = useMemo(() => {
    if (!user) return []
    return sales.filter(s => s.userId === user.id)
  }, [sales, user])

  const stats = useMemo(() => {
    const totalSales = mySales.reduce((acc, s) => acc + Number(s.totalAmount), 0)
    const salesCount = mySales.length
    const target = 10000 // Hardcoded target
    const rank = 1 // Hardcoded rank for now

    return { totalSales, salesCount, target, rank }
  }, [mySales])

  const progress = (stats.totalSales / stats.target) * 100

  // Calculate chart data (last 7 days)
  const chartData = useMemo(() => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    const data = new Array(7).fill(0).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return { 
            day: days[d.getDay()], 
            date: d.toISOString().split('T')[0],
            amount: 0 
        }
    })

    mySales.forEach(sale => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]
        const dataPoint = data.find(d => d.date === saleDate)
        if (dataPoint) {
            dataPoint.amount += Number(sale.totalAmount)
        }
    })

    return data
  }, [mySales])

  return (
    <DashboardLayout variant="app" allowedRoles={["VENDEUR", "GERANT"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Mes ventes</h1>
            <p className="text-muted-foreground">Suivi de vos performances, {user?.name}</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Mes ventes"
            value={formatCurrencyCompact(stats.totalSales)}
            icon={TrendingUp}
            // trend={{ value: 18, isPositive: true }}
            description="total"
          />
          <StatCard title="Transactions" value={stats.salesCount} icon={ShoppingCart} description="ventes réalisées" />
          <StatCard
            title="Objectif"
            value={`${Math.round(progress)}%`}
            icon={Target}
            description={`${formatCurrencyCompact(stats.target)} à atteindre`}
          />
          <StatCard title="Classement" value={`#${stats.rank}`} icon={Award} description="dans l'équipe" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Évolution de mes ventes</CardTitle>
              <CardDescription>Performance quotidienne (7 derniers jours)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => formatCurrencyCompact(v)} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Progression objectif</CardTitle>
              <CardDescription>Objectif mensuel : {formatCurrency(stats.target)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</span>
                  <span className="text-muted-foreground">/ {formatCurrency(stats.target)}</span>
                </div>
                <div className="h-4 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Il vous reste {formatCurrency(Math.max(0, stats.target - stats.totalSales))} pour atteindre votre objectif
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Ventes moyennes/jour</p>
                  <p className="text-xl font-bold">{formatCurrency(Math.round(stats.totalSales / 7))}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Panier moyen</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.salesCount > 0 ? Math.round(stats.totalSales / stats.salesCount) : 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Historique de mes ventes</CardTitle>
            <CardDescription>{mySales.length} transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf.</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Articles</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="hidden sm:table-cell">Paiement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mySales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">{sale.id.substring(0, 8)}...</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{sale.items?.length || 0}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(sale.totalAmount))}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">Carte</Badge> {/* Mocked as payment info missing */}
                      </TableCell>
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
                              <DialogTitle>Détails vente {sale.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-medium">{new Date(sale.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Articles</p>
                                        <p className="font-medium">{sale.items?.length || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total</p>
                                        <p className="font-medium text-lg">{formatCurrency(Number(sale.totalAmount))}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-medium mb-2">Articles</h4>
                                    <div className="space-y-2">
                                        {sale.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span>{item.product?.name || item.productId} (x{item.quantity})</span>
                                                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
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
