"use client"

import { useState } from "react"
import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { ThemeSettings } from "./theme-settings"

export function ThemeCustomizer() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-[60] h-12 w-12 rounded-full shadow-lg md:bottom-6 md:right-6 bg-background border-border"
        >
          <Palette className="h-5 w-5" />
          <span className="sr-only">Personnaliser le thème</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md z-[70] px-6">
        <SheetHeader className="pr-6">
          <SheetTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personnalisation
          </SheetTitle>
          <SheetDescription>
            Personnalisez l&apos;apparence de l&apos;application selon vos préférences.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 pb-8">
          <ThemeSettings showCard={false} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
