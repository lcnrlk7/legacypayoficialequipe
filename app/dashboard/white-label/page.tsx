"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Globe, 
  Database, 
  Palette, 
  CreditCard, 
  Settings, 
  Check, 
  X, 
  Loader2, 
  ArrowLeft,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface Tenant {
  id: string
  name: string
  slug: string
  domain_app: string | null
  domain_admin: string | null
  database_url: string | null
  logo_url: string | null
  mascot_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  text_color: string
  use_hyperion_gateway: boolean
  gateway_provider: string | null
  gateway_client_id: string | null
  gateway_client_secret: string | null
  transaction_fee: number
  withdraw_fee: number
  min_withdraw: number
  is_active: boolean
  database_configured: boolean
}

interface DomainStatus {
  app: { configured: boolean; verified: boolean }
  admin: { configured: boolean; verified: boolean }
}

export default function WhiteLabelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [domainStatus, setDomainStatus] = useState<DomainStatus | null>(null)
  const [activeTab, setActiveTab] = useState("geral")
  
  // Form states
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [domainApp, setDomainApp] = useState("")
  const [domainAdmin, setDomainAdmin] = useState("")
  const [databaseUrl, setDatabaseUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [mascotUrl, setMascotUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#FF5500")
  const [secondaryColor, setSecondaryColor] = useState("#1A1A1A")
  const [textColor, setTextColor] = useState("#FFFFFF")
  const [useHyperionGateway, setUseHyperionGateway] = useState(true)
  const [gatewayProvider, setGatewayProvider] = useState("")
  const [gatewayClientId, setGatewayClientId] = useState("")
  const [gatewayClientSecret, setGatewayClientSecret] = useState("")
  const [transactionFee, setTransactionFee] = useState("2.5")
  const [withdrawFee, setWithdrawFee] = useState("3.00")
  const [minWithdraw, setMinWithdraw] = useState("10.00")
  
  // Action states
  const [testingDb, setTestingDb] = useState(false)
  const [settingUpDb, setSettingUpDb] = useState(false)
  const [addingDomain, setAddingDomain] = useState<"app" | "admin" | null>(null)
  const [checkingDomain, setCheckingDomain] = useState<"app" | "admin" | null>(null)

  useEffect(() => {
    loadTenant()
  }, [])

  const loadTenant = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/white-label/tenant")
      const data = await response.json()
      
      if (data.tenant) {
        setTenant(data.tenant)
        setDomainStatus(data.domainStatus)
        // Preencher formulario
        setName(data.tenant.name || "")
        setSlug(data.tenant.slug || "")
        setDomainApp(data.tenant.domain_app || "")
        setDomainAdmin(data.tenant.domain_admin || "")
        setDatabaseUrl(data.tenant.database_url || "")
        setLogoUrl(data.tenant.logo_url || "")
        setMascotUrl(data.tenant.mascot_url || "")
        setFaviconUrl(data.tenant.favicon_url || "")
        setPrimaryColor(data.tenant.primary_color || "#FF5500")
        setSecondaryColor(data.tenant.secondary_color || "#1A1A1A")
        setTextColor(data.tenant.text_color || "#FFFFFF")
        setUseHyperionGateway(data.tenant.use_hyperion_gateway)
        setGatewayProvider(data.tenant.gateway_provider || "")
        setGatewayClientId(data.tenant.gateway_client_id || "")
        setGatewayClientSecret(data.tenant.gateway_client_secret || "")
        setTransactionFee(String(data.tenant.transaction_fee || "2.5"))
        setWithdrawFee(String(data.tenant.withdraw_fee || "3.00"))
        setMinWithdraw(String(data.tenant.min_withdraw || "10.00"))
      }
    } catch (error) {
      console.error("Erro ao carregar tenant:", error)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/white-label/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          domain_app: domainApp || null,
          domain_admin: domainAdmin || null,
          database_url: databaseUrl || null,
          logo_url: logoUrl || null,
          mascot_url: mascotUrl || null,
          favicon_url: faviconUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          text_color: textColor,
          use_hyperion_gateway: useHyperionGateway,
          gateway_provider: gatewayProvider || null,
          gateway_client_id: gatewayClientId || null,
          gateway_client_secret: gatewayClientSecret || null,
          transaction_fee: parseFloat(transactionFee),
          withdraw_fee: parseFloat(withdrawFee),
          min_withdraw: parseFloat(minWithdraw),
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Configuracoes salvas com sucesso")
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao salvar")
      }
    } catch (error) {
      toast.error("Erro ao salvar configuracoes")
    }
    setSaving(false)
  }

  const handleTestDatabase = async () => {
    if (!databaseUrl) {
      toast.error("Informe a URL do banco de dados")
      return
    }
    
    setTestingDb(true)
    try {
      const response = await fetch("/api/white-label/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database_url: databaseUrl }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Conexao bem sucedida!")
      } else {
        toast.error(data.error || "Falha na conexao")
      }
    } catch (error) {
      toast.error("Erro ao testar conexao")
    }
    setTestingDb(false)
  }

  const handleSetupDatabase = async () => {
    if (!databaseUrl) {
      toast.error("Informe a URL do banco de dados")
      return
    }
    
    setSettingUpDb(true)
    try {
      const response = await fetch("/api/white-label/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database_url: databaseUrl, action: "setup" }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Tabelas criadas com sucesso!")
        loadTenant()
      } else {
        toast.error(data.error || "Falha ao criar tabelas")
      }
    } catch (error) {
      toast.error("Erro ao criar tabelas")
    }
    setSettingUpDb(false)
  }

  const handleAddDomain = async (type: "app" | "admin") => {
    const domain = type === "app" ? domainApp : domainAdmin
    
    if (!domain) {
      toast.error("Informe o dominio")
      return
    }
    
    setAddingDomain(type)
    try {
      const response = await fetch("/api/white-label/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, type }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Dominio adicionado! Configure o DNS.")
        loadTenant()
      } else {
        toast.error(data.error || "Falha ao adicionar dominio")
      }
    } catch (error) {
      toast.error("Erro ao adicionar dominio")
    }
    setAddingDomain(null)
  }

  const handleCheckDomain = async (type: "app" | "admin") => {
    const domain = type === "app" ? domainApp : domainAdmin
    
    if (!domain) return
    
    setCheckingDomain(type)
    try {
      const response = await fetch(`/api/white-label/domain?domain=${domain}`)
      const data = await response.json()
      
      if (data.verified) {
        toast.success("DNS configurado corretamente!")
      } else if (data.configured) {
        toast.info("Dominio adicionado, aguardando propagacao do DNS")
      } else {
        toast.warning("DNS ainda nao configurado")
      }
      
      loadTenant()
    } catch (error) {
      toast.error("Erro ao verificar dominio")
    }
    setCheckingDomain(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado!")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">White Label</h1>
            <p className="text-muted-foreground">Configure sua plataforma personalizada</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tenant?.name ? "bg-green-500/20" : "bg-muted"}`}>
                {tenant?.name ? <Check className="w-5 h-5 text-green-500" /> : <Settings className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Configuracao</p>
                <p className="font-medium text-foreground">{tenant?.name ? "Completa" : "Pendente"}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tenant?.database_configured ? "bg-green-500/20" : "bg-muted"}`}>
                {tenant?.database_configured ? <Check className="w-5 h-5 text-green-500" /> : <Database className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Banco de Dados</p>
                <p className="font-medium text-foreground">{tenant?.database_configured ? "Configurado" : "Pendente"}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${domainStatus?.app?.verified ? "bg-green-500/20" : "bg-muted"}`}>
                {domainStatus?.app?.verified ? <Check className="w-5 h-5 text-green-500" /> : <Globe className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dominio App</p>
                <p className="font-medium text-foreground">{domainStatus?.app?.verified ? "Ativo" : domainStatus?.app?.configured ? "DNS Pendente" : "Pendente"}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${domainStatus?.admin?.verified ? "bg-green-500/20" : "bg-muted"}`}>
                {domainStatus?.admin?.verified ? <Check className="w-5 h-5 text-green-500" /> : <Globe className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dominio Admin</p>
                <p className="font-medium text-foreground">{domainStatus?.admin?.verified ? "Ativo" : domainStatus?.admin?.configured ? "DNS Pendente" : "Pendente"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="dominios">Dominios</TabsTrigger>
            <TabsTrigger value="banco">Banco de Dados</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="gateway">Gateway</TabsTrigger>
          </TabsList>

          {/* Tab Geral */}
          <TabsContent value="geral">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Informacoes Gerais</CardTitle>
                <CardDescription>Configure o nome e identificador da sua plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Plataforma</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Minha Plataforma Pay"
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (identificador unico)</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="minha-plataforma"
                      className="bg-muted border-border"
                      disabled={!!tenant?.slug}
                    />
                    <p className="text-xs text-muted-foreground">Nao pode ser alterado depois de criado</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionFee">Taxa por Transacao (%)</Label>
                    <Input
                      id="transactionFee"
                      type="number"
                      step="0.01"
                      value={transactionFee}
                      onChange={(e) => setTransactionFee(e.target.value)}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawFee">Taxa de Saque (R$)</Label>
                    <Input
                      id="withdrawFee"
                      type="number"
                      step="0.01"
                      value={withdrawFee}
                      onChange={(e) => setWithdrawFee(e.target.value)}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minWithdraw">Saque Minimo (R$)</Label>
                    <Input
                      id="minWithdraw"
                      type="number"
                      step="0.01"
                      value={minWithdraw}
                      onChange={(e) => setMinWithdraw(e.target.value)}
                      className="bg-muted border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Dominios */}
          <TabsContent value="dominios">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Dominios Personalizados</CardTitle>
                <CardDescription>Configure os dominios da sua plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dominio App */}
                <div className="space-y-3">
                  <Label>Dominio do Aplicativo (usuarios)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={domainApp}
                      onChange={(e) => setDomainApp(e.target.value.toLowerCase())}
                      placeholder="app.suaempresa.com.br"
                      className="bg-muted border-border"
                    />
                    <Button 
                      onClick={() => handleAddDomain("app")}
                      disabled={addingDomain === "app" || !domainApp}
                    >
                      {addingDomain === "app" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
                    </Button>
                    {tenant?.domain_app && (
                      <Button 
                        variant="outline"
                        onClick={() => handleCheckDomain("app")}
                        disabled={checkingDomain === "app"}
                      >
                        {checkingDomain === "app" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                  {domainStatus?.app?.configured && !domainStatus?.app?.verified && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <p className="text-sm text-yellow-500 font-medium mb-2">Configure o DNS:</p>
                      <div className="bg-muted rounded p-3 flex items-center justify-between">
                        <code className="text-sm text-foreground">CNAME → cname.vercel-dns.com</code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard("cname.vercel-dns.com")}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {domainStatus?.app?.verified && (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">DNS configurado e verificado</span>
                    </div>
                  )}
                </div>

                {/* Dominio Admin */}
                <div className="space-y-3">
                  <Label>Dominio do Admin (CEO/gestao)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={domainAdmin}
                      onChange={(e) => setDomainAdmin(e.target.value.toLowerCase())}
                      placeholder="admin.suaempresa.com.br"
                      className="bg-muted border-border"
                    />
                    <Button 
                      onClick={() => handleAddDomain("admin")}
                      disabled={addingDomain === "admin" || !domainAdmin}
                    >
                      {addingDomain === "admin" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
                    </Button>
                    {tenant?.domain_admin && (
                      <Button 
                        variant="outline"
                        onClick={() => handleCheckDomain("admin")}
                        disabled={checkingDomain === "admin"}
                      >
                        {checkingDomain === "admin" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                  {domainStatus?.admin?.configured && !domainStatus?.admin?.verified && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <p className="text-sm text-yellow-500 font-medium mb-2">Configure o DNS:</p>
                      <div className="bg-muted rounded p-3 flex items-center justify-between">
                        <code className="text-sm text-foreground">CNAME → cname.vercel-dns.com</code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard("cname.vercel-dns.com")}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {domainStatus?.admin?.verified && (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">DNS configurado e verificado</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Banco de Dados */}
          <TabsContent value="banco">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Banco de Dados</CardTitle>
                <CardDescription>Configure a conexao com seu banco de dados PostgreSQL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-400 mb-2">Como criar um banco gratuito:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse <a href="https://neon.tech" target="_blank" className="text-primary hover:underline">neon.tech</a> e crie uma conta</li>
                    <li>Crie um novo projeto</li>
                    <li>Copie a URL de conexao (Connection String)</li>
                    <li>Cole abaixo e clique em Testar</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="databaseUrl">URL de Conexao (PostgreSQL)</Label>
                  <Input
                    id="databaseUrl"
                    value={databaseUrl}
                    onChange={(e) => setDatabaseUrl(e.target.value)}
                    placeholder="postgres://user:password@host/database"
                    className="bg-muted border-border font-mono text-sm"
                    type="password"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleTestDatabase}
                    disabled={testingDb || !databaseUrl}
                  >
                    {testingDb ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                    Testar Conexao
                  </Button>
                  <Button 
                    onClick={handleSetupDatabase}
                    disabled={settingUpDb || !databaseUrl}
                  >
                    {settingUpDb ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Criar Tabelas
                  </Button>
                </div>

                {tenant?.database_configured && (
                  <div className="flex items-center gap-2 text-green-500 mt-4">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Banco de dados configurado e tabelas criadas</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Visual */}
          <TabsContent value="visual">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Personalizacao Visual</CardTitle>
                <CardDescription>Configure a identidade visual da sua plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo e Mascote */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Logo Principal</Label>
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-muted border-border"
                    />
                    {logoUrl && (
                      <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center p-2">
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Mascote / Icone</Label>
                    <Input
                      value={mascotUrl}
                      onChange={(e) => setMascotUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-muted border-border"
                    />
                    {mascotUrl && (
                      <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center p-2">
                        <img src={mascotUrl} alt="Mascote" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Favicon</Label>
                    <Input
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-muted border-border"
                    />
                    {faviconUrl && (
                      <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center p-2">
                        <img src={faviconUrl} alt="Favicon" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Cores */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cor Primaria</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border border-border"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="bg-muted border-border font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Secundaria</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border border-border"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="bg-muted border-border font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor do Texto</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border border-border"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="bg-muted border-border font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div 
                    className="rounded-lg p-6 border"
                    style={{ backgroundColor: secondaryColor, borderColor: primaryColor }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {logoUrl && <img src={logoUrl} alt="Logo" className="h-8" />}
                      <span style={{ color: textColor }} className="font-bold text-lg">{name || "Sua Plataforma"}</span>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg font-medium"
                      style={{ backgroundColor: primaryColor, color: textColor }}
                    >
                      Botao de Exemplo
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Gateway */}
          <TabsContent value="gateway">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Gateway de Pagamento</CardTitle>
                <CardDescription>Configure como os pagamentos serao processados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Usar Hyperion Pay como Gateway</p>
                    <p className="text-sm text-muted-foreground">Nos processamos os pagamentos e repassamos para voce (taxa de 2%)</p>
                  </div>
                  <Switch
                    checked={useHyperionGateway}
                    onCheckedChange={setUseHyperionGateway}
                  />
                </div>

                {!useHyperionGateway && (
                  <div className="space-y-4 p-4 border border-border rounded-lg">
                    <div className="space-y-2">
                      <Label>Provedor de Pagamento</Label>
                      <select
                        value={gatewayProvider}
                        onChange={(e) => setGatewayProvider(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg p-2 text-foreground"
                      >
                        <option value="">Selecione...</option>
                        <option value="primepag">Primepag</option>
                        <option value="pushinpay">PushinPay</option>
                        <option value="mercadopago">Mercado Pago</option>
                        <option value="pagarme">Pagar.me</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Client ID</Label>
                        <Input
                          value={gatewayClientId}
                          onChange={(e) => setGatewayClientId(e.target.value)}
                          placeholder="Seu Client ID"
                          className="bg-muted border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client Secret</Label>
                        <Input
                          type="password"
                          value={gatewayClientSecret}
                          onChange={(e) => setGatewayClientSecret(e.target.value)}
                          placeholder="Seu Client Secret"
                          className="bg-muted border-border"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botao Salvar */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Salvar Configuracoes
          </Button>
        </div>
      </div>
    </div>
  )
}
