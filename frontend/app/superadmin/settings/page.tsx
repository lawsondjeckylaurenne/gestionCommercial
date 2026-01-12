"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Globe, Bell, Shield, CreditCard, Mail, Palette } from "lucide-react"
import { ThemeSettings } from "@/components/theme/theme-settings"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    platformName: "GestCom",
    supportEmail: "support@gestcom.com",
    maxTrialDays: 14,
    maintenanceMode: false,
    allowNewSignups: true,
    requireEmailVerification: true,
    defaultCurrency: "EUR",
    emailNotifications: true,
    slackNotifications: false,
    webhookUrl: "",
  })

  const handleSave = () => {
    console.log("Saving settings:", settings)
  }

  return (
    <DashboardLayout variant="superadmin" allowedRoles={["SUPERADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Paramètres</h1>
            <p className="text-muted-foreground">Configuration globale de la plateforme</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="general">
              <Globe className="mr-2 h-4 w-4 hidden sm:inline" />
              Général
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4 hidden sm:inline" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="mr-2 h-4 w-4 hidden sm:inline" />
              Facturation
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4 hidden sm:inline" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="mr-2 h-4 w-4 hidden sm:inline" />
              Apparence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Paramètres de base de la plateforme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Nom de la plateforme</Label>
                    <Input
                      id="platformName"
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Email support</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="trialDays">Jours d'essai par défaut</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      value={settings.maxTrialDays}
                      onChange={(e) => setSettings({ ...settings, maxTrialDays: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise par défaut</Label>
                    <Select
                      value={settings.defaultCurrency}
                      onValueChange={(v) => setSettings({ ...settings, defaultCurrency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="USD">Dollar ($)</SelectItem>
                        <SelectItem value="GBP">Livre (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Mode maintenance</p>
                    <p className="text-sm text-muted-foreground">Désactive temporairement l'accès à la plateforme</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Sécurité et accès</CardTitle>
                <CardDescription>Paramètres de sécurité de la plateforme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Autoriser les inscriptions</p>
                    <p className="text-sm text-muted-foreground">Permet aux nouveaux commerces de s'inscrire</p>
                  </div>
                  <Switch
                    checked={settings.allowNewSignups}
                    onCheckedChange={(v) => setSettings({ ...settings, allowNewSignups: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Vérification email obligatoire</p>
                    <p className="text-sm text-muted-foreground">Les utilisateurs doivent vérifier leur email</p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(v) => setSettings({ ...settings, requireEmailVerification: v })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Configuration Stripe</CardTitle>
                <CardDescription>Paramètres de paiement et facturation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Clé API Stripe (Live)</Label>
                  <Input type="password" placeholder="sk_live_..." />
                </div>
                <div className="space-y-2">
                  <Label>Clé API Stripe (Test)</Label>
                  <Input type="password" placeholder="sk_test_..." />
                </div>
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <Input type="password" placeholder="whsec_..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Canaux de notification</CardTitle>
                <CardDescription>Configurer les alertes et notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Notifications email</p>
                      <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Webhook</Label>
                  <Input
                    placeholder="https://hooks.slack.com/..."
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Recevez des notifications vers Slack, Discord, etc.</p>
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
