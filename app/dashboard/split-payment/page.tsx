"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, Copy, QrCode, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export default function DividirPagamentoPage() {
  const [inputValor, setInputValor] = useState("")
  const [listaValores, setListaValores] = useState<number[]>([])
  const [pixAtual, setPixAtual] = useState<{qrCode: string, copiaCola: string, valor: number} | null>(null)
  const [indiceParcela, setIndiceParcela] = useState(0)
  const [parcelasPagas, setParcelasPagas] = useState<number[]>([])
  const [processando, setProcessando] = useState(false)
  const [textoCopied, setTextoCopied] = useState(false)

  // Criar lista de valores divididos
  const criarParcelas = () => {
    const total = parseFloat(inputValor.replace(",", "."))
    if (!total || total < 100) {
      toast.error("Valor minimo R$ 100")
      return
    }

    const valores: number[] = []
    let restante = total
    const bases = [1500, 1600, 1700, 1800, 1900, 2000]
    let i = 0

    while (restante > 0) {
      if (restante <= 2000) {
        valores.push(restante)
        break
      }
      const v = bases[i % bases.length]
      valores.push(v)
      restante -= v
      i++
    }

    setListaValores(valores)
    setIndiceParcela(0)
    setParcelasPagas([])
    setPixAtual(null)
    toast.success(`${valores.length} parcelas criadas`)
  }

  // Chamar API para gerar PIX - IDENTICO A WALLET
  const chamarApiPix = async () => {
    const valorParcela = listaValores[indiceParcela]
    if (!valorParcela) return

    setProcessando(true)

    try {
      const resp = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: valorParcela,
          description: `Parcela ${indiceParcela + 1}/${listaValores.length}`,
        }),
      })

      const json = await resp.json()

      if (!resp.ok) {
        throw new Error(json.error || "Falha ao gerar")
      }

      setPixAtual({
        qrCode: json.qrCodeBase64 || json.qrCode || "",
        copiaCola: json.copyPaste || "",
        valor: valorParcela
      })

      toast.success("PIX gerado!")
    } catch (e: any) {
      toast.error(e.message || "Erro")
    } finally {
      setProcessando(false)
    }
  }

  // Copiar codigo
  const copiarCodigo = () => {
    if (!pixAtual?.copiaCola) return
    navigator.clipboard.writeText(pixAtual.copiaCola)
    setTextoCopied(true)
    toast.success("Copiado!")
    setTimeout(() => setTextoCopied(false), 2000)
  }

  // Confirmar pagamento e ir para proxima
  const confirmarPagamento = () => {
    setParcelasPagas([...parcelasPagas, indiceParcela])
    setPixAtual(null)
    
    if (indiceParcela < listaValores.length - 1) {
      setIndiceParcela(indiceParcela + 1)
      toast.success("Proximo!")
    } else {
      toast.success("Todas parcelas pagas!")
    }
  }

  // Resetar
  const resetar = () => {
    setInputValor("")
    setListaValores([])
    setPixAtual(null)
    setIndiceParcela(0)
    setParcelasPagas([])
  }

  const totalPago = parcelasPagas.reduce((acc, idx) => acc + (listaValores[idx] || 0), 0)

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pagamento Dividido</h1>
        <p className="text-gray-500">Divida valores grandes em parcelas menores</p>
      </div>

      {listaValores.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo Pagamento</CardTitle>
            <CardDescription>Digite o valor total para dividir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Ex: 10000"
              value={inputValor}
              onChange={(e) => setInputValor(e.target.value)}
              className="text-xl"
            />
            <Button onClick={criarParcelas} className="w-full bg-orange-500 hover:bg-orange-600">
              Dividir em Parcelas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progresso */}
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Progresso</p>
                  <p className="text-xl font-bold">{parcelasPagas.length}/{listaValores.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Recebido</p>
                  <p className="text-xl font-bold text-green-500">R$ {totalPago.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${(parcelasPagas.length / listaValores.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Parcelas */}
          <div className="space-y-3">
            {listaValores.map((valor, idx) => {
              const pago = parcelasPagas.includes(idx)
              const atual = idx === indiceParcela && !pago

              return (
                <Card key={idx} className={atual ? "ring-2 ring-orange-500" : pago ? "opacity-60" : ""}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${pago ? "bg-green-500 text-white" : atual ? "bg-orange-500 text-white" : "bg-gray-200"}`}>
                          {pago ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">Parcela {idx + 1}</p>
                          <p className="text-sm text-gray-500">R$ {valor.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${pago ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {pago ? "Pago" : "Pendente"}
                      </span>
                    </div>

                    {/* Area do PIX - so mostra na parcela atual */}
                    {atual && (
                      <div className="mt-4 pt-4 border-t">
                        {!pixAtual ? (
                          <Button 
                            onClick={chamarApiPix} 
                            disabled={processando}
                            className="w-full bg-orange-500 hover:bg-orange-600"
                          >
                            {processando ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
                            ) : (
                              <><QrCode className="w-4 h-4 mr-2" /> Gerar QR Code</>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            {/* QR Code */}
                            <div className="flex justify-center">
                              <div className="bg-white p-3 rounded-lg border">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixAtual.copiaCola)}`}
                                  alt="QR Code"
                                  width={180}
                                  height={180}
                                />
                              </div>
                            </div>

                            {/* Valor */}
                            <p className="text-center font-bold text-lg">R$ {pixAtual.valor.toFixed(2)}</p>

                            {/* Copia e Cola */}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Codigo Copia e Cola:</p>
                              <div className="flex gap-2">
                                <Input 
                                  value={pixAtual.copiaCola} 
                                  readOnly 
                                  className="font-mono text-xs"
                                />
                                <Button variant="outline" size="icon" onClick={copiarCodigo}>
                                  {textoCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>

                            {/* Confirmar */}
                            <Button onClick={confirmarPagamento} className="w-full bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirmar Pagamento
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Botao Resetar */}
          <Button variant="outline" onClick={resetar} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Novo Pagamento
          </Button>
        </>
      )}
    </div>
  )
}
