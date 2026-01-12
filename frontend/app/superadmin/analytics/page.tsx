"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { TrendingUp, Users, Building2, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const revenueData = [
  { month: "Jan", revenue: 12000, users: 850 },
  { month: "Fév", revenue: 15000, users: 920 },
  { month: "Mar", revenue: 18000, users: 980 },
  { month: "Avr", revenue: 22000, users: 1050 },
  { month: "Mai", revenue: 28000, users: 1120 },
  { month: "Juin", revenue: 35000, users: 1180 },
  { month: "Juil", revenue: 45600, users: 1234 },
]

const planDistribution = [
  { name: "Basic", value: 45, color: "hsl(var(--chart-3))" },
  { name: "Pro", value: 85, color: "hsl(var(--chart-1))" },
  { name: "Enterprise", value: 26, color: "hsl(var(--chart-4))" },
]

const topTenants = [
  { name: "Tech Store Lyon", revenue: 5800, growth: 15 },
  { name: "Boutique Mode Paris", revenue: 2500, growth: 8 },
  { name: "Pharmacie Lille", revenue: 2100, growth: 12 },
  { name: "Épicerie Bio Marseille", revenue: 890, growth: -3 },
  { name: "Café Central", revenue: 650, growth: 22 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d")

  return (
    <DashboardLayout variant="superadmin" allowedRoles={["SUPERADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Statistiques</h1>
            <p className="text-muted-foreground">Analyse globale de la plateforme</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Revenus totaux"
            value="45 600€"
            icon={TrendingUp}
            trend={{ value: 23, isPositive: true }}
            description="vs période précédente"
          />
          <StatCard
            title="Nouveaux utilisateurs"
            value="+234"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            description="cette période"
          />
          <StatCard
            title="Nouveaux commerces"
            value="+18"
            icon={Building2}
            trend={{ value: 8, isPositive: true }}
            description="cette période"
          />
          <StatCard
            title="Transactions"
            value="12 458"
            icon={ShoppingCart}
            trend={{ value: 15, isPositive: true }}
            description="cette période"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Évolution des revenus</CardTitle>
              <CardDescription>Revenus mensuels de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
                    <YAxis className="text-muted-foreground" fontSize={12} tickFormatter={(v) => `${v / 1000}k€`} />
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
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Croissance utilisateurs</CardTitle>
              <CardDescription>Nombre d'utilisateurs actifs par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
                    <YAxis className="text-muted-foreground" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Répartition des plans</CardTitle>
              <CardDescription>Distribution par type d'abonnement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {planDistribution.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-muted-foreground">{p.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle>Top commerces</CardTitle>
              <CardDescription>Classement par chiffre d'affaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTenants.map((tenant, i) => (
                  <div
                    key={tenant.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">{tenant.revenue.toLocaleString()}€ ce mois</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm ${tenant.growth >= 0 ? "text-primary" : "text-destructive"}`}
                    >
                      {tenant.growth >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {Math.abs(tenant.growth)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
