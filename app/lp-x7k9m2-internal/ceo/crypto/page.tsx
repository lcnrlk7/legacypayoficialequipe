"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bitcoin, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Search,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Coins
} from "lucide-react"

interface CryptoTransaction {
  id: string
  user_id: string
  user_email: string
  type: "deposit" | "withdraw"
  coin: string
  amount_crypto: number
  amount_brl: number
  fee_brl: number
  fee_crypto: number
  wallet_address: string
  tx_hash: string | null
  status: "pending" | "confirmed" | "completed" | "failed"
  created_at: string
  confirmed_at: string | null
}

interface CryptoStats {
  total_deposits_brl: number
  total_deposits_count: number
  total_withdraws_brl: number
  total_withdraws_count: number
  total_fees_brl: number
  pending_deposits: number
  pending_withdraws: number
  today_deposits_brl: number
  today_withdraws_brl: number
  today_fees_brl: number
}

export default function CeoCryptoPage() {
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([])
  const [stats, setStats] = useState<CryptoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"all" | "deposit" | "withdraw">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "failed">("all")

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/crypto")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error("Erro ao carregar dados crypto:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      tx.wallet_address?.toLowerCase().includes(search.toLowerCase()) ||
      tx.tx_hash?.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = filterType === "all" || tx.type === filterType
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Concluido</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>
    }
  }

  const getCoinIcon = (coin: string) => {
    switch (coin) {
      case "BTC":
        return <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">₿</div>
      case "LTC":
        return <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">Ł</div>
      case "ETH":
        return <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">Ξ</div>
      default:
        return <Coins className="w-8 h-8 text-gray-400" />
    }
  }

  const formatCrypto = (amount: number, coin: string) => {
    return `${amount.toFixed(8)} ${coin}`
  }

  const formatBRL = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Bitcoin className="w-8 h-8 text-orange-500" />
              Gestao Crypto
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie depositos e saques em criptomoedas
            </p>
          </div>
          <Button onClick={loadData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  Total Depositos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">{formatBRL(stats.total_deposits_brl)}</p>
                <p className="text-sm text-muted-foreground">{stats.total_deposits_count} transacoes</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                  Total Saques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">{formatBRL(stats.total_withdraws_brl)}</p>
                <p className="text-sm text-muted-foreground">{stats.total_withdraws_count} transacoes</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  Total Taxas (Lucro)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-500">{formatBRL(stats.total_fees_brl)}</p>
                <p className="text-sm text-muted-foreground">Taxas coletadas</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Hoje
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-500">{formatBRL(stats.today_fees_brl)}</p>
                <p className="text-sm text-muted-foreground">
                  Dep: {formatBRL(stats.today_deposits_brl)} | Saq: {formatBRL(stats.today_withdraws_brl)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pendentes */}
        {stats && (stats.pending_deposits > 0 || stats.pending_withdraws > 0) && (
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-500">Transacoes Pendentes</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.pending_deposits} depositos e {stats.pending_withdraws} saques aguardando confirmacao
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Taxas Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Configuracao de Taxas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Taxa Deposito</p>
                <p className="text-xl font-bold">2.5%</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Taxa Saque</p>
                <p className="text-xl font-bold">3.0%</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Min. Deposito</p>
                <p className="text-xl font-bold">R$ 20</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Min. Saque</p>
                <p className="text-xl font-bold">R$ 50</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Taxa do CoinRemitter (0.23%) ja inclusa nas taxas acima
            </p>
          </CardContent>
        </Card>

        {/* Filtros e Busca */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Transacoes Crypto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email, carteira ou hash..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                >
                  Todos
                </Button>
                <Button
                  variant={filterType === "deposit" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("deposit")}
                  className={filterType === "deposit" ? "bg-green-600" : ""}
                >
                  <ArrowDownLeft className="w-4 h-4 mr-1" />
                  Depositos
                </Button>
                <Button
                  variant={filterType === "withdraw" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("withdraw")}
                  className={filterType === "withdraw" ? "bg-red-600" : ""}
                >
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Saques
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  Todos
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                >
                  Pendentes
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("completed")}
                >
                  Concluidos
                </Button>
              </div>
            </div>

            {/* Lista de Transacoes */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando transacoes...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transacao encontrada
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 bg-muted/30 rounded-lg border border-border hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCoinIcon(tx.coin)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {tx.type === "deposit" ? "Deposito" : "Saque"} {tx.coin}
                            </span>
                            {getStatusBadge(tx.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{tx.user_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === "deposit" ? "text-green-500" : "text-red-500"}`}>
                          {tx.type === "deposit" ? "+" : "-"}{formatBRL(tx.amount_brl)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCrypto(tx.amount_crypto, tx.coin)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Taxa:</span>
                        <span className="ml-1 text-orange-400">{formatBRL(tx.fee_brl)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data:</span>
                        <span className="ml-1">{new Date(tx.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Carteira:</span>
                        <span className="ml-1 font-mono text-xs">{tx.wallet_address?.slice(0, 20)}...</span>
                      </div>
                      {tx.tx_hash && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">TX Hash:</span>
                          <a 
                            href={`https://blockchair.com/search?q=${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 font-mono text-xs text-blue-400 hover:underline"
                          >
                            {tx.tx_hash.slice(0, 20)}...
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
