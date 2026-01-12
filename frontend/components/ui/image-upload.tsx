"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react"
import { apiRequest } from "@/lib/api"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onError?: (error: string) => void
  maxSize?: number // in MB
  accept?: string[]
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onError,
  maxSize = 5,
  accept = ["image/jpeg", "image/png", "image/webp"],
  className = ""
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const errorMsg = `Le fichier est trop volumineux. Taille maximum: ${maxSize}MB`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    // Validate file type
    if (!accept.includes(file.type)) {
      const errorMsg = `Type de fichier non supporté. Types acceptés: ${accept.join(", ")}`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setError("")
    setIsUploading(true)

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Upload file
      const formData = new FormData()
      formData.append("image", file)

      console.log('FormData created:', formData)
      console.log('File in FormData:', formData.get('image'))
      
      // Test direct fetch without apiRequest wrapper
      const token = localStorage.getItem('accessToken')
      const response = await fetch('http://localhost:3002/api/upload/image', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const data = await response.json()

      if (data && data.content && data.content.url) {
        onChange(data.content.url)
        // Clean up preview URL since we have the real URL now
        URL.revokeObjectURL(previewUrl)
        setPreview(data.content.url)
      } else {
        throw new Error("Réponse invalide du serveur")
      }
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors de l'upload de l'image"
      setError(errorMsg)
      onError?.(errorMsg)
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }, [maxSize, accept, onChange, onError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    onChange("")
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      {preview ? (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeImage}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <CardContent className="p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Upload en cours...</p>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-muted">
                    {isDragActive ? (
                      <Upload className="h-8 w-8 text-primary" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isDragActive
                        ? "Déposez l'image ici"
                        : "Glissez-déposez une image ou cliquez pour sélectionner"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP jusqu'à {maxSize}MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
