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
  RefreshCw,
  FileText,
  LayoutDashboard,
  Image as ImageIcon,
  Type,
  Shield,
  Clock,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  badge_url: string | null
  banner_url: string | null
  login_bg_url: string | null
  primary_color: string
  secondary_color: string
  text_color: string
  custom_texts: any
  modules_config: any
  ceo_modules_config: any
  use_hyperion_gateway: boolean
  gateway_provider: string | null
  gateway_client_id: string | null
  gateway_client_secret: string | null
  transaction_fee: number
  withdraw_fee: number
  min_withdraw: number
  is_active: boolean
  database_configured: boolean
  setup_fee: number
  monthly_fee: number
  setup_paid: boolean
  subscription_status: string
  subscription_expires_at: string | null
  contract_accepted: boolean
  contract_accepted_at: string | null
}

const DEFAULT_MODULES = {
  dashboard: { label: "Dashboard", enabled: true },
  wallet: { label: "Carteira", enabled: true },
  transactions: { label: "Transacoes", enabled: true },
  checkout: { label: "Checkout", enabled: true },
  products: { label: "Produtos", enabled: true },
  clients: { label: "Clientes", enabled: true },
  api: { label: "Integracao API", enabled: true },
  settings: { label: "Configuracoes", enabled: true },
  support: { label: "Suporte", enabled: true },
  reports: { label: "Relatorios", enabled: true },
}

const DEFAULT_CEO_MODULES = {
  dashboard: { label: "Dashboard", enabled: true },
  users: { label: "Usuarios", enabled: true },
  transactions: { label: "Transacoes", enabled: true },
  withdrawals: { label: "Saques", enabled: true },
  kyc: { label: "KYC / Verificacao", enabled: true },
  fees: { label: "Taxas", enabled: true },
  support: { label: "Suporte", enabled: true },
  settings: { label: "Configuracoes", enabled: true },
}

const DEFAULT_TEXTS = {
  site_name: "",
  site_description: "",
  login_title: "Bem-vindo de volta",
  login_subtitle: "Acesse sua conta",
  register_title: "Criar conta",
  register_subtitle: "Comece a receber pagamentos",
  dashboard_welcome: "Bem-vindo ao seu painel",
  footer_text: "",
}

