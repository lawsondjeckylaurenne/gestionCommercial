"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Sale } from "@/types"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Receipt, User, Calendar, CreditCard } from "lucide-react"

interface SaleDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale | null
}

const STATUS_CONFIG = {
  COMPLETED: { label: "Complétée", variant: "default" as const },
  PENDING: { label: "En attente", variant: "secondary" as const },
  CANCELLED: { label: "Annulée", variant: "destructive" as const },
}

export function SaleDetailModal({ open, onOpenChange, sale }: SaleDetailModalProps) {
  if (!sale) return null

  const status = STATUS_CONFIG[sale.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Vente #{sale.id.slice(0, 8)}
            </DialogTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <DialogDescription>Détails de la transaction</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Date:</span>
              <span className="text-foreground font-medium">
                {format(new Date(sale.createdAt), "PPP à HH:mm", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Vendeur:</span>
              <span className="text-foreground font-medium">{sale.vendeurId}</span>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Articles ({sale.items.length})</h4>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">Prix unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.unitPrice.toFixed(2)} €</TableCell>
                      <TableCell className="text-right font-medium">
                        {(item.quantity * item.unitPrice).toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>Mode de paiement:</span>
              <span className="text-foreground">Carte bancaire</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{sale.total.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
