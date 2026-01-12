"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Grid, List, ImageIcon } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { usePermissions } from "@/hooks/usePermissions"
import { ImageUpload } from "@/components/ui/image-upload"
import type { Product } from "@/types"

const categories = ["Smartphones", "Audio", "Ordinateurs", "Tablettes", "Montres", "Accessoires"]

export default function AdminProductsPage() {
  const permissions = usePermissions()
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    sku: "",
    imagePath: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest("/products/list")
      if (response && response.content) {
        setProducts(response.content)
      }
    } catch (error) {
      console.error("Failed to fetch products", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!newProduct.name.trim()) {
      newErrors.name = "Le nom est requis"
    } else if (newProduct.name.trim().length < 3) {
      newErrors.name = "Le nom doit contenir au moins 3 caractères"
    }

    if (!newProduct.description.trim()) {
      newErrors.description = "La description est requise"
    }

    if (!newProduct.price.trim()) {
      newErrors.price = "Le prix est requis"
    } else if (isNaN(Number(newProduct.price)) || Number(newProduct.price) <= 0) {
      newErrors.price = "Le prix doit être un nombre positif"
    }

    if (!newProduct.stock.trim()) {
      newErrors.stock = "Le stock est requis"
    } else if (isNaN(Number(newProduct.stock)) || Number(newProduct.stock) < 0) {
      newErrors.stock = "Le stock doit être un nombre positif ou zéro"
    }

    if (!newProduct.category) {
      newErrors.category = "La catégorie est requise"
    }

    if (!newProduct.sku.trim()) {
      newErrors.sku = "Le SKU est requis"
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateProduct = async () => {
    if (validateForm()) {
      try {
        const productData = {
          ...newProduct,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock)
        }

        if (editingProduct) {
          await apiRequest(`/products/${editingProduct.id}`, {
            method: "PUT",
            body: JSON.stringify(productData),
          })
        } else {
          await apiRequest("/products/create", {
            method: "POST",
            body: JSON.stringify(productData),
          })
        }

        setIsDialogOpen(false)
        setEditingProduct(null)
        setNewProduct({
          name: "",
          description: "",
          price: "",
          stock: "",
          category: "",
          sku: "",
          imagePath: ""
        })
        setFormErrors({})
        fetchProducts()
      } catch (error: any) {
        console.error("Failed to save product", error)
        setFormErrors({ ...formErrors, submit: error.message || "Erreur lors de la sauvegarde du produit" })
      }
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || "",
      sku: product.sku,
      imagePath: product.imagePath || ""
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await apiRequest(`/products/${productId}`, {
          method: "DELETE",
        })
        fetchProducts()
      } catch (error) {
        console.error("Failed to delete product", error)
      }
    }
  }

  const openCreateDialog = () => {
    setEditingProduct(null)
    setNewProduct({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      sku: "",
      imagePath: ""
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  return (
    <DashboardLayout variant="admin" allowedRoles={["DIRECTEUR"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Gestion des Produits</h1>
            <p className="text-muted-foreground">{filteredProducts.length} produits dans votre catalogue</p>
          </div>
          <div className="flex gap-2">
            {permissions.canCreateProduct && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau produit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Modifier le produit" : "Créer un produit"}</DialogTitle>
                    <DialogDescription>
                      {editingProduct ? "Modifiez les informations du produit." : "Ajoutez un nouveau produit à votre catalogue."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {formErrors.submit && (
                      <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {formErrors.submit}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du produit</Label>
                      <Input
                        id="name"
                        placeholder="iPhone 15 Pro"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                      {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Image du produit (optionnel)</Label>
                      <ImageUpload
                        value={newProduct.imagePath}
                        onChange={(url) => setNewProduct({ ...newProduct, imagePath: url })}
                        onError={(error) => setFormErrors({ ...formErrors, imagePath: error })}
                      />
                      {formErrors.imagePath && <p className="text-sm text-destructive">{formErrors.imagePath}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Description du produit..."
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      />
                      {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Prix (€)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="999.99"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        />
                        {formErrors.price && <p className="text-sm text-destructive">{formErrors.price}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          placeholder="10"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        />
                        {formErrors.stock && <p className="text-sm text-destructive">{formErrors.stock}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.category && <p className="text-sm text-destructive">{formErrors.category}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        placeholder="IP15P-128-BLU"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      />
                      {formErrors.sku && <p className="text-sm text-destructive">{formErrors.sku}</p>}
                    </div>

                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateProduct}>
                      {editingProduct ? "Modifier" : "Créer"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={selectedCategory === "Tous" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Tous")}
              className="whitespace-nowrap"
            >
              Tous
            </Button>
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

        {/* Products */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-card border-border overflow-hidden">
                <div className="aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden">
                  {product.imagePath ? (
                    <img src={product.imagePath} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category || "Sans catégorie"}</p>
                    </div>
                    <Badge variant={product.stock > 5 ? "outline" : product.stock > 0 ? "secondary" : "destructive"}>
                      {product.stock > 0 ? `${product.stock}` : "Rupture"}
                    </Badge>
                  </div>
                  <p className="text-xl font-bold mb-3">{product.price}€</p>
                  <div className="flex gap-2">
                    {permissions.canEditProduct && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                    )}
                    {permissions.canDeleteProduct && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-secondary/30 flex items-center justify-center shrink-0 overflow-hidden">
                      {product.imagePath ? (
                        <img src={product.imagePath} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.category || "Sans catégorie"}</p>
                        </div>
                        <Badge
                          variant={product.stock > 5 ? "outline" : product.stock > 0 ? "secondary" : "destructive"}
                        >
                          {product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{product.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold shrink-0">{product.price}€</p>
                      <div className="flex gap-1">
                        {permissions.canEditProduct && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {permissions.canDeleteProduct && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
