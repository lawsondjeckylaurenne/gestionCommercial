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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import type { Product } from "@/types"
import { Plus, Minus, Package } from "lucide-react"

interface StockAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSave: (productId: string, adjustment: number, reason: string) => Promise<void>
}

export function StockAdjustmentModal({ open, onOpenChange, product, onSave }: StockAdjustmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (open) {
      setAdjustmentType("add")
      setQuantity("")
      setReason("")
    }
  }, [open])

  if (!product) return null

  const adjustment = adjustmentType === "add" ? Number.parseInt(quantity) || 0 : -(Number.parseInt(quantity) || 0)
  const newStock = product.stock + adjustment

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quantity || Number.parseInt(quantity) <= 0) return
    if (newStock < 0) return

    setLoading(true)
    try {
      await onSave(product.id, adjustment, reason)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajuster le stock
          </DialogTitle>
          <DialogDescription>
            Produit: <span className="font-medium text-foreground">{product.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Stock actuel</p>
            <p className="text-3xl font-bold">{product.stock}</p>
          </div>

          <div className="space-y-3">
            <Label>Type d'ajustement</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(value) => setAdjustmentType(value as "add" | "remove")}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="add"
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  adjustmentType === "add" ? "border-primary bg-primary/5" : "border-muted"
                }`}
              >
                <RadioGroupItem value="add" id="add" className="sr-only" />
                <Plus className="h-5 w-5 text-green-600" />
                <span>Entrée</span>
              </Label>
              <Label
                htmlFor="remove"
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  adjustmentType === "remove" ? "border-primary bg-primary/5" : "border-muted"
                }`}
              >
                <RadioGroupItem value="remove" id="remove" className="sr-only" />
                <Minus className="h-5 w-5 text-red-600" />
                <span>Sortie</span>
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={adjustmentType === "remove" ? product.stock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              required
            />
            {adjustmentType === "remove" && Number.parseInt(quantity) > product.stock && (
              <p className="text-sm text-destructive">Stock insuffisant</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motif</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Réception commande fournisseur..."
              rows={2}
            />
          </div>

          {quantity && Number.parseInt(quantity) > 0 && newStock >= 0 && (
            <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nouveau stock:</span>
              <span className={`text-xl font-bold ${adjustment > 0 ? "text-green-600" : "text-red-600"}`}>
                {newStock}
              </span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !quantity || Number.parseInt(quantity) <= 0 || newStock < 0}>
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              Confirmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
