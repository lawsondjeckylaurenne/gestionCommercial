import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { ThemeCustomizer } from "@/components/theme/theme-customizer"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GestCom - Plateforme de Gestion Commerciale",
  description: "Solution SaaS multi-tenant pour la gestion de vos commerces",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/gestcom-favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/gestcom-favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/gestcom-apple-icon.png",
    shortcut: "/gestcom-favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ThemeCustomizer />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
