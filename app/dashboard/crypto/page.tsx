"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, RefreshCw, Coins } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface CoinInfo {
  id: string
  name: string
  icon: string
  color: string
  rate: number
  formatted: string
  network: string
  networkFee: number
}

// Configuracao das moedas com taxas de rede
const COINS_CONFIG = [
  { id: "BTC", name: "Bitcoin", icon: "₿", network: "Bitcoin", networkFee: 5.00, minWithdraw: 20, maxWithdraw: 50000 },
  { id: "LTC", name: "Litecoin", icon: "Ł", network: "Litecoin", networkFee: 2.00, minWithdraw: 20, maxWithdraw: 50000 },
]

export default function CryptoWithdrawPage() {
  const [selectedCoin, setSelectedCoin] = useState(COINS_CONFIG[0])
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rates, setRates] = useState<Record<string, number>>({})

  // Carregar saldo do usuario
  const { data: userData } = useSWR("/api/user/balance", fetcher, {
    refreshInterval: 10000,
  })

  // Carregar cotacoes
  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    try {
      const response = await fetch("/api/crypto/rates")
      const data = await response.json()
      if (data.success && data.rates) {
        const ratesMap: Record<string, number> = {}
        data.rates.forEach((r: any) => {
          ratesMap[r.id] = r.rate
        })
        setRates(ratesMap)
      }
    } catch (err) {
      console.error("Erro ao carregar cotacoes:", err)
    }
  }

  const balance = userData?.balance || 0
  const currentRate = rates[selectedCoin.id] || 0
  const platformFee = withdrawAmount ? parseFloat(withdrawAmount) * 0.03 : 0 // 3% taxa
  const totalDebit = withdrawAmount ? parseFloat(withdrawAmount) + platformFee + selectedCoin.networkFee : 0
  const cryptoAmount = currentRate > 0 && withdrawAmount ? parseFloat(withdrawAmount) / currentRate : 0

  // Processar saque
  const processWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount) {
      setError("Preencha todos os campos")
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (amount < selectedCoin.minWithdraw) {
      setError(`Valor minimo: R$ ${selectedCoin.minWithdraw.toFixed(2)}`)
      return
    }
    if (amount > selectedCoin.maxWithdraw) {
      setError(`Valor maximo: R$ ${selectedCoin.maxWithdraw.toFixed(2)}`)
      return
    }
    if (totalDebit > balance) {
      setError("Saldo insuficiente")
      return
    }

    setWithdrawLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/crypto/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coin: selectedCoin.id,
          address: withdrawAddress,
          amountBRL: amount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setWithdrawAmount("")
        setWithdrawAddress("")
      } else {
        setError(data.error || "Erro ao processar saque")
      }
    } catch (err) {
      setError("Erro de conexao. Tente novamente.")
    }

    setWithdrawLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Saque Solicitado!</h2>
            <p className="text-muted-foreground mb-6">
              Seu saque de {cryptoAmount.toFixed(8)} {selectedCoin.id} foi enviado para processamento.
              Voce recebera na carteira informada em alguns minutos.
            </p>
            <Link
              href="/dashboard/wallet"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-3 font-semibold transition-colors"
            >
              Voltar para Carteira
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/wallet" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saque em Criptomoeda</h1>
            <p className="text-muted-foreground text-sm">Converta seu saldo em {selectedCoin.id} ({selectedCoin.network})</p>
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          {/* Titulo da Secao */}
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">Saque em Criptomoeda ({selectedCoin.id})</h2>
              <p className="text-sm text-muted-foreground">
                Converta seu saldo em BRL para {selectedCoin.id} na rede {selectedCoin.network}
              </p>
            </div>
          </div>

          {/* Saldo Disponivel */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Saldo disponivel</p>
            <p className="text-2xl font-bold text-foreground">
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Selecao de Moeda */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Moeda</label>
            <div className="grid grid-cols-2 gap-3">
              {COINS_CONFIG.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoin(coin)}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedCoin.id === coin.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/30 hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{coin.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{coin.id}</p>
                      <p className="text-xs text-muted-foreground">{coin.network}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cotacao e Taxa */}
          <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Cotacao:</span> 1 {selectedCoin.id} = R$ {currentRate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Taxa da rede:</span> R$ {selectedCoin.networkFee.toFixed(2)}
                </p>
              </div>
            </div>
            <button onClick={loadRates} className="text-primary hover:text-primary/80">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Valor do Saque */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Valor do saque (BRL)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value)
                  setError(null)
                }}
                placeholder="0,00"
                className="w-full bg-muted border border-border rounded-xl p-4 pl-12 text-foreground text-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Valor minimo: R$ {selectedCoin.minWithdraw.toFixed(2)} | Valor maximo: R$ {selectedCoin.maxWithdraw.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Endereco da Wallet */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Wallet {selectedCoin.network} ({selectedCoin.id})</label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => {
                setWithdrawAddress(e.target.value)
                setError(null)
              }}
              placeholder={selectedCoin.id === "BTC" ? "bc1q..." : "L..."}
              className="w-full bg-muted border border-border rounded-xl p-4 text-foreground font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Endereco da sua wallet compativel com {selectedCoin.id} ({selectedCoin.network})
            </p>
          </div>

          {/* Resumo */}
          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor do saque:</span>
                <span className="text-foreground">R$ {parseFloat(withdrawAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa da plataforma (3%):</span>
                <span className="text-foreground">R$ {platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa da rede:</span>
                <span className="text-foreground">R$ {selectedCoin.networkFee.toFixed(2)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Total debitado:</span>
                <span className="text-foreground">R$ {totalDebit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Voce recebe:</span>
                <span className="text-primary">{cryptoAmount.toFixed(8)} {selectedCoin.id}</span>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Botao Confirmar */}
          <button
            onClick={processWithdraw}
            disabled={withdrawLoading || !withdrawAddress || !withdrawAmount || parseFloat(withdrawAmount) < selectedCoin.minWithdraw}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-xl p-4 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {withdrawLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Coins className="w-5 h-5" />
                Confirmar saque
              </>
            )}
          </button>
        </div>

        {/* Aviso */}
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-500 text-sm">
            <strong>Atencao:</strong> Verifique o endereco da carteira antes de confirmar. 
            Transacoes em blockchain sao irreversiveis.
          </p>
        </div>
      </div>
    </div>
  )
}
