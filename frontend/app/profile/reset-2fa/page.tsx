"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Shield, Eye, EyeOff } from "lucide-react"
import { apiRequest } from "@/lib/api"

export default function Reset2FAPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [step, setStep] = useState(1) // 1: password, 2: scan QR, 3: verify
  
  const router = useRouter()

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await apiRequest("/auth/2fa/reset", {
        method: "POST",
        body: JSON.stringify({ currentPassword })
      })

      if (response && response.content) {
        setSecret(response.content.secret)
        setQrCodeUrl(response.content.qrCodeUrl)
        setStep(2)
      }
    } catch (error: any) {
      setError("Erreur lors de la réinitialisation 2FA: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsVerifying(true)

    try {
      const response = await apiRequest("/auth/2fa/verify-setup", {
        method: "POST",
        body: JSON.stringify({ token: verificationCode })
      })

      if (response && response.status === 'success') {
        setSuccess(true)
        setTimeout(() => {
          router.push("/profile")
        }, 2000)
      }
    } catch (error: any) {
      setError("Code de vérification incorrect: " + error.message)
    } finally {
      setIsVerifying(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">2FA reconfigurée avec succès!</h2>
              <p className="text-muted-foreground">
                Vous allez être redirigé vers votre profil...
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
          <h1 className="text-2xl font-bold">Réinitialiser la 2FA</h1>
          <p className="text-muted-foreground">
            Reconfigurez votre authentification à deux facteurs
          </p>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Vérification de sécurité</CardTitle>
              <CardDescription>
                Entrez votre mot de passe actuel pour continuer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/profile")}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !currentPassword}
                    className="flex-1"
                  >
                    {isLoading ? "Vérification..." : "Continuer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Scanner le nouveau QR Code</CardTitle>
                <CardDescription>
                  Scannez ce nouveau QR code avec votre application d'authentification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <img src={qrCodeUrl} alt="QR Code 2FA" className="border rounded-lg" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Nouvelle clé secrète (si vous ne pouvez pas scanner)</Label>
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

                <Button 
                  onClick={() => setStep(3)}
                  className="w-full"
                >
                  J'ai scanné le QR code
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Vérification</CardTitle>
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
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isVerifying || verificationCode.length !== 6}
                    className="flex-1"
                  >
                    {isVerifying ? "Vérification..." : "Confirmer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
