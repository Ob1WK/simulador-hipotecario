"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, DollarSign, Home, Calculator, TrendingUp, AlertCircle } from "lucide-react"

export default function MortgageSimulator() {
  const [link, setLink] = useState("")
  const [usdPrice, setUsdPrice] = useState<number | "">("")
  const [fxVenta, setFxVenta] = useState<number | "">("")
  const [loadingFx, setLoadingFx] = useState(false)
  const [fxError, setFxError] = useState<string | null>(null)

  const [ltvPct, setLtvPct] = useState(75)
  const [years, setYears] = useState(30)
  const [tnaPct, setTnaPct] = useState(8.0)
  const [gastosPct, setGastosPct] = useState(2.0)
  const [capPct, setCapPct] = useState(30)

  const valid = typeof usdPrice === "number" && usdPrice > 0 && typeof fxVenta === "number" && fxVenta > 0

  const arsPrice = useMemo(() => (valid ? usdPrice! * fxVenta! : 0), [usdPrice, fxVenta, valid])
  const loanAmount = useMemo(() => (valid ? arsPrice * (ltvPct / 100) : 0), [arsPrice, ltvPct, valid])
  const downPayment = useMemo(() => (valid ? arsPrice - loanAmount : 0), [arsPrice, loanAmount, valid])

  const monthlyRate = useMemo(() => (tnaPct > 0 ? tnaPct / 100 / 12 : 0), [tnaPct])
  const n = useMemo(() => years * 12, [years])

  const baseMonthly = useMemo(() => {
    if (!valid || loanAmount <= 0 || monthlyRate <= 0 || n <= 0) return 0
    const r = monthlyRate
    return loanAmount * (r / (1 - Math.pow(1 + r, -n)))
  }, [loanAmount, monthlyRate, n, valid])

  const monthlyWithGastos = useMemo(() => baseMonthly * (1 + gastosPct / 100), [baseMonthly, gastosPct])

  const usdDownPayment = useMemo(() => (valid ? downPayment / (fxVenta as number) : 0), [downPayment, fxVenta, valid])
  const incomeNeeded = useMemo(() => (capPct > 0 ? monthlyWithGastos / (capPct / 100) : 0), [monthlyWithGastos, capPct])

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchOficialVenta()
  }, [])

  async function fetchOficialVenta() {
    try {
      setLoadingFx(true)
      setFxError(null)
      const resp = await fetch("https://dolarapi.com/v1/dolares/oficial")
      if (!resp.ok) throw new Error("No se pudo obtener el dólar oficial")
      const data = await resp.json()
      if (!data?.venta) throw new Error("Respuesta sin 'venta'")
      setFxVenta(Number(data.venta))
    } catch (e: any) {
      setFxError(e?.message ?? "Error desconocido al obtener el dólar")
    } finally {
      setLoadingFx(false)
    }
  }

  const currency = (v: number, symbol = "$ ") =>
    v.toLocaleString("es-AR", { style: "currency", currency: "ARS" }).replace("ARS", symbol).trim()
  const fmtInt = (v: number) => Math.round(v).toLocaleString("es-AR")
  const fmtMillones = (v: number) => {
    if (v >= 1_000_000) {
      const num = v / 1_000_000
      const hasDecimals = Math.abs(num - Math.round(num)) > 1e-6
      return `${num.toLocaleString("es-AR", { maximumFractionDigits: hasDecimals ? 1 : 0 })} millones`
    }
    return v.toLocaleString("es-AR")
  }

  const copyResults = async () => {
    if (!valid) return
    const texto = `Ahorrar ${fmtInt(usdDownPayment)} dólares para el ingreso al crédito\nTener un ingreso neto de ${fmtMillones(incomeNeeded)} entre deudores y co-deudores\n\nLa cuota inicial sería de ${fmtInt(monthlyWithGastos)} pesos por mes (se ajusta con inflación)`
    try {
      await navigator.clipboard.writeText(texto)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error("Clipboard error", e)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance">Simulador Hipotecario</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Calculá tu crédito hipotecario de forma simple. Ingresá el precio de la propiedad y ajustá los parámetros
            para ver si te conviene.
          </p>
        </header>

        {/* Warning Alert */}
        <Alert className="bg-accent/10 border-accent/20">
          <AlertCircle className="h-4 w-4 text-accent-foreground" />
          <AlertDescription className="text-accent-foreground">
            Este simulador es orientativo. Puede no reflejar tasas, topes de LTV, actualizaciones UVA/CVS u otras
            condiciones del momento. Validá siempre en la web oficial del banco.
          </AlertDescription>
        </Alert>

        {/* Property Details Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle>Datos del Inmueble</CardTitle>
            </div>
            <CardDescription>Ingresá el precio de la propiedad y el tipo de cambio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="link" className="text-sm font-medium">
                Link del inmueble (opcional)
              </Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="h-11"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="usdPrice" className="text-sm font-medium">
                  Precio (USD)
                </Label>
                <Input
                  id="usdPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={usdPrice as any}
                  onChange={(e) => setUsdPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ej: 80,000"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fxVenta" className="text-sm font-medium">
                  Tipo de cambio venta (ARS/USD)
                </Label>
                <Input
                  id="fxVenta"
                  type="number"
                  value={fxVenta as any}
                  readOnly
                  disabled={loadingFx}
                  placeholder={loadingFx ? "Cargando..." : "Actualizando..."}
                  className="h-11 bg-muted/50"
                />
                {fxError && <p className="text-xs text-destructive mt-1">{fxError}</p>}
                <p className="text-xs text-muted-foreground">
                  El tipo de cambio se actualiza automáticamente al cargar la página.
                </p>
              </div>
            </div>

            {valid && (
              <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-foreground">Precio en ARS:</span>
                <span className="text-xl font-bold text-foreground">{currency(arsPrice)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan Parameters Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <CardTitle>Parámetros del Crédito</CardTitle>
            </div>
            <CardDescription>Ajustá las condiciones del préstamo hipotecario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ltv" className="text-sm font-medium">
                  Financiación (LTV %)
                </Label>
                <Input
                  id="ltv"
                  type="number"
                  min={0}
                  max={100}
                  value={ltvPct}
                  onChange={(e) => setLtvPct(Number(e.target.value))}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years" className="text-sm font-medium">
                  Plazo (años)
                </Label>
                <Input
                  id="years"
                  type="number"
                  min={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tna" className="text-sm font-medium">
                  TNA (%)
                </Label>
                <Input
                  id="tna"
                  type="number"
                  min={0}
                  step="0.1"
                  value={tnaPct}
                  onChange={(e) => setTnaPct(Number(e.target.value))}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gastos" className="text-sm font-medium">
                  Gastos/seguros (% cuota)
                </Label>
                <Input
                  id="gastos"
                  type="number"
                  min={0}
                  step="0.1"
                  value={gastosPct}
                  onChange={(e) => setGastosPct(Number(e.target.value))}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cap" className="text-sm font-medium">
                  Tope cuota/ingreso (%)
                </Label>
                <Input
                  id="cap"
                  type="number"
                  min={0}
                  max={100}
                  value={capPct}
                  onChange={(e) => setCapPct(Number(e.target.value))}
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Resultados</CardTitle>
            </div>
            <CardDescription>Tu plan de financiamiento estimado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-5 space-y-1">
                <p className="text-sm text-muted-foreground">Monto financiado</p>
                <p className="text-2xl font-bold text-foreground">{valid ? currency(loanAmount) : "—"}</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-5 space-y-1">
                <p className="text-sm text-muted-foreground">Anticipo necesario</p>
                <p className="text-2xl font-bold text-foreground">{valid ? currency(downPayment) : "—"}</p>
                {valid && <p className="text-xs text-muted-foreground mt-1">≈ USD {fmtInt(usdDownPayment)}</p>}
              </div>

              <div className="bg-accent/10 rounded-xl p-5 space-y-1 sm:col-span-2">
                <p className="text-sm text-accent-foreground font-medium">Cuota mensual estimada</p>
                <p className="text-3xl font-bold text-accent-foreground">{valid ? currency(monthlyWithGastos) : "—"}</p>
                <p className="text-xs text-accent-foreground/80">Se ajusta con inflación</p>
              </div>

              <div className="bg-secondary/50 rounded-xl p-5 space-y-1 sm:col-span-2">
                <p className="text-sm text-secondary-foreground">Ingreso neto requerido (deudores + co-deudores)</p>
                <p className="text-2xl font-bold text-foreground">{valid ? `$ ${fmtMillones(incomeNeeded)}` : "—"}</p>
              </div>
            </div>

            <Button onClick={copyResults} disabled={!valid} className="w-full h-12 text-base" size="lg">
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  ¡Copiado al portapapeles!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copiar resumen
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pb-8">
          <p className="text-pretty">
            Simulador hipotecario orientativo. Los valores reales pueden variar según las condiciones del banco y el
            mercado.
          </p>
        </footer>
      </div>
    </div>
  )
}
