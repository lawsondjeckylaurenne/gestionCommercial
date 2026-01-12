"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Shield } from "lucide-react"
import { apiRequest } from "@/lib/api"

export default function Setup2FAPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSetupLoading, setIsSetupLoading] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")

  useEffect(() => {
    if (!userId) {
      router.push("/")
      return
    }
    setup2FA()
  }, [userId])

  const setup2FA = async () => {
    try {
      setIsSetupLoading(true)
      const response = await apiRequest("/auth/2fa/initial-setup", {
        method: "POST",
        body: JSON.stringify({ userId })
      })

      if (response && response.content) {
        setSecret(response.content.secret)
        setQrCodeUrl(response.content.qrCodeUrl)
      }
    } catch (error: any) {
      setError("Erreur lors de la configuration 2FA: " + error.message)
    } finally {
      setIsSetupLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await apiRequest("/auth/2fa/initial-verify", {
        method: "POST",
        body: JSON.stringify({
          userId,
          token: verificationCode
        })
      })

      if (response && response.status === 'success') {
        setSuccess(true)
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (error: any) {
      setError("Code de vérification incorrect: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSetupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Configuration de l'authentification 2FA...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">2FA configurée avec succès!</h2>
              <p className="text-muted-foreground">
                Vous allez être redirigé vers la page de connexion...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Configuration 2FA</h1>
          <p className="text-muted-foreground">
            Configurez l'authentification à deux facteurs pour sécuriser votre compte
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Étape 1: Scanner le QR Code</CardTitle>
            <CardDescription>
              Utilisez une application d'authentification comme Google Authenticator ou Authy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="QR Code 2FA" className="border rounded-lg" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Clé secrète (si vous ne pouvez pas scanner)</Label>
              <Input 
                value={secret} 
                readOnly 
                className="font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <p className="text-xs text-muted-foreground">
                Cliquez pour sélectionner et copier la clé
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Étape 2: Vérification</CardTitle>
            <CardDescription>
              Entrez le code à 6 chiffres généré par votre application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="code">Code de vérification</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/")}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? "Vérification..." : "Vérifier"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
