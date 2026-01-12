"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Receipt, ShoppingCart, X, Check, Loader2, ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import type { Product } from "@/types"

interface CartItem extends Product {
  quantity: number
}

const categories = ["Tous", "Smartphones", "Audio", "Ordinateurs", "Tablettes", "Montres", "Accessoires"]

export default function POSPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const fetchProducts = async () => {
    try {
      const response = await apiRequest("/products/list")
      if (response && response.content) {
        setProducts(response.content)
      }
    } catch (error) {
      console.error("Failed to fetch products", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id !== productId) return item
          const newQuantity = item.quantity + delta
          if (newQuantity <= 0) return item
          if (newQuantity > item.stock) return item
          return { ...item, quantity: newQuantity }
        })
        .filter((item) => item.quantity > 0)
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      }

      const response = await apiRequest("/sales/create", {
        method: "POST",
        body: JSON.stringify(saleData)
      })

      if (response && response.content) {
        // Update local product stock based on response if needed, or just refetch
        // Response format includes updated stock in items: { items: [ { productId, remainingStock } ] }
        if (response.content.items) {
           setProducts(prev => prev.map(p => {
              const saleItem = response.content.items.find((si: any) => si.productId === p.id)
              if (saleItem) {
                  return { ...p, stock: saleItem.remainingStock }
              }
              return p
           }))
        } else {
            fetchProducts() // Fallback
        }
        
        setIsSuccess(true)
        toast({
            title: "Paiement validé",
            description: `Transaction de ${(total * 1.2).toFixed(2)}€ enregistrée.`,
        })
        setTimeout(() => {
          setIsPaymentDialogOpen(false)
          setIsSuccess(false)
          setPaymentMethod(null)
          clearCart()
        }, 2000)
      }
    } catch (error: any) {
      console.error("Payment failed", error)
      toast({
        title: "Erreur de paiement",
        description: error.message || "La transaction a échoué.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <DashboardLayout variant="app" allowedRoles={["VENDEUR", "GERANT"]}>
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
        <div className="grid h-full gap-4 lg:grid-cols-3">
          {/* Products Section */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Search & Categories */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <ScrollArea className="flex-1">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 pb-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-card border-border cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    onClick={() => product.stock > 0 && addToCart(product)}
                  >
                     <div className="h-32 bg-secondary flex items-center justify-center">
                        {product.imagePath ? (
                            <img src={product.imagePath} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                        <Badge
                          variant={product.stock > 5 ? "outline" : product.stock > 0 ? "secondary" : "destructive"}
                        >
                          {product.stock > 0 ? `${product.stock}` : "Rupture"}
                        </Badge>
                      </div>
                      <p className="text-xl font-bold mt-2">{product.price}€</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Cart Section */}
          <div className="flex flex-col">
            <Card className="bg-card border-border flex-1 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Panier
                </CardTitle>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    <X className="h-4 w-4 mr-1" />
                    Vider
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {cart.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Panier vide</p>
                      <p className="text-sm">Cliquez sur un produit pour l'ajouter</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="flex-1 -mx-4 px-4">
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.price}€</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 bg-transparent"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 bg-transparent"
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="mt-4 space-y-3">
                      <Separator />
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sous-total</span>
                          <span>{total.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">TVA (20%)</span>
                          <span>{(total * 0.2).toFixed(2)}€</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>{(total * 1.2).toFixed(2)}€</span>
                        </div>
                      </div>

                      <Button className="w-full" size="lg" onClick={() => setIsPaymentDialogOpen(true)}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Encaisser
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isSuccess ? "Paiement réussi" : "Mode de paiement"}</DialogTitle>
              <DialogDescription>
                {isSuccess
                  ? "La transaction a été enregistrée avec succès"
                  : `Total à encaisser: ${(total * 1.2).toFixed(2)}€`}
              </DialogDescription>
            </DialogHeader>

            {isSuccess ? (
              <div className="flex flex-col items-center py-6">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium">Transaction complétée</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <Button
                    variant={paymentMethod === "card" ? "default" : "outline"}
                    className="h-24 flex-col gap-2"
                    onClick={() => setPaymentMethod("card")}
                  >
                    <CreditCard className="h-8 w-8" />
                    <span>Carte bancaire</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    className="h-24 flex-col gap-2"
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <Banknote className="h-8 w-8" />
                    <span>Espèces</span>
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={isProcessing}>
                    Annuler
                  </Button>
                  <Button onClick={handlePayment} disabled={!paymentMethod || isProcessing}>
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Traitement...</> : "Valider le paiement"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
