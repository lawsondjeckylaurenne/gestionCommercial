"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatCard } from "@/components/ui/stat-card"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, CreditCard, TrendingUp, BarChart3 } from "lucide-react"
import { apiRequest } from "@/lib/api"
import type { Tenant } from "@/types"

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalRevenue: 0, // Placeholder
    activeSubscriptions: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantsResponse, statsResponse] = await Promise.all([
            apiRequest("/tenants/list", { method: "GET" }),
            apiRequest("/stats/dashboard")
        ])

        if (tenantsResponse && tenantsResponse.content) {
          setTenants(tenantsResponse.content)
        }

        if (statsResponse && statsResponse.content) {
            setStats({
                totalTenants: statsResponse.content.totalTenants || 0,
                totalUsers: statsResponse.content.totalUsers || 0,
                totalRevenue: statsResponse.content.totalRevenue || 0,
                activeSubscriptions: statsResponse.content.totalTenants || 0 // Assuming all active
            })
        }
      } catch (error) {
        console.error("Failed to fetch superadmin stats", error)
      }
    }
    fetchData()
  }, [])

  return (
    <DashboardLayout variant="superadmin" allowedRoles={["SUPERADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Tableau de bord Global</h1>
          <p className="text-muted-foreground">Vue d'ensemble de tous les commerces</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Commerces actifs"
            value={stats.totalTenants}
            icon={Building2}
            trend={{ value: 12, isPositive: true }}
            description="vs mois dernier"
          />
          <StatCard
            title="Utilisateurs totaux"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend={{ value: 8, isPositive: true }}
            description="vs mois dernier"
          />
          <StatCard
            title="Revenus mensuels"
            value={`${stats.totalRevenue.toLocaleString()}€`}
            icon={TrendingUp}
            trend={{ value: 23, isPositive: true }}
            description="vs mois dernier"
          />
          <StatCard
            title="Abonnements actifs"
            value={stats.activeSubscriptions}
            icon={CreditCard}
            trend={{ value: 5, isPositive: true }}
            description="vs mois dernier"
          />
        </div>

        {/* Charts & Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mocked chart */}
          <RevenueChart
            data={[{ date: "Jan", amount: 0 }]}
            title="Évolution des revenus"
            description="Revenus mensuels de tous les commerces"
          />

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Commerces récents
              </CardTitle>
              <CardDescription>Les derniers commerces inscrits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants.slice(0, 5).map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tenant.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          BASIC
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Actif
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                      {/* <p className="text-xs text-muted-foreground">ce mois</p> */}
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