export default function WhiteLabelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activeTab, setActiveTab] = useState("assinatura")
  const [acceptContract, setAcceptContract] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // Form states
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [domainApp, setDomainApp] = useState("")
  const [domainAdmin, setDomainAdmin] = useState("")
  const [databaseUrl, setDatabaseUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [mascotUrl, setMascotUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")
  const [badgeUrl, setBadgeUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [loginBgUrl, setLoginBgUrl] = useState("")
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
  const [modules, setModules] = useState(DEFAULT_MODULES)
  const [ceoModules, setCeoModules] = useState(DEFAULT_CEO_MODULES)
  const [customTexts, setCustomTexts] = useState(DEFAULT_TEXTS)
  
  // Action states
  const [testingDb, setTestingDb] = useState(false)
  const [settingUpDb, setSettingUpDb] = useState(false)
  const [addingDomain, setAddingDomain] = useState<"app" | "admin" | null>(null)

  useEffect(() => {
    loadTenant()
  }, [])

  const loadTenant = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/white-label/tenant")
      const data = await response.json()
      
      if (data.success && data.tenant) {
        setTenant(data.tenant)
        setName(data.tenant.name || "")
        setSlug(data.tenant.slug || "")
        setDomainApp(data.tenant.domain_app || "")
        setDomainAdmin(data.tenant.domain_admin || "")
        setDatabaseUrl(data.tenant.database_url || "")
        setLogoUrl(data.tenant.logo_url || "")
        setMascotUrl(data.tenant.mascot_url || "")
        setFaviconUrl(data.tenant.favicon_url || "")
        setBadgeUrl(data.tenant.badge_url || "")
        setBannerUrl(data.tenant.banner_url || "")
        setLoginBgUrl(data.tenant.login_bg_url || "")
        setPrimaryColor(data.tenant.primary_color || "#FF5500")
        setSecondaryColor(data.tenant.secondary_color || "#1A1A1A")
        setTextColor(data.tenant.text_color || "#FFFFFF")
        setUseHyperionGateway(data.tenant.use_hyperion_gateway ?? true)
        setGatewayProvider(data.tenant.gateway_provider || "")
        setGatewayClientId(data.tenant.gateway_client_id || "")
        setGatewayClientSecret(data.tenant.gateway_client_secret || "")
        setTransactionFee(String(data.tenant.transaction_fee || 2.5))
        setWithdrawFee(String(data.tenant.withdraw_fee || 3))
        setMinWithdraw(String(data.tenant.min_withdraw || 10))
        
        if (data.tenant.modules_config) {
          setModules({ ...DEFAULT_MODULES, ...data.tenant.modules_config })
        }
        if (data.tenant.ceo_modules_config) {
          setCeoModules({ ...DEFAULT_CEO_MODULES, ...data.tenant.ceo_modules_config })
        }
        if (data.tenant.custom_texts) {
          setCustomTexts({ ...DEFAULT_TEXTS, ...data.tenant.custom_texts })
        }
        
        // Se ja pagou setup, ir para config
        if (data.tenant.setup_paid) {
          setActiveTab("geral")
        }
      }
    } catch (error) {
      console.error("Erro ao carregar tenant:", error)
    }
    setLoading(false)
  }

  const handleAcceptContract = async () => {
    if (!acceptContract) {
      toast.error("Voce precisa aceitar o contrato para continuar")
      return
    }
    
    setProcessingPayment(true)
    try {
      const response = await fetch("/api/white-label/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Contrato aceito! Gerando pagamento...")
        // Redirecionar para pagamento ou mostrar QR Code
        if (data.paymentUrl) {
          window.open(data.paymentUrl, "_blank")
        }
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao aceitar contrato")
      }
    } catch (error) {
      toast.error("Erro ao processar")
    }
    setProcessingPayment(false)
  }

  const handlePaySetup = async () => {
    setProcessingPayment(true)
    try {
      const response = await fetch("/api/white-label/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "setup" }),
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Pagamento gerado!")
        if (data.pixCode) {
          navigator.clipboard.writeText(data.pixCode)
          toast.success("Codigo PIX copiado!")
        }
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao gerar pagamento")
      }
    } catch (error) {
      toast.error("Erro ao processar")
    }
    setProcessingPayment(false)
  }

  const saveTenant = async () => {
    if (!name || !slug) {
      toast.error("Nome e slug sao obrigatorios")
      return
    }
    
    setSaving(true)
    try {
      const modulesConfig: any = {}
      Object.entries(modules).forEach(([key, value]) => {
        modulesConfig[key] = value.enabled
      })
      
      const ceoModulesConfig: any = {}
      Object.entries(ceoModules).forEach(([key, value]) => {
        ceoModulesConfig[key] = value.enabled
      })
      
      const response = await fetch("/api/white-label/tenant", {
        method: tenant ? "PUT" : "POST",
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
          badge_url: badgeUrl || null,
          banner_url: bannerUrl || null,
          login_bg_url: loginBgUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          text_color: textColor,
          use_hyperion_gateway: useHyperionGateway,
          gateway_provider: useHyperionGateway ? null : gatewayProvider,
          gateway_client_id: useHyperionGateway ? null : gatewayClientId,
          gateway_client_secret: useHyperionGateway ? null : gatewayClientSecret,
          transaction_fee: parseFloat(transactionFee),
          withdraw_fee: parseFloat(withdrawFee),
          min_withdraw: parseFloat(minWithdraw),
          modules_config: modulesConfig,
          ceo_modules_config: ceoModulesConfig,
          custom_texts: customTexts,
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Configuracoes salvas!")
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao salvar")
      }
    } catch (error) {
      toast.error("Erro ao salvar")
    }
    setSaving(false)
  }

  const testDatabase = async () => {
    if (!databaseUrl) {
      toast.error("Informe a URL do banco de dados")
      return
    }
    
    setTestingDb(true)
    try {
      const response = await fetch("/api/white-label/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", database_url: databaseUrl }),
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

  const setupDatabase = async () => {
    if (!databaseUrl) {
      toast.error("Informe a URL do banco de dados")
      return
    }
    
    setSettingUpDb(true)
    try {
      const response = await fetch("/api/white-label/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", database_url: databaseUrl }),
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

  const addDomain = async (type: "app" | "admin") => {
    const domain = type === "app" ? domainApp : domainAdmin
    if (!domain) {
      toast.error("Informe o dominio primeiro")
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
      } else {
        toast.error(data.error || "Falha ao adicionar dominio")
      }
    } catch (error) {
      toast.error("Erro ao adicionar dominio")
    }
    setAddingDomain(null)
  }

  const toggleModule = (key: string) => {
    setModules(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev], enabled: !prev[key as keyof typeof prev].enabled }
    }))
  }

  const toggleCeoModule = (key: string) => {
    setCeoModules(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev], enabled: !prev[key as keyof typeof prev].enabled }
    }))
  }

  const updateText = (key: string, value: string) => {
    setCustomTexts(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Se nao tem tenant ou nao pagou setup, mostrar tela de assinatura
  const showSubscription = !tenant || !tenant.setup_paid

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">White Label</h1>
            <p className="text-muted-foreground">Tenha sua propria plataforma de pagamentos</p>
          </div>
        </div>

        {showSubscription ? (
          // Tela de Assinatura/Contrato
          <div className="space-y-6">
            {/* Precos */}
            <Card className="border-primary">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Plataforma White Label</CardTitle>
                <CardDescription>Sistema completo identico ao Hyperion Pay com sua marca</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-muted rounded-xl p-6 text-center">
                    <p className="text-muted-foreground mb-2">Taxa de Setup</p>
                    <p className="text-4xl font-bold text-primary">R$ 350,00</p>
                    <p className="text-sm text-muted-foreground mt-2">Pagamento unico</p>
                  </div>
                  <div className="bg-muted rounded-xl p-6 text-center">
                    <p className="text-muted-foreground mb-2">Mensalidade</p>
                    <p className="text-4xl font-bold text-primary">R$ 50,00</p>
                    <p className="text-sm text-muted-foreground mt-2">Por mes</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-lg">O que esta incluso:</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      "Painel de Usuario completo",
                      "Painel de CEO/Admin completo",
                      "Dominio personalizado",
                      "Logo e cores personalizadas",
                      "Banco de dados separado",
                      "Sistema de checkout",
                      "API completa",
                      "Webhooks",
                      "Sistema de saques",
                      "Relatorios",
                      "Suporte",
                      "Atualizacoes automaticas",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contrato */}
                <div className="border border-border rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Contrato de Servico
                  </h3>
                  <div className="bg-muted rounded-lg p-4 h-48 overflow-y-auto text-sm text-muted-foreground mb-4">
                    <p className="mb-4"><strong>TERMOS E CONDICOES DE USO - WHITE LABEL HYPERION PAY</strong></p>
                    
                    <p className="mb-2"><strong>1. OBJETO</strong></p>
                    <p className="mb-4">O presente contrato tem por objeto a licenca de uso da plataforma White Label Hyperion Pay, permitindo ao CONTRATANTE utilizar o sistema com sua propria marca e identidade visual.</p>
                    
                    <p className="mb-2"><strong>2. VALORES E PAGAMENTO</strong></p>
                    <p className="mb-4">2.1. Taxa de Setup: R$ 350,00 (trezentos e cinquenta reais) - pagamento unico.<br/>2.2. Mensalidade: R$ 50,00 (cinquenta reais) - pagamento mensal.<br/>2.3. O nao pagamento da mensalidade acarretara na suspensao imediata do servico.</p>
                    
                    <p className="mb-2"><strong>3. RESPONSABILIDADES DO CONTRATANTE</strong></p>
                    <p className="mb-4">3.1. Manter os pagamentos em dia.<br/>3.2. Configurar corretamente os dominios e DNS.<br/>3.3. Gerenciar seus usuarios e transacoes.<br/>3.4. Cumprir todas as leis aplicaveis.</p>
                    
                    <p className="mb-2"><strong>4. RESPONSABILIDADES DO HYPERION PAY</strong></p>
                    <p className="mb-4">4.1. Manter a plataforma funcionando 24/7.<br/>4.2. Prover suporte tecnico.<br/>4.3. Realizar atualizacoes e melhorias.<br/>4.4. Garantir seguranca dos dados.</p>
                    
                    <p className="mb-2"><strong>5. CANCELAMENTO</strong></p>
                    <p className="mb-4">5.1. O CONTRATANTE pode cancelar a qualquer momento.<br/>5.2. Nao ha reembolso de valores ja pagos.<br/>5.3. Apos cancelamento, o sistema sera desativado em 24 horas.</p>
                    
                    <p className="mb-2"><strong>6. DISPOSICOES GERAIS</strong></p>
                    <p>Este contrato e regido pelas leis brasileiras. Fica eleito o foro da comarca de Sao Paulo para dirimir quaisquer controversias.</p>
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptContract}
                      onChange={(e) => setAcceptContract(e.target.checked)}
                      className="w-5 h-5 rounded border-border"
                    />
                    <span className="text-foreground">Li e aceito os termos e condicoes do contrato</span>
                  </label>
                </div>

                <Button 
                  onClick={handlePaySetup}
                  disabled={!acceptContract || processingPayment}
                  className="w-full h-14 text-lg"
                >
                  {processingPayment ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Zap className="w-5 h-5 mr-2" />
                  )}
                  Contratar por R$ 350,00
                </Button>

                {tenant && !tenant.setup_paid && tenant.contract_accepted && (
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-yellow-500 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">Aguardando Pagamento</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seu contrato foi aceito. Realize o pagamento de R$ 350,00 para ativar sua plataforma.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Tela de Configuracao (apos pagar)
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-7 mb-6">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="textos">Textos</TabsTrigger>
              <TabsTrigger value="modulos">Modulos</TabsTrigger>
              <TabsTrigger value="dominio">Dominios</TabsTrigger>
              <TabsTrigger value="banco">Banco</TabsTrigger>
              <TabsTrigger value="gateway">Gateway</TabsTrigger>
            </TabsList>

            {/* Aba Geral */}
            <TabsContent value="geral">
              <Card>
                <CardHeader>
                  <CardTitle>Informacoes Gerais</CardTitle>
                  <CardDescription>Configure o nome e identificacao da sua plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Plataforma</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Minha Plataforma Pay"
                      />
                    </div>
                    <div>
                      <Label>Slug (identificador unico)</Label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="minha-plataforma"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Taxa por Transacao (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={transactionFee}
                        onChange={(e) => setTransactionFee(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Taxa de Saque (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={withdrawFee}
                        onChange={(e) => setWithdrawFee(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Saque Minimo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={minWithdraw}
                        onChange={(e) => setMinWithdraw(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Status da Assinatura */}
                  <div className="bg-muted rounded-xl p-4">
                    <h3 className="font-semibold mb-3">Status da Assinatura</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className={`font-semibold ${tenant.subscription_status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                          {tenant.subscription_status === 'active' ? 'Ativo' : 'Pendente'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mensalidade</p>
                        <p className="font-semibold text-foreground">R$ {Number(tenant.monthly_fee || 50).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Proxima Cobranca</p>
                        <p className="font-semibold text-foreground">
                          {tenant.subscription_expires_at 
                            ? new Date(tenant.subscription_expires_at).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={saveTenant} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Salvar Configuracoes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Visual */}
            <TabsContent value="visual">
              <Card>
                <CardHeader>
                  <CardTitle>Personalizacao Visual</CardTitle>
                  <CardDescription>Configure logo, cores e imagens da sua plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cores */}
                  <div>
                    <h3 className="font-semibold mb-4">Cores</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Cor Primaria</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cor Secundaria</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cor do Texto</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Imagens */}
                  <div>
                    <h3 className="font-semibold mb-4">Imagens</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Logo (URL)</Label>
                        <Input
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        {logoUrl && (
                          <img src={logoUrl} alt="Logo" className="mt-2 h-12 object-contain" />
                        )}
                      </div>
                      <div>
                        <Label>Mascote (URL)</Label>
                        <Input
                          value={mascotUrl}
                          onChange={(e) => setMascotUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        {mascotUrl && (
                          <img src={mascotUrl} alt="Mascote" className="mt-2 h-12 object-contain" />
                        )}
                      </div>
                      <div>
                        <Label>Favicon (URL)</Label>
                        <Input
                          value={faviconUrl}
                          onChange={(e) => setFaviconUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        {faviconUrl && (
                          <img src={faviconUrl} alt="Favicon" className="mt-2 h-8 object-contain" />
                        )}
                      </div>
                      <div>
                        <Label>Placa/Badge (URL)</Label>
                        <Input
                          value={badgeUrl}
                          onChange={(e) => setBadgeUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        {badgeUrl && (
                          <img src={badgeUrl} alt="Badge" className="mt-2 h-12 object-contain" />
                        )}
                      </div>
                      <div>
                        <Label>Banner (URL)</Label>
                        <Input
                          value={bannerUrl}
                          onChange={(e) => setBannerUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        {bannerUrl && (
                          <img src={bannerUrl} alt="Banner" className="mt-2 h-20 object-cover rounded" />
                        )}
                      </div>
                      <div>
                        <Label>Fundo da Tela de Login (URL)</Label>
                        <Input
                          value={loginBgUrl}
                          onChange={(e) => setLoginBgUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        {loginBgUrl && (
                          <img src={loginBgUrl} alt="Login BG" className="mt-2 h-20 object-cover rounded" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <h3 className="font-semibold mb-4">Preview</h3>
                    <div 
                      className="rounded-xl p-6"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        {logoUrl && <img src={logoUrl} alt="Logo" className="h-8" />}
                        <span style={{ color: textColor }} className="font-bold text-xl">{name || "Sua Plataforma"}</span>
                      </div>
                      <button
                        style={{ backgroundColor: primaryColor, color: textColor }}
                        className="px-4 py-2 rounded-lg font-semibold"
                      >
                        Botao de Exemplo
                      </button>
                    </div>
                  </div>

                  <Button onClick={saveTenant} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Salvar Configuracoes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Textos */}
            <TabsContent value="textos">
              <Card>
                <CardHeader>
                  <CardTitle>Textos Personalizados</CardTitle>
                  <CardDescription>Altere os textos que aparecem na sua plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Site</Label>
                      <Input
                        value={customTexts.site_name}
                        onChange={(e) => updateText("site_name", e.target.value)}
                        placeholder="Minha Plataforma Pay"
                      />
                    </div>
                    <div>
                      <Label>Descricao do Site</Label>
                      <Input
                        value={customTexts.site_description}
                        onChange={(e) => updateText("site_description", e.target.value)}
                        placeholder="A melhor plataforma de pagamentos"
                      />
                    </div>
                    <div>
                      <Label>Titulo da Tela de Login</Label>
                      <Input
                        value={customTexts.login_title}
                        onChange={(e) => updateText("login_title", e.target.value)}
                        placeholder="Bem-vindo de volta"
                      />
                    </div>
                    <div>
                      <Label>Subtitulo da Tela de Login</Label>
                      <Input
                        value={customTexts.login_subtitle}
                        onChange={(e) => updateText("login_subtitle", e.target.value)}
                        placeholder="Acesse sua conta"
                      />
                    </div>
                    <div>
                      <Label>Titulo da Tela de Cadastro</Label>
                      <Input
                        value={customTexts.register_title}
                        onChange={(e) => updateText("register_title", e.target.value)}
                        placeholder="Criar conta"
                      />
                    </div>
                    <div>
                      <Label>Subtitulo da Tela de Cadastro</Label>
                      <Input
                        value={customTexts.register_subtitle}
                        onChange={(e) => updateText("register_subtitle", e.target.value)}
                        placeholder="Comece a receber pagamentos"
                      />
                    </div>
                    <div>
                      <Label>Mensagem de Boas-vindas no Dashboard</Label>
                      <Input
                        value={customTexts.dashboard_welcome}
                        onChange={(e) => updateText("dashboard_welcome", e.target.value)}
                        placeholder="Bem-vindo ao seu painel"
                      />
                    </div>
                    <div>
                      <Label>Texto do Rodape</Label>
                      <Input
                        value={customTexts.footer_text}
                        onChange={(e) => updateText("footer_text", e.target.value)}
                        placeholder="2024 Minha Plataforma. Todos os direitos reservados."
                      />
                    </div>
                  </div>

                  <Button onClick={saveTenant} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Salvar Configuracoes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Modulos */}
            <TabsContent value="modulos">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Modulos do Usuario</CardTitle>
                    <CardDescription>Selecione o que aparece no painel dos usuarios</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(modules).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-foreground">{value.label}</span>
                        <Switch
                          checked={value.enabled}
                          onCheckedChange={() => toggleModule(key)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Modulos do CEO/Admin</CardTitle>
                    <CardDescription>Selecione o que aparece no painel admin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(ceoModules).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-foreground">{value.label}</span>
                        <Switch
                          checked={value.enabled}
                          onCheckedChange={() => toggleCeoModule(key)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Button onClick={saveTenant} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Salvar Configuracoes
                </Button>
              </div>
            </TabsContent>

            {/* Aba Dominios */}
            <TabsContent value="dominio">
              <Card>
                <CardHeader>
                  <CardTitle>Dominios Personalizados</CardTitle>
                  <CardDescription>Configure os dominios da sua plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Dominio do App (usuarios)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={domainApp}
                            onChange={(e) => setDomainApp(e.target.value)}
                            placeholder="app.seusite.com.br"
                          />
                          <Button
                            onClick={() => addDomain("app")}
                            disabled={addingDomain === "app" || !domainApp}
                          >
                            {addingDomain === "app" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Adicionar"
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Dominio do Admin (CEO)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={domainAdmin}
                            onChange={(e) => setDomainAdmin(e.target.value)}
                            placeholder="admin.seusite.com.br"
                          />
                          <Button
                            onClick={() => addDomain("admin")}
                            disabled={addingDomain === "admin" || !domainAdmin}
                          >
                            {addingDomain === "admin" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Adicionar"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted rounded-xl p-4">
                      <h4 className="font-semibold mb-3">Configuracao de DNS</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure o DNS no seu provedor de dominio:
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="bg-background rounded p-3">
                          <p className="text-muted-foreground">Tipo: CNAME</p>
                          <p className="text-muted-foreground">Nome: app (ou admin)</p>
                          <p className="text-foreground font-mono">Valor: cname.vercel-dns.com</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={saveTenant} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Salvar Configuracoes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Banco de Dados */}
            <TabsContent value="banco">
              <Card>
                <CardHeader>
                  <CardTitle>Banco de Dados</CardTitle>
                  <CardDescription>Configure o banco de dados da sua plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-blue-400 mb-2">Como criar seu banco de dados gratuito</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Acesse <a href="https://neon.tech" target="_blank" className="text-primary underline">neon.tech</a></li>
                      <li>Crie uma conta gratuita</li>
                      <li>Crie um novo projeto</li>
                      <li>Copie a Connection String (URL do banco)</li>
                      <li>Cole aqui abaixo</li>
                    </ol>
                  </div>

                  <div>
                    <Label>URL do Banco de Dados (PostgreSQL)</Label>
                    <Input
                      value={databaseUrl}
                      onChange={(e) => setDatabaseUrl(e.target.value)}
                      placeholder="postgres://user:pass@host/database"
                      type="password"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={testDatabase}
                      disabled={testingDb || !databaseUrl}
                    >
                      {testingDb ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Testar Conexao
                    </Button>

                    <Button
                      onClick={setupDatabase}
                      disabled={settingUpDb || !databaseUrl}
                    >
                      {settingUpDb ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      Criar Tabelas
                    </Button>
                  </div>

                  {tenant?.database_configured && (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Banco de dados configurado</span>
                    </div>
                  )}

                  <Button onClick={saveTenant} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Salvar Configuracoes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Gateway */}
            <TabsContent value="gateway">
              <Card>
                <CardHeader>
                  <CardTitle>Gateway de Pagamento</CardTitle>
                  <CardDescription>Configure como os pagamentos serao processados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div
                      onClick={() => setUseHyperionGateway(true)}
                      className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                        useHyperionGateway ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          useHyperionGateway ? "border-primary" : "border-muted-foreground"
                        }`}>
                          {useHyperionGateway && <div className="w-3 h-3 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Usar Hyperion Pay como Gateway</p>
                          <p className="text-sm text-muted-foreground">
                            Nos processamos os pagamentos e repassamos para voce. Taxa extra de 2% por transacao.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setUseHyperionGateway(false)}
                      className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                        !useHyperionGateway ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          !useHyperionGateway ? "border-primary" : "border-muted-foreground"
                        }`}>
                          {!useHyperionGateway && <div className="w-3 h-3 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Usar Minha Propria Adquirente</p>
                          <p className="text-sm text-muted-foreground">
                            Configure suas proprias credenciais de gateway. Sem taxa extra.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!useHyperionGateway && (
                    <div className="space-y-4 border-t border-border pt-4">
                      <div>
                        <Label>Provedor</Label>
                        <select
                          value={gatewayProvider}
                          onChange={(e) => setGatewayProvider(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="">Selecione...</option>
                          <option value="primepag">Primepag</option>
                          <option value="pushinpay">PushinPay</option>
                          <option value="mercadopago">Mercado Pago</option>
                          <option value="pagarme">Pagar.me</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <Label>Client ID</Label>
                        <Input
                          value={gatewayClientId}
                          onChange={(e) => setGatewayClientId(e.target.value)}
                          placeholder="ci_xxxxxxx"
                        />
                      </div>
                      <div>
                        <Label>Client Secret</Label>
                        <Input
                          type="password"
                          value={gatewayClientSecret}
                          onChange={(e) => setGatewayClientSecret(e.target.value)}
                          placeholder="cs_xxxxxxx"
                        />
                      </div>
                    </div>
                  )}

                  <Button onClick={saveTenant} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Salvar Configuracoes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
