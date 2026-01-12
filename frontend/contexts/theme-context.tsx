"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type ThemeMode = "light" | "dark" | "system"

export type AccentColor = "emerald" | "blue" | "violet" | "rose" | "amber" | "cyan"

export interface ThemeSettings {
  mode: ThemeMode
  accentColor: AccentColor
  reducedMotion: boolean
  compactMode: boolean
  highContrast: boolean
  fontSize: "small" | "medium" | "large"
}

const defaultSettings: ThemeSettings = {
  mode: "dark",
  accentColor: "emerald",
  reducedMotion: false,
  compactMode: false,
  highContrast: false,
  fontSize: "medium",
}

// Color palettes for each accent color (oklch format)
const accentPalettes: Record<AccentColor, { primary: string; ring: string; chart1: string }> = {
  emerald: {
    primary: "oklch(0.65 0.18 145)",
    ring: "oklch(0.65 0.18 145)",
    chart1: "oklch(0.65 0.18 145)",
  },
  blue: {
    primary: "oklch(0.6 0.18 240)",
    ring: "oklch(0.6 0.18 240)",
    chart1: "oklch(0.6 0.18 240)",
  },
  violet: {
    primary: "oklch(0.6 0.2 280)",
    ring: "oklch(0.6 0.2 280)",
    chart1: "oklch(0.6 0.2 280)",
  },
  rose: {
    primary: "oklch(0.65 0.2 350)",
    ring: "oklch(0.65 0.2 350)",
    chart1: "oklch(0.65 0.2 350)",
  },
  amber: {
    primary: "oklch(0.7 0.15 70)",
    ring: "oklch(0.7 0.15 70)",
    chart1: "oklch(0.7 0.15 70)",
  },
  cyan: {
    primary: "oklch(0.7 0.15 195)",
    ring: "oklch(0.7 0.15 195)",
    chart1: "oklch(0.7 0.15 195)",
  },
}

interface ThemeContextValue {
  settings: ThemeSettings
  updateSettings: (updates: Partial<ThemeSettings>) => void
  resetSettings: () => void
  resolvedMode: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings)
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("dark")
  const [mounted, setMounted] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("gestcom-theme")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      } catch {
        // Invalid JSON, use defaults
      }
    }
    setMounted(true)
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("gestcom-theme", JSON.stringify(settings))
    }
  }, [settings, mounted])

  // Handle system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const updateResolvedMode = () => {
      if (settings.mode === "system") {
        setResolvedMode(mediaQuery.matches ? "dark" : "light")
      } else {
        setResolvedMode(settings.mode)
      }
    }

    updateResolvedMode()
    mediaQuery.addEventListener("change", updateResolvedMode)
    return () => mediaQuery.removeEventListener("change", updateResolvedMode)
  }, [settings.mode])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const body = document.body

    // Apply light/dark mode
    root.classList.remove("light", "dark")
    root.classList.add(resolvedMode)

    // Apply accent color CSS variables
    const palette = accentPalettes[settings.accentColor]
    root.style.setProperty("--primary", palette.primary)
    root.style.setProperty("--ring", palette.ring)
    root.style.setProperty("--chart-1", palette.chart1)
    root.style.setProperty("--sidebar-primary", palette.primary)
    root.style.setProperty("--sidebar-ring", palette.ring)

    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion")
    } else {
      root.classList.remove("reduce-motion")
    }

    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add("compact")
    } else {
      root.classList.remove("compact")
    }

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }

    // Apply font size
    body.classList.remove("text-sm", "text-base", "text-lg")
    if (settings.fontSize === "small") {
      body.classList.add("text-sm")
    } else if (settings.fontSize === "large") {
      body.classList.add("text-lg")
    } else {
      body.classList.add("text-base")
    }
  }, [settings, resolvedMode, mounted])

  const updateSettings = (updates: Partial<ThemeSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem("gestcom-theme")
  }

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resetSettings, resolvedMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
