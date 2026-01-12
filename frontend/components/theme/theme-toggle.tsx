"use client"

import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "@/contexts/theme-context"

export function ThemeToggle() {
  const { settings, updateSettings, resolvedMode } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {resolvedMode === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span className="sr-only">Changer le thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => updateSettings({ mode: "light" })}>
          <Sun className="mr-2 h-4 w-4" />
          Clair
          {settings.mode === "light" && <span className="ml-auto text-primary">●</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateSettings({ mode: "dark" })}>
          <Moon className="mr-2 h-4 w-4" />
          Sombre
          {settings.mode === "dark" && <span className="ml-auto text-primary">●</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateSettings({ mode: "system" })}>
          <Monitor className="mr-2 h-4 w-4" />
          Système
          {settings.mode === "system" && <span className="ml-auto text-primary">●</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
