"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, ShieldCheck, RotateCcw, User, Mail, Building, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { apiRequest } from "@/lib/api"

export default function ProfilePage() {
  const { user } = useAuth()
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    check2FAStatus()
  }, [])

  const check2FAStatus = async () => {
    try {
      const response = await apiRequest("/auth/2fa/status", {
        method: "GET"
      })

      if (response && response.content) {
        setIs2FAEnabled(response.content.is2FAEnabled)
      }
    } catch (error) {
      console.error("Error checking 2FA status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Chargement du profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et paramètres de sécurité
          </p>
        </div>

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nom</label>
                <p className="text-lg">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg">{user.email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rôle</label>
                <div>
                  <Badge variant="outline" className="text-sm">
                    {user.role}
                  </Badge>
                </div>
              </div>
              {user.tenantId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organisation</label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">Organisation</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Gérez vos paramètres de sécurité et authentification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {is2FAEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <Shield className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <h3 className="font-medium">Authentification à deux facteurs (2FA)</h3>
                  <p className="text-sm text-muted-foreground">
                    {is2FAEnabled 
                      ? "Votre compte est protégé par la 2FA" 
                      : "Authentification à deux facteurs non configurée"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={is2FAEnabled ? "default" : "secondary"}>
                  {isLoading ? "Chargement..." : (is2FAEnabled ? "Activée" : "Désactivée")}
                </Badge>
                {is2FAEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/profile/reset-2fa")}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reconfigurer
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Mot de passe</h3>
                  <p className="text-sm text-muted-foreground">
                    Modifiez votre mot de passe pour sécuriser votre compte
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/profile/change-password")}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Changer
              </Button>
            </div>

            {is2FAEnabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Reconfiguration 2FA</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Si vous avez changé de téléphone ou réinstallé votre application d'authentification, 
                      vous pouvez reconfigurer votre 2FA en cliquant sur "Reconfigurer".
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      <strong>Note :</strong> Vous devrez entrer votre mot de passe actuel pour des raisons de sécurité.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Retour
          </Button>
        </div>
      </div>
    </div>
  )
}
