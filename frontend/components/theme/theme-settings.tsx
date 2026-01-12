"use client"

import { Sun, Moon, Monitor, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useTheme, type ThemeMode, type AccentColor } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
]

const accentColors: { value: AccentColor; label: string; class: string }[] = [
  { value: "emerald", label: "Émeraude", class: "bg-emerald-500" },
  { value: "blue", label: "Bleu", class: "bg-blue-500" },
  { value: "violet", label: "Violet", class: "bg-violet-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
  { value: "amber", label: "Ambre", class: "bg-amber-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
]

const fontSizes: { value: "small" | "medium" | "large"; label: string }[] = [
  { value: "small", label: "Petit" },
  { value: "medium", label: "Moyen" },
  { value: "large", label: "Grand" },
]

interface ThemeSettingsProps {
  showCard?: boolean
}

export function ThemeSettings({ showCard = true }: ThemeSettingsProps) {
  const { settings, updateSettings, resetSettings } = useTheme()

  const content = (
    <div className="space-y-6">
      {/* Theme Mode */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Mode d&apos;affichage</Label>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => (
            <Button
              key={option.value}
              variant={settings.mode === option.value ? "default" : "outline"}
              className="flex flex-col gap-1 h-auto py-3"
              onClick={() => updateSettings({ mode: option.value })}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-xs">{option.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Accent Color */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Couleur d&apos;accent</Label>
        <div className="grid grid-cols-3 gap-3">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => updateSettings({ accentColor: color.value })}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:scale-105",
                settings.accentColor === color.value
                  ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", color.class)}>
                {settings.accentColor === color.value && <Check className="h-4 w-4 text-white" />}
              </div>
              <span className="text-xs font-medium">{color.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Font Size */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Taille du texte</Label>
        <div className="grid grid-cols-3 gap-2">
          {fontSizes.map((size) => (
            <Button
              key={size.value}
              variant={settings.fontSize === size.value ? "default" : "outline"}
              className={cn(
                "h-auto py-2",
                size.value === "small" && "text-xs",
                size.value === "medium" && "text-sm",
                size.value === "large" && "text-base",
              )}
              onClick={() => updateSettings({ fontSize: size.value })}
            >
              {size.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Accessibility Options */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Accessibilité</Label>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="reduced-motion-settings" className="text-sm">
              Réduire les animations
            </Label>
            <p className="text-xs text-muted-foreground">Désactive les animations pour plus de confort</p>
          </div>
          <Switch
            id="reduced-motion-settings"
            checked={settings.reducedMotion}
            onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="high-contrast-settings" className="text-sm">
              Contraste élevé
            </Label>
            <p className="text-xs text-muted-foreground">Améliore la lisibilité des textes</p>
          </div>
          <Switch
            id="high-contrast-settings"
            checked={settings.highContrast}
            onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="compact-mode-settings" className="text-sm">
              Mode compact
            </Label>
            <p className="text-xs text-muted-foreground">Réduit les espacements pour plus de contenu</p>
          </div>
          <Switch
            id="compact-mode-settings"
            checked={settings.compactMode}
            onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Reset */}
      <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={resetSettings}>
        <RotateCcw className="h-4 w-4" />
        Réinitialiser les paramètres
      </Button>

      {/* Preview Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium text-card-foreground">Aperçu</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Voici un aperçu des paramètres actuels appliqués à cette carte.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm">Principal</Button>
          <Button size="sm" variant="secondary">
            Secondaire
          </Button>
          <Button size="sm" variant="outline">
            Contour
          </Button>
        </div>
      </div>
    </div>
  )

  if (!showCard) return content

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Personnalisation</CardTitle>
        <CardDescription>Personnalisez l&apos;apparence de l&apos;application selon vos préférences</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
