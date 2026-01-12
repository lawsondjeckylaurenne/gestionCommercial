"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, CreditCard, Calendar, Users, Package, Zap, ArrowRight } from "lucide-react"

const currentPlan = {
  name: "Pro",
  price: 79,
  billingCycle: "monthly",
  nextBilling: "15 août 2024",
  startDate: "15 janvier 2024",
  usage: { users: 8, maxUsers: 15, products: 89, maxProducts: 500, storage: 2.5, maxStorage: 10 },
}

const plans = [
  {
    name: "Basic",
    price: 29,
    features: ["5 utilisateurs", "100 produits", "1 Go stockage", "Support email"],
    highlight: false,
  },
  {
    name: "Pro",
    price: 79,
    features: [
      "15 utilisateurs",
      "500 produits",
      "10 Go stockage",
      "Support prioritaire",
      "Rapports avancés",
      "API access",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 199,
    features: [
      "Utilisateurs illimités",
      "Produits illimités",
      "100 Go stockage",
      "Support dédié",
      "Rapports personnalisés",
      "API + Webhooks",
      "SSO",
    ],
    highlight: false,
  },
]

const invoices = [
  { id: "INV-2024-07", date: "15 juillet 2024", amount: 79, status: "PAID" },
  { id: "INV-2024-06", date: "15 juin 2024", amount: 79, status: "PAID" },
  { id: "INV-2024-05", date: "15 mai 2024", amount: 79, status: "PAID" },
  { id: "INV-2024-04", date: "15 avril 2024", amount: 79, status: "PAID" },
]

export default function SubscriptionPage() {
  return (
    <DashboardLayout variant="admin" allowedRoles={["DIRECTEUR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Abonnement</h1>
          <p className="text-muted-foreground">Gérer votre plan et facturation</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plan actuel</CardTitle>
                  <CardDescription>Vous êtes sur le plan {currentPlan.name}</CardDescription>
                </div>
                <Badge variant="default" className="text-lg px-4 py-1">
                  {currentPlan.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{currentPlan.price}€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prochaine facturation</p>
                    <p className="font-medium">{currentPlan.nextBilling}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mode de paiement</p>
                    <p className="font-medium">Visa •••• 4242</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Utilisation</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Utilisateurs
                      </span>
                      <span>
                        {currentPlan.usage.users}/{currentPlan.usage.maxUsers}
                      </span>
                    </div>
                    <Progress value={(currentPlan.usage.users / currentPlan.usage.maxUsers) * 100} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Produits
                      </span>
                      <span>
                        {currentPlan.usage.products}/{currentPlan.usage.maxProducts}
                      </span>
                    </div>
                    <Progress
                      value={(currentPlan.usage.products / currentPlan.usage.maxProducts) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Stockage
                      </span>
                      <span>
                        {currentPlan.usage.storage}/{currentPlan.usage.maxStorage} Go
                      </span>
                    </div>
                    <Progress
                      value={(currentPlan.usage.storage / currentPlan.usage.maxStorage) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Historique factures</CardTitle>
              <CardDescription>Vos dernières factures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-sm">{invoice.id}</p>
                      <p className="text-xs text-muted-foreground">{invoice.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{invoice.amount}€</p>
                      <Badge variant="outline" className="text-xs">
                        Payée
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4">
                Voir tout l'historique
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Changer de plan</CardTitle>
            <CardDescription>Comparez les fonctionnalités et choisissez le plan adapté</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-lg border p-6 ${plan.highlight ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  {plan.highlight && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Actuel</Badge>}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold">{plan.price}€</span>
                        <span className="text-muted-foreground">/mois</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.highlight ? "secondary" : "outline"}
                      className="w-full"
                      disabled={plan.highlight}
                    >
                      {plan.highlight ? "Plan actuel" : "Choisir ce plan"}
                      {!plan.highlight && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
