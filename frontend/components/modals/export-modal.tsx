"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  onExport: (options: ExportOptions) => Promise<void>
}

export interface ExportOptions {
  format: "csv" | "xlsx" | "pdf"
  dateRange?: { from: Date; to: Date }
  includeDetails: boolean
}

export function ExportModal({ open, onOpenChange, title = "Exporter les données", onExport }: ExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("xlsx")
  const [useDateRange, setUseDateRange] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [includeDetails, setIncludeDetails] = useState(true)

  const handleExport = async () => {
    setLoading(true)
    try {
      await onExport({
        format,
        dateRange: useDateRange && dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
        includeDetails,
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>Configurez les options d'exportation</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Format de fichier</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as "csv" | "xlsx" | "pdf")}
              className="grid grid-cols-3 gap-3"
            >
              <Label
                htmlFor="xlsx"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  format === "xlsx" ? "border-primary bg-primary/5" : "border-muted"
                }`}
              >
                <RadioGroupItem value="xlsx" id="xlsx" className="sr-only" />
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Excel</span>
              </Label>
              <Label
                htmlFor="csv"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  format === "csv" ? "border-primary bg-primary/5" : "border-muted"
                }`}
              >
                <RadioGroupItem value="csv" id="csv" className="sr-only" />
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">CSV</span>
              </Label>
              <Label
                htmlFor="pdf"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  format === "pdf" ? "border-primary bg-primary/5" : "border-muted"
                }`}
              >
                <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                <FileText className="h-6 w-6 text-red-600" />
                <span className="text-sm font-medium">PDF</span>
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="dateRange"
                checked={useDateRange}
                onCheckedChange={(checked) => setUseDateRange(!!checked)}
              />
              <Label htmlFor="dateRange" className="cursor-pointer">
                Filtrer par période
              </Label>
            </div>

            {useDateRange && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Du</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "P", { locale: fr }) : "Date début"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Au</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "P", { locale: fr }) : "Date fin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="includeDetails"
              checked={includeDetails}
              onCheckedChange={(checked) => setIncludeDetails(!!checked)}
            />
            <Label htmlFor="includeDetails" className="cursor-pointer">
              Inclure les détails complets
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
