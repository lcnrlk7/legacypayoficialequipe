"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Bitcoin, Copy, Check, Loader2, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react"
import Link from "next/link"

interface CoinInfo {
  id: string
  name: string
  icon: string
  color: string
  rate: number
  formatted: string
}

export default function CryptoPage() {
  const [coins, setCoins] = useState<CoinInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null)
  const [mode, setMode] = useState<"menu" | "deposit" | "withdraw">("menu")
  const [depositAddress, setDepositAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingAddress, setLoadingAddress] = useState(false)
  
  // Saque
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawResult, setWithdrawResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Carregar cotacoes
  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/crypto/rates")
      const data = await response.json()
      if (data.success) {
        setCoins(data.rates)
      }
    } catch (err) {
      console.error("Erro ao carregar cotacoes:", err)
    }
    setLoading(false)
  }

  // Criar endereco de deposito
  const createDeposit = async (coin: string) => {
    setLoadingAddress(true)
    setError(null)
    try {
      const response = await fetch("/api/crypto/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin }),
      })
      const data = await response.json()
      if (data.success) {
        setDepositAddress(data.address)
      } else {
        setError(data.error || "Erro ao criar endereco")
      }
    } catch (err) {
      setError("Erro ao criar endereco de deposito")
    }
    setLoadingAddress(false)
  }

  // Processar saque
  const processWithdraw = async () => {
    if (!selectedCoin || !withdrawAddress || !withdrawAmount) return
    
    setWithdrawLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/crypto/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coin: selectedCoin,
          address: withdrawAddress,
          amountBRL: parseFloat(withdrawAmount),
        }),
      })
      const data = await response.json()
      if (data.success) {
        setWithdrawResult(data.withdrawal)
      } else {
        setError(data.error || "Erro ao processar saque")
      }
    } catch (err) {
      setError("Erro ao processar saque")
    }
    setWithdrawLoading(false)
  }

  // Copiar endereco
  const copyAddress = () => {
    if (depositAddress) {
      navigator.clipboard.writeText(depositAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const selectedCoinInfo = coins.find((c) => c.id === selectedCoin)
  const fee = withdrawAmount ? parseFloat(withdrawAmount) * 0.03 : 0 // 3% taxa de saque
  const total = withdrawAmount ? parseFloat(withdrawAmount) + fee : 0

  // Menu principal
  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <Link href="/dashboard/wallet" className="flex items-center gap-2 text-muted-foreground mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-2">Crypto</h1>
          <p className="text-muted-foreground mb-6">Deposite ou saque em criptomoedas</p>

          {/* Cotacoes */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Cotacoes</h2>
              <button onClick={loadRates} className="text-primary">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {coins.map((coin) => (
                  <div key={coin.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: coin.color }}
                      >
                        {coin.icon}
                      </div>
                      <span className="font-medium text-foreground">{coin.name}</span>
                    </div>
                    <span className="text-muted-foreground">{coin.formatted}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opcoes */}
          <div className="space-y-3">
            <button
              onClick={() => setMode("deposit")}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 flex items-center justify-center gap-3 transition-colors"
            >
              <ArrowDownToLine className="w-5 h-5" />
              <span className="font-semibold">Depositar Crypto</span>
            </button>

            <button
              onClick={() => setMode("withdraw")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-3 transition-colors"
            >
              <ArrowUpFromLine className="w-5 h-5" />
              <span className="font-semibold">Sacar em Crypto</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Deposito
  if (mode === "deposit") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => { setMode("menu"); setSelectedCoin(null); setDepositAddress(null); }} className="flex items-center gap-2 text-muted-foreground mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <h1 className="text-2xl font-bold text-foreground mb-2">Depositar Crypto</h1>
          <p className="text-muted-foreground mb-6">Selecione a moeda e envie para o endereco</p>

          {!selectedCoin ? (
            <div className="space-y-3">
              {coins.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => { setSelectedCoin(coin.id); createDeposit(coin.id); }}
                  className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-colors"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: coin.color }}
                  >
                    {coin.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">{coin.name}</div>
                    <div className="text-sm text-muted-foreground">{coin.id}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedCoinInfo?.color }}
                >
                  {selectedCoinInfo?.icon}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{selectedCoinInfo?.name}</div>
                  <div className="text-sm text-muted-foreground">Cotacao: {selectedCoinInfo?.formatted}</div>
                </div>
              </div>

              {loadingAddress ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <span className="text-muted-foreground">Gerando endereco...</span>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-center">
                  {error}
                </div>
              ) : depositAddress ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Envie {selectedCoin} para o endereco abaixo:
                  </p>
                  <div className="bg-muted rounded-lg p-3 break-all font-mono text-sm text-foreground mb-3">
                    {depositAddress}
                  </div>
                  <button
                    onClick={copyAddress}
                    className="w-full bg-primary text-primary-foreground rounded-lg p-3 flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? "Copiado!" : "Copiar Endereco"}
                  </button>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    O deposito sera creditado apos 1 confirmacao na rede.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Saque
  if (mode === "withdraw") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => { setMode("menu"); setSelectedCoin(null); setWithdrawResult(null); setWithdrawAddress(""); setWithdrawAmount(""); }} className="flex items-center gap-2 text-muted-foreground mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <h1 className="text-2xl font-bold text-foreground mb-2">Sacar em Crypto</h1>
          <p className="text-muted-foreground mb-6">Converta seu saldo para criptomoeda</p>

          {withdrawResult ? (
            <div className="bg-card border border-green-500 rounded-xl p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Saque Enviado!</h2>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moeda:</span>
                  <span className="text-foreground font-medium">{withdrawResult.coin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="text-foreground font-medium">{withdrawResult.amountCrypto.toFixed(8)} {withdrawResult.coin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debitado:</span>
                  <span className="text-foreground font-medium">R$ {withdrawResult.totalDebit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-yellow-500 font-medium">Processando</span>
                </div>
              </div>

              {withdrawResult.explorerUrl && (
                <a 
                  href={withdrawResult.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-primary text-primary-foreground rounded-lg p-3 text-center mt-4"
                >
                  Ver na Blockchain
                </a>
              )}
            </div>
          ) : !selectedCoin ? (
            <div className="space-y-3">
              {coins.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoin(coin.id)}
                  className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary transition-colors"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: coin.color }}
                  >
                    {coin.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">{coin.name}</div>
                    <div className="text-sm text-muted-foreground">Cotacao: {coin.formatted}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedCoinInfo?.color }}
                >
                  {selectedCoinInfo?.icon}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{selectedCoinInfo?.name}</div>
                  <div className="text-sm text-muted-foreground">Cotacao: {selectedCoinInfo?.formatted}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Endereco {selectedCoin} de destino
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder={`Cole seu endereco ${selectedCoin} aqui`}
                    className="w-full bg-muted border border-border rounded-lg p-3 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Valor em Reais (R$)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0,00"
                    min="50"
                    className="w-full bg-muted border border-border rounded-lg p-3 text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimo: R$ 50,00</p>
                </div>

                {withdrawAmount && parseFloat(withdrawAmount) >= 50 && (
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="text-foreground">R$ {parseFloat(withdrawAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa (2%):</span>
                      <span className="text-foreground">R$ {fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                      <span className="text-foreground">Total debitado:</span>
                      <span className="text-foreground">R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Voce recebe:</span>
                      <span className="text-primary font-medium">
                        ~{(parseFloat(withdrawAmount) / (selectedCoinInfo?.rate || 1)).toFixed(8)} {selectedCoin}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={processWithdraw}
                  disabled={!withdrawAddress || !withdrawAmount || parseFloat(withdrawAmount) < 50 || withdrawLoading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-lg p-4 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {withdrawLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="w-5 h-5" />
                      Confirmar Saque
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
