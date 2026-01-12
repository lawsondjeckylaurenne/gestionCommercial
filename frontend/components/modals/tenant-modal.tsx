"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { Tenant } from "@/types"

interface TenantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: Tenant | null
  onSave: (data: Partial<Tenant>) => Promise<void>
}

const PLANS = [
  { value: "BASIC", label: "Basic", price: "29€/mois" },
  { value: "PRO", label: "Pro", price: "79€/mois" },
  { value: "ENTERPRISE", label: "Enterprise", price: "199€/mois" },
]

export function TenantModal({ open, onOpenChange, tenant, onSave }: TenantModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    subscriptionPlan: "" as Tenant["subscriptionPlan"] | "",
    directeurEmail: "",
    directeurName: "",
  })

  const isEdit = !!tenant

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        domain: tenant.domain,
        subscriptionPlan: tenant.subscriptionPlan,
        directeurEmail: "",
        directeurName: "",
      })
    } else {
      setFormData({
        name: "",
        domain: "",
        subscriptionPlan: "",
        directeurEmail: "",
        directeurName: "",
      })
    }
  }, [tenant, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        ...tenant,
        name: formData.name,
        domain: formData.domain,
        subscriptionPlan: formData.subscriptionPlan as Tenant["subscriptionPlan"],
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le commerce" : "Ajouter un commerce"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez les informations du commerce." : "Créez un nouveau commerce avec son directeur."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du commerce *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ma Boutique"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domaine *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                }
                placeholder="ma-boutique"
                required
              />
              <span className="text-muted-foreground text-sm whitespace-nowrap">.gestion-saas.com</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan d'abonnement *</Label>
            <Select
              value={formData.subscriptionPlan}
              onValueChange={(value) =>
                setFormData({ ...formData, subscriptionPlan: value as Tenant["subscriptionPlan"] })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un plan" />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{plan.label}</span>
                      <span className="text-muted-foreground text-sm">{plan.price}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEdit && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Compte Directeur</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="directeurName">Nom du directeur *</Label>
                    <Input
                      id="directeurName"
                      value={formData.directeurName}
                      onChange={(e) => setFormData({ ...formData, directeurName: e.target.value })}
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="directeurEmail">Email du directeur *</Label>
                    <Input
                      id="directeurEmail"
                      type="email"
                      value={formData.directeurEmail}
                      onChange={(e) => setFormData({ ...formData, directeurEmail: e.target.value })}
                      placeholder="directeur@example.com"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
