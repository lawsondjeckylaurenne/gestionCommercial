"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Grid, List, ImageIcon } from "lucide-react"
import { apiRequest } from "@/lib/api"
import type { Product } from "@/types"

const categories = ["Tous", "Smartphones", "Audio", "Ordinateurs", "Tablettes", "Montres", "Accessoires"]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <DashboardLayout variant="app" allowedRoles={["VENDEUR", "MAGASINIER", "GERANT"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Catalogue Produits</h1>
            <p className="text-muted-foreground">{filteredProducts.length} produits disponibles</p>
          </div>
          <div className="flex gap-2">
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
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <Badge variant={product.stock > 5 ? "outline" : product.stock > 0 ? "secondary" : "destructive"}>
                      {product.stock > 0 ? `${product.stock}` : "Rupture"}
                    </Badge>
                  </div>
                  {/* Description removed from list response to keep it light, or added if needed */}
                  <p className="text-xl font-bold">{product.price}€</p>
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
                    <div className="h-16 w-16 rounded-lg bg-secondary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                        <Badge
                          variant={product.stock > 5 ? "outline" : product.stock > 0 ? "secondary" : "destructive"}
                        >
                          {product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{product.sku}</p>
                    </div>
                    <p className="text-xl font-bold flex-shrink-0">{product.price}€</p>
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
