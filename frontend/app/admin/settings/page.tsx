"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Save, Store, Bell, Printer, Receipt, Upload, Palette } from "lucide-react"
import { ThemeSettings } from "@/components/theme/theme-settings"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: "Ma Boutique",
    storeAddress: "123 Rue de la République",
    storePhone: "01 23 45 67 89",
    storeEmail: "contact@boutique.com",
    currency: "EUR",
    timezone: "Europe/Paris",
    taxRate: 20,
    receiptFooter: "Merci de votre visite !",
    lowStockAlert: true,
    lowStockThreshold: 5,
    emailNotifications: true,
    dailyReport: true,
    autoPrint: false,
  })

  const handleSave = () => {
      // Placeholder for future API integration
      console.log("Saving settings:", settings)
      alert("Paramètres enregistrés (Simulation)")
  }

  return (
    <DashboardLayout variant="admin" allowedRoles={["DIRECTEUR", "GERANT"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Paramètres</h1>
            <p className="text-muted-foreground">Configuration de votre commerce</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="store">
              <Store className="mr-2 h-4 w-4 hidden sm:inline" />
              Commerce
            </TabsTrigger>
            <TabsTrigger value="pos">
              <Receipt className="mr-2 h-4 w-4 hidden sm:inline" />
              Caisse
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4 hidden sm:inline" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="print">
              <Printer className="mr-2 h-4 w-4 hidden sm:inline" />
              Impression
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="mr-2 h-4 w-4 hidden sm:inline" />
              Apparence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Informations du commerce</CardTitle>
                <CardDescription>Détails affichés sur les tickets et factures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">MB</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Changer le logo
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nom du commerce</Label>
                    <Input
                      id="storeName"
                      value={settings.storeName}
                      onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Téléphone</Label>
                    <Input
                      id="storePhone"
                      value={settings.storePhone}
                      onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Adresse</Label>
                  <Textarea
                    id="storeAddress"
                    value={settings.storeAddress}
                    onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select value={settings.currency} onValueChange={(v) => setSettings({ ...settings, currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="USD">Dollar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Taux TVA (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pos" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Configuration caisse</CardTitle>
                <CardDescription>Paramètres de l'interface de vente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receiptFooter">Message pied de ticket</Label>
                  <Textarea
                    id="receiptFooter"
                    value={settings.receiptFooter}
                    onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Alerte stock bas</p>
                    <p className="text-sm text-muted-foreground">Avertir quand un produit atteint le seuil minimal</p>
                  </div>
                  <Switch
                    checked={settings.lowStockAlert}
                    onCheckedChange={(v) => setSettings({ ...settings, lowStockAlert: v })}
                  />
                </div>
                {settings.lowStockAlert && (
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Seuil d'alerte (unités)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={settings.lowStockThreshold}
                      onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number.parseInt(e.target.value) })}
                      className="w-32"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Préférences de notification</CardTitle>
                <CardDescription>Gérer les alertes et rapports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Notifications email</p>
                    <p className="text-sm text-muted-foreground">Recevoir les alertes importantes par email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Rapport quotidien</p>
                    <p className="text-sm text-muted-foreground">Résumé des ventes envoyé chaque soir</p>
                  </div>
                  <Switch
                    checked={settings.dailyReport}
                    onCheckedChange={(v) => setSettings({ ...settings, dailyReport: v })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="print" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Configuration impression</CardTitle>
                <CardDescription>Paramètres d'impression des tickets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Impression automatique</p>
                    <p className="text-sm text-muted-foreground">Imprimer le ticket après chaque vente</p>
                  </div>
                  <Switch
                    checked={settings.autoPrint}
                    onCheckedChange={(v) => setSettings({ ...settings, autoPrint: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imprimante par défaut</Label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Imprimante système</SelectItem>
                      <SelectItem value="thermal">Imprimante thermique USB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <ThemeSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
