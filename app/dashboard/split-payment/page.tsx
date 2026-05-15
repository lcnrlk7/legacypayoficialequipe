"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, Clock, ArrowRight, Copy, QrCode, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Parcela {
  id: string
  valor: number
  status: "pending" | "waiting" | "paid" | "expired"
  qrCode?: string
  copyPaste?: string
  transactionId?: string
}

// Funcao para dividir valor em parcelas variaveis (para nao parecer suspeito)
function dividirEmParcelas(valorTotal: number, limiteMax: number = 2000): number[] {
  const parcelas: number[] = []
  let restante = valorTotal
  
  // Valores base para variar (entre 70% e 100% do limite)
  const valoresBase = [1500, 1600, 1700, 1800, 1900, 2000, 1550, 1650, 1750, 1850, 1950]
  
  let index = 0
  while (restante > 0) {
    if (restante <= limiteMax) {
      // Ultima parcela - usa o valor restante
      parcelas.push(restante)
      break
    } else {
      // Escolhe um valor variado para parecer mais natural
      const valorParcela = valoresBase[index % valoresBase.length]
      parcelas.push(valorParcela)
      restante -= valorParcela
      index++
    }
  }
  
  return parcelas
}

export default function SplitPaymentPage() {
  const [valorTotal, setValorTotal] = useState("")
  const [descricao, setDescricao] = useState("")
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [parcelaAtual, setParcelaAtual] = useState(0)
  const [loading, setLoading] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [etapa, setEtapa] = useState<"input" | "payment">("input")
  
  // Calcular progresso
  const parcelasPagas = parcelas.filter(p => p.status === "paid").length
  const valorPago = parcelas.filter(p => p.status === "paid").reduce((acc, p) => acc + p.valor, 0)
  const progresso = parcelas.length > 0 ? (parcelasPagas / parcelas.length) * 100 : 0
  
  // Gerar preview das parcelas
  const previewParcelas = valorTotal ? dividirEmParcelas(Number(valorTotal)) : []
  
  // Iniciar processo de pagamento
  const iniciarPagamento = () => {
    if (!valorTotal || Number(valorTotal) < 100) {
      toast.error("Valor minimo: R$ 100,00")
      return
    }
    
    const valores = dividirEmParcelas(Number(valorTotal))
    const novasParcelas: Parcela[] = valores.map((valor, index) => ({
      id: `parcela_${index + 1}_${Date.now()}`,
      valor,
      status: index === 0 ? "waiting" : "pending"
    }))
    
    setParcelas(novasParcelas)
    setParcelaAtual(0)
    setEtapa("payment")
    
    // Gerar QR da primeira parcela automaticamente
    gerarQrParcela(0, novasParcelas)
  }
  
  // Gerar QR Code para uma parcela
  const gerarQrParcela = async (index: number, parcelasAtuais?: Parcela[]) => {
    const lista = parcelasAtuais || parcelas
    const parcela = lista[index]
    
    if (!parcela) return
    
    setGerando(true)
    
    try {
      const response = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parcela.valor,
          description: descricao || `Pagamento ${index + 1}/${lista.length} - LegacyPay`,
          externalId: parcela.id,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar QR Code")
      }
      
      // Atualizar parcela com QR Code
      const novasParcelas = [...lista]
      novasParcelas[index] = {
        ...novasParcelas[index],
        qrCode: data.qrCodeBase64 || data.qrCode,
        copyPaste: data.copyPaste || data.qrCode,
        transactionId: data.transactionId,
        status: "waiting"
      }
      setParcelas(novasParcelas)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar QR Code")
    } finally {
      setGerando(false)
    }
  }
  
  // Verificar status do pagamento
  const verificarPagamento = async () => {
    const parcela = parcelas[parcelaAtual]
    if (!parcela?.transactionId) return
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/transactions/${parcela.transactionId}`)
      const data = await response.json()
      
      if (data.status === "paid") {
        // Marcar como pago
        const novasParcelas = [...parcelas]
        novasParcelas[parcelaAtual].status = "paid"
        
        // Se tiver proxima parcela, prepara ela
        if (parcelaAtual + 1 < parcelas.length) {
          novasParcelas[parcelaAtual + 1].status = "waiting"
          setParcelas(novasParcelas)
          setParcelaAtual(parcelaAtual + 1)
          
          // Gerar QR da proxima parcela
          toast.success(`Parcela ${parcelaAtual + 1} paga! Gerando proxima...`)
          await gerarQrParcela(parcelaAtual + 1, novasParcelas)
        } else {
          setParcelas(novasParcelas)
          toast.success("Todas as parcelas foram pagas!")
        }
      } else {
        toast.info("Pagamento ainda nao confirmado. Tente novamente em alguns segundos.")
      }
    } catch (error) {
      toast.error("Erro ao verificar pagamento")
    } finally {
      setLoading(false)
    }
  }
  
  // Copiar codigo PIX
  const copiarPix = () => {
    const parcela = parcelas[parcelaAtual]
    if (parcela?.copyPaste) {
      navigator.clipboard.writeText(parcela.copyPaste)
      toast.success("Codigo PIX copiado!")
    }
  }
  
  // Voltar ao inicio
  const reiniciar = () => {
    setParcelas([])
    setParcelaAtual(0)
    setEtapa("input")
    setValorTotal("")
    setDescricao("")
  }
  
  // Verificar pagamento automaticamente a cada 10 segundos
  useEffect(() => {
    if (etapa !== "payment") return
    if (parcelas[parcelaAtual]?.status !== "waiting") return
    if (!parcelas[parcelaAtual]?.transactionId) return
    
    const interval = setInterval(verificarPagamento, 10000)
    return () => clearInterval(interval)
  }, [etapa, parcelaAtual, parcelas])
  
  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pagamento Dividido</h1>
        <p className="text-muted-foreground">
          Divida valores grandes em multiplas transacoes para evitar bloqueios
        </p>
      </div>
      
      {etapa === "input" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Valor Total</CardTitle>
              <CardDescription>
                Digite o valor que deseja receber. O sistema vai dividir automaticamente em parcelas de ate R$ 2.000
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Valor (R$)</label>
                <Input
                  type="number"
                  placeholder="Ex: 10000"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  className="text-lg"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Descricao (opcional)</label>
                <Input
                  placeholder="Ex: Pagamento de servico"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={iniciarPagamento} 
                className="w-full"
                disabled={!valorTotal || Number(valorTotal) < 100}
              >
                Gerar Parcelas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          
          {/* Preview das parcelas */}
          <Card>
            <CardHeader>
              <CardTitle>Preview das Parcelas</CardTitle>
              <CardDescription>
                Veja como o valor sera dividido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewParcelas.length > 0 ? (
                <div className="space-y-2">
                  {previewParcelas.map((valor, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <span className="text-sm text-muted-foreground">
                        Parcela {index + 1}
                      </span>
                      <span className="font-semibold">
                        R$ {valor.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-primary">
                      R$ {previewParcelas.reduce((a, b) => a + b, 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Os valores variam entre R$ 1.500 e R$ 2.000 para parecer mais natural
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Digite um valor para ver as parcelas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progresso */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="text-2xl font-bold">
                    {parcelasPagas} de {parcelas.length} parcelas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor recebido</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {valorPago.toFixed(2)}
                  </p>
                </div>
              </div>
              <Progress value={progresso} className="h-3" />
            </CardContent>
          </Card>
          
          {/* Lista de parcelas */}
          <div className="grid gap-3">
            {parcelas.map((parcela, index) => (
              <Card 
                key={parcela.id}
                className={`transition-all ${
                  index === parcelaAtual ? "ring-2 ring-primary" : ""
                } ${parcela.status === "paid" ? "bg-green-500/5 border-green-500/30" : ""}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        parcela.status === "paid" 
                          ? "bg-green-500/20 text-green-500" 
                          : parcela.status === "waiting"
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                      }`}>
                        {parcela.status === "paid" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : parcela.status === "waiting" ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Parcela {index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {parcela.valor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant={
                      parcela.status === "paid" ? "default" :
                      parcela.status === "waiting" ? "secondary" : "outline"
                    } className={
                      parcela.status === "paid" ? "bg-green-500" : ""
                    }>
                      {parcela.status === "paid" ? "Pago" :
                       parcela.status === "waiting" ? "Aguardando" : "Pendente"}
                    </Badge>
                  </div>
                  
                  {/* QR Code da parcela atual */}
                  {index === parcelaAtual && parcela.status === "waiting" && (
                    <div className="mt-4 pt-4 border-t">
                      {gerando ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="ml-2">Gerando QR Code...</span>
                        </div>
                      ) : parcela.qrCode ? (
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                          <div className="bg-white p-4 rounded-lg">
                            <Image
                              src={`data:image/png;base64,${parcela.qrCode}`}
                              alt="QR Code PIX"
                              width={200}
                              height={200}
                              className="w-48 h-48"
                            />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Codigo PIX Copia e Cola</p>
                              <div className="flex gap-2">
                                <Input 
                                  value={parcela.copyPaste || ""} 
                                  readOnly 
                                  className="font-mono text-xs"
                                />
                                <Button variant="outline" size="icon" onClick={copiarPix}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={verificarPagamento} 
                                disabled={loading}
                                className="flex-1"
                              >
                                {loading ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Verificar Pagamento
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Verificacao automatica a cada 10 segundos
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={() => gerarQrParcela(index)} className="w-full">
                          <QrCode className="w-4 h-4 mr-2" />
                          Gerar QR Code
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Acoes */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={reiniciar} className="flex-1">
              Novo Pagamento
            </Button>
            {parcelasPagas === parcelas.length && (
              <Button className="flex-1 bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Concluido!
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
