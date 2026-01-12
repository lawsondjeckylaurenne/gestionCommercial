"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Building2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiRequest } from "@/lib/api"
import type { Tenant } from "@/types"

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTenant, setNewTenant] = useState({ 
    name: "", 
    slug: "", 
    adminEmail: "", 
    adminPassword: "", 
    adminPasswordConfirm: "",
    adminName: "",
    plan: "BASIC" 
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchTenants = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest("/tenants/list", { method: "GET" }) // Changed to GET as per doc update, but checked implementation
      // Wait, backend route is POST /list in some places or GET?
      // Doc says GET /api/tenants/list. Backend route might be different. 
      // Checking doc: "Endpoint: GET /api/tenants/list" (I updated it).
      // Let's assume GET.
      if (response && response.content) {
        setTenants(response.content)
      }
    } catch (error) {
      console.error("Failed to fetch tenants", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!newTenant.name.trim()) {
      newErrors.name = "Le nom est requis"
    } else if (newTenant.name.trim().length < 3) {
      newErrors.name = "Le nom doit contenir au moins 3 caractères"
    }
    
    if (!newTenant.slug.trim()) {
      newErrors.slug = "Le domaine est requis"
    } else if (newTenant.slug.trim().length < 3) {
      newErrors.slug = "Le domaine doit contenir au moins 3 caractères"
    } else if (!/^[a-z0-9-]+$/.test(newTenant.slug)) {
      newErrors.slug = "Le domaine ne peut contenir que des lettres minuscules, chiffres et tirets"
    }

    if (!newTenant.adminEmail.trim()) {
      newErrors.adminEmail = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTenant.adminEmail)) {
      newErrors.adminEmail = "Format d'email invalide"
    }

    if (!newTenant.adminPassword.trim()) {
      newErrors.adminPassword = "Le mot de passe est requis"
    } else if (newTenant.adminPassword.length < 6) {
      newErrors.adminPassword = "Le mot de passe doit contenir au moins 6 caractères"
    }

    if (!newTenant.adminPasswordConfirm.trim()) {
      newErrors.adminPasswordConfirm = "La confirmation du mot de passe est requise"
    } else if (newTenant.adminPassword !== newTenant.adminPasswordConfirm) {
      newErrors.adminPasswordConfirm = "Les mots de passe ne correspondent pas"
    }
    
    if (!newTenant.adminName.trim()) {
      newErrors.adminName = "Le nom du directeur est requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateTenant = async () => {
    if (validateForm()) {
      try {
        await apiRequest("/tenants/create", {
          method: "POST",
          body: JSON.stringify(newTenant),
        })
        setIsDialogOpen(false)
        setNewTenant({ name: "", slug: "", adminEmail: "", adminPassword: "", adminPasswordConfirm: "", adminName: "", plan: "BASIC" })
        setErrors({})
        fetchTenants()
      } catch (error: any) {
        console.error("Failed to create tenant", error)
        setErrors({ ...errors, submit: error.message || "Erreur lors de la création du commerce" })
      }
    }
  }

  return (
    <DashboardLayout variant="superadmin" allowedRoles={["SUPERADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Commerces</h1>
            <p className="text-muted-foreground">Gérer tous les commerces de la plateforme</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau commerce
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un commerce</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer un nouvel espace commercial et son administrateur.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {errors.submit && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {errors.submit}
                    </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du commerce</Label>
                  <Input
                    id="name"
                    placeholder="Ma Boutique"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domaine/Espace</Label>
                  <div className="flex">
                    <Input
                      id="domain"
                      placeholder="ma-boutique"
                      value={newTenant.slug}
                      onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase() })}
                      className="rounded-r-none"
                    />
                    <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                      .gestcom.com
                    </span>
                  </div>
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="adminName">Nom du Directeur</Label>
                    <Input
                        id="adminName"
                        placeholder="Jean Directeur"
                        value={newTenant.adminName}
                        onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                    />
                    {errors.adminName && <p className="text-sm text-destructive">{errors.adminName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email du directeur</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="directeur@email.com"
                    value={newTenant.adminEmail}
                    onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                  />
                  {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe provisoire</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        value={newTenant.adminPassword}
                        onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                    />
                    {errors.adminPassword && <p className="text-sm text-destructive">{errors.adminPassword}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="passwordConfirm">Confirmer le mot de passe</Label>
                    <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="********"
                        value={newTenant.adminPasswordConfirm}
                        onChange={(e) => setNewTenant({ ...newTenant, adminPasswordConfirm: e.target.value })}
                    />
                    {errors.adminPasswordConfirm && <p className="text-sm text-destructive">{errors.adminPasswordConfirm}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Plan d'abonnement</Label>
                  <Select value={newTenant.plan} onValueChange={(value) => setNewTenant({ ...newTenant, plan: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASIC">Basic - 29€/mois</SelectItem>
                      <SelectItem value="PRO">Pro - 79€/mois</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise - 199€/mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTenant}>Créer le commerce</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Liste des commerces</CardTitle>
                <CardDescription>{filteredTenants.length} commerces trouvés</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commerce</TableHead>
                    <TableHead className="hidden sm:table-cell">Directeur</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => {
                    const director = tenant.users?.find(u => u.role === 'DIRECTEUR') || { name: 'N/A' };
                    return (
                        <TableRow key={tenant.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground">{tenant.slug}.gestcom.com</p>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{director.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{tenant._count?.users || 0}</TableCell>
                        <TableCell>
                            {new Date(tenant.createdAt).toLocaleDateString()}
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
                                <DropdownMenuItem>Modifier</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Suspendre</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
