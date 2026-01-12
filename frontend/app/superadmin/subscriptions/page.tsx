"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MoreHorizontal, CreditCard, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatCard } from "@/components/ui/stat-card"
import { Progress } from "@/components/ui/progress"

interface Subscription {
  id: string
  tenant: string
  plan: "BASIC" | "PRO" | "ENTERPRISE"
  status: "ACTIVE" | "EXPIRED" | "TRIAL" | "CANCELLED"
  amount: number
  nextBilling: string
  startDate: string
}

const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    tenant: "Boutique Mode Paris",
    plan: "PRO",
    status: "ACTIVE",
    amount: 79,
    nextBilling: "2024-08-15",
    startDate: "2024-01-15",
  },
  {
    id: "2",
    tenant: "Tech Store Lyon",
    plan: "ENTERPRISE",
    status: "ACTIVE",
    amount: 199,
    nextBilling: "2024-08-20",
    startDate: "2024-02-20",
  },
  {
    id: "3",
    tenant: "Épicerie Bio Marseille",
    plan: "BASIC",
    status: "TRIAL",
    amount: 29,
    nextBilling: "2024-08-01",
    startDate: "2024-07-15",
  },
  {
    id: "4",
    tenant: "Librairie Bordeaux",
    plan: "PRO",
    status: "EXPIRED",
    amount: 79,
    nextBilling: "-",
    startDate: "2023-12-01",
  },
  {
    id: "5",
    tenant: "Pharmacie Lille",
    plan: "ENTERPRISE",
    status: "ACTIVE",
    amount: 199,
    nextBilling: "2024-08-05",
    startDate: "2024-04-05",
  },
  {
    id: "6",
    tenant: "Café Central",
    plan: "BASIC",
    status: "CANCELLED",
    amount: 29,
    nextBilling: "-",
    startDate: "2024-02-10",
  },
]

const planPrices = { BASIC: 29, PRO: 79, ENTERPRISE: 199 }

export default function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredSubs = mockSubscriptions.filter((sub) => {
    const matchesSearch = sub.tenant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlan = planFilter === "all" || sub.plan === planFilter
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter
    return matchesSearch && matchesPlan && matchesStatus
  })

  const stats = {
    mrr: mockSubscriptions.filter((s) => s.status === "ACTIVE").reduce((acc, s) => acc + s.amount, 0),
    active: mockSubscriptions.filter((s) => s.status === "ACTIVE").length,
    trial: mockSubscriptions.filter((s) => s.status === "TRIAL").length,
    churn: mockSubscriptions.filter((s) => s.status === "CANCELLED" || s.status === "EXPIRED").length,
  }

  return (
    <DashboardLayout variant="superadmin" allowedRoles={["SUPERADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Abonnements</h1>
          <p className="text-muted-foreground">Gérer les abonnements et la facturation</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="MRR"
            value={`${stats.mrr}€`}
            icon={TrendingUp}
            trend={{ value: 12, isPositive: true }}
            description="revenus mensuels"
          />
          <StatCard title="Actifs" value={stats.active} icon={CheckCircle} description="abonnements actifs" />
          <StatCard title="En essai" value={stats.trial} icon={CreditCard} description="période d'essai" />
          <StatCard title="Churn" value={stats.churn} icon={AlertTriangle} description="annulés/expirés" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {(["BASIC", "PRO", "ENTERPRISE"] as const).map((plan) => {
            const count = mockSubscriptions.filter((s) => s.plan === plan && s.status === "ACTIVE").length
            const total = mockSubscriptions.filter((s) => s.status === "ACTIVE").length
            return (
              <Card key={plan} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{plan}</CardTitle>
                  <CardDescription>{planPrices[plan]}€/mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{count} abonnés</span>
                      <span>{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
                    </div>
                    <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Liste des abonnements</CardTitle>
                <CardDescription>{filteredSubs.length} abonnements</CardDescription>
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
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="ACTIVE">Actif</SelectItem>
                    <SelectItem value="TRIAL">Essai</SelectItem>
                    <SelectItem value="EXPIRED">Expiré</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commerce</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="hidden sm:table-cell">Montant</TableHead>
                    <TableHead className="hidden md:table-cell">Prochaine fact.</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.tenant}</TableCell>
                      <TableCell>
                        <Badge variant={sub.plan === "ENTERPRISE" ? "default" : "secondary"}>{sub.plan}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{sub.amount}€/mois</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{sub.nextBilling}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sub.status === "ACTIVE" ? "outline" : sub.status === "TRIAL" ? "secondary" : "destructive"
                          }
                        >
                          {sub.status === "ACTIVE"
                            ? "Actif"
                            : sub.status === "TRIAL"
                              ? "Essai"
                              : sub.status === "EXPIRED"
                                ? "Expiré"
                                : "Annulé"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
                            <DropdownMenuItem>Changer de plan</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Annuler</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
