"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Banknote, Smartphone, Check } from "lucide-react"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onConfirm: (method: PaymentMethod, amountReceived?: number) => Promise<void>
}

type PaymentMethod = "card" | "cash" | "mobile"

const PAYMENT_METHODS = [
  { id: "card" as const, label: "Carte bancaire", icon: CreditCard },
  { id: "cash" as const, label: "Espèces", icon: Banknote },
  { id: "mobile" as const, label: "Mobile Money", icon: Smartphone },
]

export function PaymentModal({ open, onOpenChange, total, onConfirm }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card")
  const [cashReceived, setCashReceived] = useState("")

  const cashAmount = Number.parseFloat(cashReceived) || 0
  const change = cashAmount - total

  const handleConfirm = async () => {
    if (selectedMethod === "cash" && cashAmount < total) return

    setLoading(true)
    try {
      await onConfirm(selectedMethod, selectedMethod === "cash" ? cashAmount : undefined)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setSelectedMethod("card")
    setCashReceived("")
    setSuccess(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value)
        if (!value) resetState()
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        {success ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-600">Paiement réussi !</h3>
            <p className="text-muted-foreground mt-2">La transaction a été enregistrée</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Finaliser le paiement</DialogTitle>
              <DialogDescription>Sélectionnez le mode de paiement</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Total à payer</p>
                <p className="text-3xl font-bold">{total.toFixed(2)} €</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <Button
                    key={method.id}
                    variant={selectedMethod === method.id ? "default" : "outline"}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <method.icon className="h-6 w-6" />
                    <span className="text-xs">{method.label}</span>
                  </Button>
                ))}
              </div>

              {selectedMethod === "cash" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="cashReceived">Montant reçu</Label>
                      <Input
                        id="cashReceived"
                        type="number"
                        step="0.01"
                        min={total}
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        className="text-xl text-center h-12"
                      />
                    </div>
                    {cashAmount >= total && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-between">
                        <span className="text-sm">Monnaie à rendre:</span>
                        <span className="text-xl font-bold text-green-600">{change.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Button
                className="w-full h-12 text-lg"
                onClick={handleConfirm}
                disabled={loading || (selectedMethod === "cash" && cashAmount < total)}
              >
                {loading && <Spinner className="mr-2 h-5 w-5" />}
                Confirmer le paiement
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
