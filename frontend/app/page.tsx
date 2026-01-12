"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, AlertCircle, Lock, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [twoFactorToken, setTwoFactorToken] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [userId, setUserId] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(email, password, twoFactorToken)

    if (result.success && result.user) {
      // Redirection basée sur le rôle
      switch (result.user.role) {
        case "SUPERADMIN":
          router.push("/superadmin")
          break
        case "DIRECTEUR":
        case "GERANT":
          router.push("/admin")
          break
        case "VENDEUR":
        case "MAGASINIER":
          router.push("/app")
          break
        default:
          router.push("/app")
      }
    } else if (result.require2FASetup) {
      setUserId(result.userId || "")
      setShow2FASetup(true)
      setError("Vous devez configurer l'authentification à deux facteurs pour votre rôle")
    } else if (result.require2FA) {
      setUserId(result.userId || "")
      setShowTwoFactor(true)
      setError("Veuillez entrer votre code d'authentification à deux facteurs")
    } else {
      setError(result.error || "Email ou mot de passe incorrect")
    }
    setIsLoading(false)
  }

  // Comptes de démonstration
  const demoAccounts = [
    { email: "superadmin@saas.com", password: "superadmin123", role: "Super Admin" },
    { email: "director@techstore.com", password: "password123", role: "Directeur" },
  ]

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">GestCom</h1>
          <p className="text-muted-foreground text-center">Plateforme de Gestion Commerciale</p>
        </div>

        {/* Login Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Entrez vos identifiants pour accéder à votre espace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {showTwoFactor && (
                <div className="space-y-2">
                  <Label htmlFor="twoFactorToken">Code d'authentification (2FA)</Label>
                  <Input
                    id="twoFactorToken"
                    type="text"
                    placeholder="123456"
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Entrez le code à 6 chiffres de votre application d'authentification
                  </p>
                </div>
              )}

              {show2FASetup && (
                <div className="space-y-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Votre rôle nécessite l'activation de l'authentification à deux facteurs. 
                      Vous devez d'abord configurer la 2FA avant de pouvoir vous connecter.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push(`/setup-2fa?userId=${userId}`)}
                    className="w-full"
                  >
                    Configurer l'authentification 2FA
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo accounts */}
        {/* <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Comptes de démonstration</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                size="sm"
                className="justify-between h-auto py-2 bg-transparent"
                onClick={() => handleDemoLogin(account.email, account.password)}
                disabled={isLoading}
              >
                <span className="text-xs font-mono truncate">{account.email}</span>
                <span className="text-xs text-muted-foreground ml-2">{account.role}</span>
              </Button>
            ))}
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
