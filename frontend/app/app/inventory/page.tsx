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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Minus, Package, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { apiRequest } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import type { Product } from "@/types"

export default function InventoryPage() {
  const { hasPermission } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stockAdjustment, setStockAdjustment] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const canModifyStock = hasPermission("manage_stock")

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest("/products/list")
      if (response && response.content) {
        setProducts(response.content)
      }
    } catch (error) {
      console.error("Failed to fetch inventory", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const filteredInventory = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: "Rupture", variant: "destructive" as const }
    if (product.stock < 5) return { label: "Stock bas", variant: "secondary" as const } // Threshold hardcoded for now or add to model
    return { label: "En stock", variant: "outline" as const }
  }

  const handleOpenAdjustment = (product: Product) => {
    setSelectedProduct(product)
    setStockAdjustment(0)
    setIsDialogOpen(true)
  }

  const handleSaveAdjustment = async () => {
    if (selectedProduct && stockAdjustment !== 0) {
      try {
        setIsSaving(true)
        const newStock = Math.max(0, selectedProduct.stock + stockAdjustment)
        
        await apiRequest(`/products/update/${selectedProduct.id}`, {
            method: "PUT",
            body: JSON.stringify({ stock: newStock })
        })

        setIsDialogOpen(false)
        setSelectedProduct(null)
        setStockAdjustment(0)
        fetchInventory()
      } catch (error) {
          console.error("Failed to update stock", error)
      } finally {
          setIsSaving(false)
      }
    }
  }

  const lowStockCount = products.filter((p) => p.stock < 5 && p.stock > 0).length
  const outOfStockCount = products.filter((p) => p.stock === 0).length

  return (
    <DashboardLayout variant="app" allowedRoles={["MAGASINIER", "GERANT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Gestion du Stock</h1>
          <p className="text-muted-foreground">Gérez et ajustez les niveaux de stock</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total références</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                  <Package className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock bas</p>
                  <p className="text-2xl font-bold">{lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
                  <Package className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ruptures</p>
                  <p className="text-2xl font-bold">{outOfStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Inventaire</CardTitle>
                <CardDescription>{filteredInventory.length} produits</CardDescription>
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
                    <TableHead>Produit</TableHead>
                    <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="hidden md:table-cell">Seuil min.</TableHead>
                    <TableHead>Statut</TableHead>
                    {canModifyStock && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((product) => {
                    const status = getStockStatus(product)
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">{product.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{product.category}</TableCell>
                        <TableCell className="text-center font-semibold">{product.stock}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">5</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        {canModifyStock && (
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleOpenAdjustment(product)}>
                              Ajuster
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Stock Adjustment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ajuster le stock</DialogTitle>
              <DialogDescription>
                {selectedProduct?.name} - Stock actuel: {selectedProduct?.stock}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ajustement</Label>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setStockAdjustment((prev) => prev - 1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={stockAdjustment}
                    onChange={(e) => setStockAdjustment(Number.parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Button variant="outline" size="icon" onClick={() => setStockAdjustment((prev) => prev + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-sm text-muted-foreground">Nouveau stock:</p>
                <p className="text-2xl font-bold">{Math.max(0, (selectedProduct?.stock || 0) + stockAdjustment)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button onClick={handleSaveAdjustment} disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Enregistrement...</> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
