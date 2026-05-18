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
  Zap,
  Mail,
  Phone,
  MessageSquare,
  Smartphone,
  Monitor,
  MousePointer,
  Bell,
  Lock,
  Eye,
  Sparkles
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
  accent_color: string
  success_color: string
  warning_color: string
  error_color: string
  custom_texts: any
  modules_config: any
  ceo_modules_config: any
  features_config: any
  seo_config: any
  email_config: any
  social_config: any
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
  affiliates: { label: "Afiliados", enabled: true },
  telegram: { label: "Bot Telegram", enabled: true },
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
  logs: { label: "Logs do Sistema", enabled: true },
  reports: { label: "Relatorios", enabled: true },
}

const DEFAULT_TEXTS = {
  // Identidade
  site_name: "",
  site_slogan: "",
  site_description: "",
  
  // Pagina de Login
  login_title: "Bem-vindo de volta",
  login_subtitle: "Acesse sua conta para continuar",
  login_button: "Entrar",
  login_forgot_password: "Esqueceu sua senha?",
  login_no_account: "Nao tem uma conta?",
  login_register_link: "Cadastre-se",
  
  // Pagina de Registro
  register_title: "Criar conta",
  register_subtitle: "Comece a receber pagamentos hoje",
  register_button: "Criar minha conta",
  register_has_account: "Ja tem uma conta?",
  register_login_link: "Faca login",
  register_terms_text: "Ao criar sua conta, voce concorda com nossos",
  
  // Dashboard
  dashboard_welcome: "Bem-vindo ao seu painel",
  dashboard_subtitle: "Acompanhe suas transacoes e gerencie seu negocio",
  dashboard_balance_title: "Saldo Disponivel",
  dashboard_pending_title: "Saldo Pendente",
  dashboard_today_title: "Vendas Hoje",
  
  // Carteira
  wallet_title: "Minha Carteira",
  wallet_withdraw_button: "Solicitar Saque",
  wallet_history_title: "Historico de Saques",
  
  // Checkout
  checkout_title: "Pagamento",
  checkout_subtitle: "Finalize sua compra",
  checkout_pix_title: "Pagar com PIX",
  checkout_pix_instruction: "Escaneie o QR Code ou copie o codigo",
  checkout_success_title: "Pagamento Confirmado!",
  checkout_success_message: "Seu pagamento foi processado com sucesso",
  checkout_pending_title: "Aguardando Pagamento",
  checkout_pending_message: "Estamos aguardando a confirmacao do seu pagamento",
  checkout_expired_title: "Pagamento Expirado",
  checkout_expired_message: "O tempo para pagamento expirou. Tente novamente.",
  
  // Suporte
  support_title: "Central de Ajuda",
  support_subtitle: "Como podemos ajudar?",
  support_ticket_button: "Abrir Ticket",
  support_faq_title: "Perguntas Frequentes",
  
  // Footer
  footer_text: "",
  footer_copyright: "Todos os direitos reservados",
  
  // Contato
  support_email: "",
  support_phone: "",
  support_hours: "Seg a Sex, 9h as 18h",
  
  // Mensagens do Sistema
  msg_loading: "Carregando...",
  msg_saving: "Salvando...",
  msg_success: "Operacao realizada com sucesso!",
  msg_error: "Ocorreu um erro. Tente novamente.",
  msg_session_expired: "Sua sessao expirou. Faca login novamente.",
  msg_no_results: "Nenhum resultado encontrado",
  msg_confirm_action: "Tem certeza que deseja continuar?",
  
  // Botoes Gerais
  btn_save: "Salvar",
  btn_cancel: "Cancelar",
  btn_confirm: "Confirmar",
  btn_back: "Voltar",
  btn_next: "Proximo",
  btn_copy: "Copiar",
  btn_copied: "Copiado!",
  btn_view_more: "Ver mais",
  btn_download: "Baixar",
  
  // Redes Sociais e Links
  terms_url: "",
  privacy_url: "",
  whatsapp_number: "",
  telegram_channel: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  tiktok_url: "",
  twitter_url: "",
  linkedin_url: "",
  discord_url: "",
  
  // Emails Transacionais
  email_welcome_subject: "Bem-vindo a {site_name}!",
  email_welcome_body: "Ola {name}, seja bem-vindo! Estamos felizes em ter voce conosco.",
  email_withdraw_subject: "Saque solicitado",
  email_withdraw_body: "Seu saque de R$ {amount} foi solicitado e esta sendo processado.",
  email_payment_subject: "Pagamento recebido",
  email_payment_body: "Voce recebeu um pagamento de R$ {amount}.",
  email_kyc_approved_subject: "Verificacao aprovada",
  email_kyc_rejected_subject: "Verificacao reprovada",
}

const DEFAULT_FEATURES = {
  enable_kyc: { label: "KYC Obrigatorio", enabled: true, description: "Exigir verificacao de identidade" },
  enable_2fa: { label: "Autenticacao 2FA", enabled: false, description: "Permitir 2FA para usuarios" },
  enable_api: { label: "Acesso a API", enabled: true, description: "Permitir integracao via API" },
  enable_webhooks: { label: "Webhooks", enabled: true, description: "Notificacoes em tempo real" },
  enable_affiliates: { label: "Sistema de Afiliados", enabled: false, description: "Programa de indicacao" },
  enable_telegram_bot: { label: "Bot Telegram", enabled: false, description: "Notificacoes via Telegram" },
  enable_pix_in: { label: "PIX Entrada", enabled: true, description: "Receber pagamentos via PIX" },
  enable_pix_out: { label: "PIX Saida", enabled: true, description: "Saques via PIX" },
  enable_boleto: { label: "Boleto", enabled: false, description: "Receber via boleto bancario" },
  enable_credit_card: { label: "Cartao de Credito", enabled: false, description: "Receber via cartao" },
  maintenance_mode: { label: "Modo Manutencao", enabled: false, description: "Desativar acesso temporariamente" },
}

const DEFAULT_SEO = {
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  og_image: "",
  google_analytics: "",
  facebook_pixel: "",
  gtm_id: "",
}

const DEFAULT_EMAIL = {
  smtp_host: "",
  smtp_port: "",
  smtp_user: "",
  smtp_pass: "",
  from_name: "",
  from_email: "",
  welcome_subject: "Bem-vindo a {site_name}",
  withdraw_subject: "Saque solicitado",
  payment_subject: "Pagamento recebido",
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
  const [accentColor, setAccentColor] = useState("#3B82F6")
  const [successColor, setSuccessColor] = useState("#22C55E")
  const [warningColor, setWarningColor] = useState("#F59E0B")
  const [errorColor, setErrorColor] = useState("#EF4444")
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
  const [features, setFeatures] = useState(DEFAULT_FEATURES)
  const [seoConfig, setSeoConfig] = useState(DEFAULT_SEO)
  const [emailConfig, setEmailConfig] = useState(DEFAULT_EMAIL)
  
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
        // Preencher formularios
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
        setAccentColor(data.tenant.accent_color || "#3B82F6")
        setSuccessColor(data.tenant.success_color || "#22C55E")
        setWarningColor(data.tenant.warning_color || "#F59E0B")
        setErrorColor(data.tenant.error_color || "#EF4444")
        setUseHyperionGateway(data.tenant.use_hyperion_gateway !== false)
        setGatewayProvider(data.tenant.gateway_provider || "")
        setGatewayClientId(data.tenant.gateway_client_id || "")
        setGatewayClientSecret(data.tenant.gateway_client_secret || "")
        setTransactionFee(String(data.tenant.transaction_fee || 2.5))
        setWithdrawFee(String(data.tenant.withdraw_fee || 3))
        setMinWithdraw(String(data.tenant.min_withdraw || 10))
        
        // Mesclar modulos mantendo labels
        if (data.tenant.modules_config) {
          const mergedModules = { ...DEFAULT_MODULES }
          const dbConfig = typeof data.tenant.modules_config === 'string' 
            ? JSON.parse(data.tenant.modules_config) 
            : data.tenant.modules_config
          Object.keys(dbConfig).forEach(key => {
            if (mergedModules[key as keyof typeof mergedModules]) {
              mergedModules[key as keyof typeof mergedModules] = {
                ...mergedModules[key as keyof typeof mergedModules],
                enabled: typeof dbConfig[key] === 'boolean' ? dbConfig[key] : dbConfig[key]?.enabled ?? true
              }
            }
          })
          setModules(mergedModules)
        }
        
        if (data.tenant.ceo_modules_config) {
          const mergedCeoModules = { ...DEFAULT_CEO_MODULES }
          const dbCeoConfig = typeof data.tenant.ceo_modules_config === 'string'
            ? JSON.parse(data.tenant.ceo_modules_config)
            : data.tenant.ceo_modules_config
          Object.keys(dbCeoConfig).forEach(key => {
            if (mergedCeoModules[key as keyof typeof mergedCeoModules]) {
              mergedCeoModules[key as keyof typeof mergedCeoModules] = {
                ...mergedCeoModules[key as keyof typeof mergedCeoModules],
                enabled: typeof dbCeoConfig[key] === 'boolean' ? dbCeoConfig[key] : dbCeoConfig[key]?.enabled ?? true
              }
            }
          })
          setCeoModules(mergedCeoModules)
        }
        
        if (data.tenant.custom_texts) {
          const dbTexts = typeof data.tenant.custom_texts === 'string'
            ? JSON.parse(data.tenant.custom_texts)
            : data.tenant.custom_texts
          setCustomTexts({ ...DEFAULT_TEXTS, ...dbTexts })
        }
        
        if (data.tenant.features_config) {
          const mergedFeatures = { ...DEFAULT_FEATURES }
          const dbFeatures = typeof data.tenant.features_config === 'string'
            ? JSON.parse(data.tenant.features_config)
            : data.tenant.features_config
          Object.keys(dbFeatures).forEach(key => {
            if (mergedFeatures[key as keyof typeof mergedFeatures]) {
              mergedFeatures[key as keyof typeof mergedFeatures] = {
                ...mergedFeatures[key as keyof typeof mergedFeatures],
                enabled: typeof dbFeatures[key] === 'boolean' ? dbFeatures[key] : dbFeatures[key]?.enabled ?? true
              }
            }
          })
          setFeatures(mergedFeatures)
        }
        
        if (data.tenant.seo_config) {
          const dbSeo = typeof data.tenant.seo_config === 'string'
            ? JSON.parse(data.tenant.seo_config)
            : data.tenant.seo_config
          setSeoConfig({ ...DEFAULT_SEO, ...dbSeo })
        }
        
        if (data.tenant.email_config) {
          const dbEmail = typeof data.tenant.email_config === 'string'
            ? JSON.parse(data.tenant.email_config)
            : data.tenant.email_config
          setEmailConfig({ ...DEFAULT_EMAIL, ...dbEmail })
        }
        
        // Mudar aba se setup pago
        if (data.tenant.setup_paid) {
          setActiveTab("geral")
        }
      }
    } catch (error) {
      console.error("[White Label] Erro ao carregar:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const acceptContractAndPay = async () => {
    if (!acceptContract) {
      toast.error("Voce precisa aceitar o contrato")
      return
    }
    
    setProcessingPayment(true)
    try {
      const response = await fetch("/api/white-label/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Contrato aceito! Redirecionando para pagamento...")
        if (data.pix_code) {
          toast.info("Copie o codigo PIX para pagar")
        }
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao processar")
      }
    } catch (error) {
      toast.error("Erro ao processar contrato")
    } finally {
      setProcessingPayment(false)
    }
  }

  const saveTenant = async () => {
    setSaving(true)
    try {
      const modulesForDb: Record<string, boolean> = {}
      Object.entries(modules).forEach(([key, value]) => {
        modulesForDb[key] = value.enabled
      })
      
      const ceoModulesForDb: Record<string, boolean> = {}
      Object.entries(ceoModules).forEach(([key, value]) => {
        ceoModulesForDb[key] = value.enabled
      })
      
      const featuresForDb: Record<string, boolean> = {}
      Object.entries(features).forEach(([key, value]) => {
        featuresForDb[key] = value.enabled
      })
      
      const method = tenant ? "PUT" : "POST"
      const response = await fetch("/api/white-label/tenant", {
        method,
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
          accent_color: accentColor,
          success_color: successColor,
          warning_color: warningColor,
          error_color: errorColor,
          use_hyperion_gateway: useHyperionGateway,
          gateway_provider: gatewayProvider || null,
          gateway_client_id: gatewayClientId || null,
          gateway_client_secret: gatewayClientSecret || null,
          transaction_fee: parseFloat(transactionFee) || 2.5,
          withdraw_fee: parseFloat(withdrawFee) || 3,
          min_withdraw: parseFloat(minWithdraw) || 10,
          modules_config: modulesForDb,
          ceo_modules_config: ceoModulesForDb,
          custom_texts: customTexts,
          features_config: featuresForDb,
          seo_config: seoConfig,
          email_config: emailConfig,
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Configuracoes salvas!")
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao salvar")
      }
    } catch (error) {
      toast.error("Erro ao salvar configuracoes")
    } finally {
      setSaving(false)
    }
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
        body: JSON.stringify({ action: "test", database_url: databaseUrl })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Conexao bem sucedida!")
      } else {
        toast.error(data.error || "Erro na conexao")
      }
    } catch (error) {
      toast.error("Erro ao testar conexao")
    } finally {
      setTestingDb(false)
    }
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
        body: JSON.stringify({ action: "setup", database_url: databaseUrl })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Banco de dados configurado!")
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao configurar")
      }
    } catch (error) {
      toast.error("Erro ao configurar banco")
    } finally {
      setSettingUpDb(false)
    }
  }

  const addDomain = async (type: "app" | "admin") => {
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
        body: JSON.stringify({ domain, type })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Dominio adicionado! Configure o DNS: CNAME -> cname.vercel-dns.com")
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao adicionar dominio")
      }
    } catch (error) {
      toast.error("Erro ao adicionar dominio")
    } finally {
      setAddingDomain(null)
    }
  }

  const removeDomain = async (type: "app" | "admin") => {
    const domain = type === "app" ? tenant?.domain_app : tenant?.domain_admin
    if (!domain) return
    
    try {
      const response = await fetch("/api/white-label/domain", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, type })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Dominio removido")
        if (type === "app") setDomainApp("")
        else setDomainAdmin("")
        loadTenant()
      } else {
        toast.error(data.error || "Erro ao remover")
      }
    } catch (error) {
      toast.error("Erro ao remover dominio")
    }
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

  const toggleFeature = (key: string) => {
    setFeatures(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev], enabled: !prev[key as keyof typeof prev].enabled }
    }))
  }

  const updateText = (key: string, value: string) => {
    setCustomTexts(prev => ({ ...prev, [key]: value }))
  }

  const updateSeo = (key: string, value: string) => {
    setSeoConfig(prev => ({ ...prev, [key]: value }))
  }

  const updateEmail = (key: string, value: string) => {
    setEmailConfig(prev => ({ ...prev, [key]: value }))
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
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">White Label</h1>
            <p className="text-muted-foreground">Tenha sua propria plataforma de pagamentos</p>
          </div>
        </div>

        {showSubscription ? (
          // Tela de assinatura
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Plataforma White Label</CardTitle>
              <CardDescription className="text-lg">Sistema completo identico ao Hyperion Pay com sua marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Precos */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-6 text-center">
                  <p className="text-muted-foreground mb-2">Taxa de Setup</p>
                  <p className="text-4xl font-bold text-primary">R$ 350,00</p>
                  <p className="text-sm text-muted-foreground">Pagamento unico</p>
                </div>
                <div className="border rounded-xl p-6 text-center">
                  <p className="text-muted-foreground mb-2">Mensalidade</p>
                  <p className="text-4xl font-bold text-primary">R$ 50,00</p>
                  <p className="text-sm text-muted-foreground">Por mes</p>
                </div>
              </div>

              {/* Beneficios */}
              <div>
                <h3 className="font-semibold mb-4">O que esta incluso:</h3>
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
              <div className="border rounded-xl p-6 bg-muted/20">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-semibold">Contrato de Servico</h3>
                </div>
                <div className="h-40 overflow-y-auto text-sm text-muted-foreground bg-background p-4 rounded-lg border mb-4">
                  <p className="font-semibold mb-2">TERMOS E CONDICOES DE USO - WHITE LABEL HYPERION PAY</p>
                  <p className="mb-2">1. OBJETO</p>
                  <p className="mb-2">O presente contrato tem por objeto a licenca de uso da plataforma White Label Hyperion Pay, permitindo ao CONTRATANTE utilizar o sistema com sua propria marca e identidade visual.</p>
                  <p className="mb-2">2. VALORES E PAGAMENTO</p>
                  <p className="mb-2">2.1. Taxa de Setup: R$ 350,00 (trezentos e cinquenta reais) - pagamento unico.</p>
                  <p className="mb-2">2.2. Mensalidade: R$ 50,00 (cinquenta reais) - pagamento mensal.</p>
                  <p className="mb-2">3. OBRIGACOES DO CONTRATANTE</p>
                  <p className="mb-2">3.1. Manter os pagamentos em dia.</p>
                  <p className="mb-2">3.2. Nao utilizar a plataforma para atividades ilegais.</p>
                  <p className="mb-2">3.3. Respeitar as leis de protecao de dados dos usuarios.</p>
                  <p className="mb-2">4. CANCELAMENTO</p>
                  <p className="mb-2">4.1. O contratante pode cancelar a qualquer momento.</p>
                  <p className="mb-2">4.2. Nao ha reembolso de valores ja pagos.</p>
                  <p className="mb-2">5. SUPORTE</p>
                  <p>5.1. Suporte tecnico disponivel via ticket.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={acceptContract}
                    onCheckedChange={setAcceptContract}
                  />
                  <Label>Li e aceito os termos do contrato</Label>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={acceptContractAndPay}
                disabled={!acceptContract || processingPayment}
              >
                {processingPayment && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Aceitar Contrato e Pagar R$ 350,00
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Painel de configuracoes
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-8 mb-6">
              <TabsTrigger value="geral"><Settings className="w-4 h-4 mr-1" /> Geral</TabsTrigger>
              <TabsTrigger value="visual"><Palette className="w-4 h-4 mr-1" /> Visual</TabsTrigger>
              <TabsTrigger value="textos"><Type className="w-4 h-4 mr-1" /> Textos</TabsTrigger>
              <TabsTrigger value="modulos"><LayoutDashboard className="w-4 h-4 mr-1" /> Modulos</TabsTrigger>
              <TabsTrigger value="features"><Sparkles className="w-4 h-4 mr-1" /> Recursos</TabsTrigger>
              <TabsTrigger value="dominio"><Globe className="w-4 h-4 mr-1" /> Dominio</TabsTrigger>
              <TabsTrigger value="database"><Database className="w-4 h-4 mr-1" /> Banco</TabsTrigger>
              <TabsTrigger value="seo"><Eye className="w-4 h-4 mr-1" /> SEO</TabsTrigger>
            </TabsList>

            {/* Aba Geral */}
            <TabsContent value="geral">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informacoes Basicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nome da Plataforma</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Minha Plataforma Pay"
                      />
                    </div>
                    <div>
                      <Label>Slug (URL amigavel)</Label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="minha-plataforma"
                      />
                    </div>
                    <Button onClick={saveTenant} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Salvar
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status da Assinatura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tenant?.subscription_status === "active" 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {tenant?.subscription_status === "active" ? "Ativo" : "Pendente"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Mensalidade</span>
                      <p className="font-semibold text-foreground">R$ {Number(tenant?.monthly_fee || 50).toFixed(2)}</p>
                    </div>
                    {tenant?.subscription_expires_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Proxima cobranca</span>
                        <span className="text-foreground">{new Date(tenant.subscription_expires_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Taxas da Plataforma</CardTitle>
                    <CardDescription>Configure as taxas cobradas dos seus usuarios</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Taxa por Transacao (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={transactionFee}
                        onChange={(e) => setTransactionFee(e.target.value)}
                        placeholder="2.5"
                      />
                    </div>
                    <div>
                      <Label>Taxa de Saque (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={withdrawFee}
                        onChange={(e) => setWithdrawFee(e.target.value)}
                        placeholder="3.00"
                      />
                    </div>
                    <div>
                      <Label>Saque Minimo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={minWithdraw}
                        onChange={(e) => setMinWithdraw(e.target.value)}
                        placeholder="10.00"
                      />
                    </div>
                    <Button onClick={saveTenant} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Salvar Taxas
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gateway de Pagamento</CardTitle>
                    <CardDescription>Escolha como processar pagamentos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Usar Gateway Hyperion</p>
                        <p className="text-sm text-muted-foreground">Recomendado - mais simples</p>
                      </div>
                      <Switch
                        checked={useHyperionGateway}
                        onCheckedChange={setUseHyperionGateway}
                      />
                    </div>
                    {!useHyperionGateway && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label>Provedor</Label>
                          <Input
                            value={gatewayProvider}
                            onChange={(e) => setGatewayProvider(e.target.value)}
                            placeholder="Ex: mercadopago, pagarme"
                          />
                        </div>
                        <div>
                          <Label>Client ID</Label>
                          <Input
                            value={gatewayClientId}
                            onChange={(e) => setGatewayClientId(e.target.value)}
                            placeholder="Seu Client ID"
                          />
                        </div>
                        <div>
                          <Label>Client Secret</Label>
                          <Input
                            type="password"
                            value={gatewayClientSecret}
                            onChange={(e) => setGatewayClientSecret(e.target.value)}
                            placeholder="Seu Client Secret"
                          />
                        </div>
                      </div>
                    )}
                    <Button onClick={saveTenant} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Salvar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Visual */}
            <TabsContent value="visual">
              <div className="space-y-6">
                {/* Temas Predefinidos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Temas Predefinidos
                    </CardTitle>
                    <CardDescription>Escolha um tema base ou personalize suas cores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button
                        onClick={() => {
                          setPrimaryColor("#FF5500")
                          setSecondaryColor("#1A1A1A")
                          setTextColor("#FFFFFF")
                          setAccentColor("#3B82F6")
                          setSuccessColor("#22C55E")
                          setWarningColor("#F59E0B")
                          setErrorColor("#EF4444")
                        }}
                        className="p-4 rounded-xl border-2 border-transparent hover:border-primary transition-all"
                        style={{ background: "linear-gradient(135deg, #FF5500 0%, #1A1A1A 100%)" }}
                      >
                        <span className="text-white font-semibold text-sm">Hyperion (Padrao)</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrimaryColor("#8B5CF6")
                          setSecondaryColor("#0F0F23")
                          setTextColor("#FFFFFF")
                          setAccentColor("#A78BFA")
                          setSuccessColor("#10B981")
                          setWarningColor("#FBBF24")
                          setErrorColor("#F43F5E")
                        }}
                        className="p-4 rounded-xl border-2 border-transparent hover:border-primary transition-all"
                        style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #0F0F23 100%)" }}
                      >
                        <span className="text-white font-semibold text-sm">Roxo Escuro</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrimaryColor("#06B6D4")
                          setSecondaryColor("#0C1222")
                          setTextColor("#E2E8F0")
                          setAccentColor("#22D3EE")
                          setSuccessColor("#34D399")
                          setWarningColor("#FCD34D")
                          setErrorColor("#FB7185")
                        }}
                        className="p-4 rounded-xl border-2 border-transparent hover:border-primary transition-all"
                        style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0C1222 100%)" }}
                      >
                        <span className="text-white font-semibold text-sm">Ciano Tech</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrimaryColor("#10B981")
                          setSecondaryColor("#111827")
                          setTextColor("#F9FAFB")
                          setAccentColor("#34D399")
                          setSuccessColor("#22C55E")
                          setWarningColor("#F59E0B")
                          setErrorColor("#EF4444")
                        }}
                        className="p-4 rounded-xl border-2 border-transparent hover:border-primary transition-all"
                        style={{ background: "linear-gradient(135deg, #10B981 0%, #111827 100%)" }}
                      >
                        <span className="text-white font-semibold text-sm">Verde Moderno</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrimaryColor("#EC4899")
                          setSecondaryColor("#1F1F1F")
                          setTextColor("#FAFAFA")
                          setAccentColor("#F472B6")
                          setSuccessColor("#4ADE80")
                          setWarningColor("#FDE047")
                          setErrorColor("#F87171")
                        }}
                        className="p-4 rounded-xl border-2 border-transparent hover:border-primary transition-all"
                        style={{ background: "linear-gradient(135deg, #EC4899 0%, #1F1F1F 100%)" }}
                      >
                        <span className="text-white font-semibold text-sm">Rosa Vibrante</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrimaryColor("#F97316")
                          setSecondaryColor("#18181B")
                          setTextColor("#FAFAFA")
                          setAccentColor("#FB923C")
                          setSuccessColor("#4ADE80")
                          setWarningColor("#FACC15")
                          setErrorColor("#F87171")
                        }}
                        className="p-4 rounded-xl border-2 border-transparent hover:border-primary transition-all"
                        style={{ background: "linear-gradient(135deg, #F97316 0%, #18181B 100%)" }}
                      >
                        <span className="text-white font-semibold text-sm">Laranja Energy</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrimaryColor("#3B82F6")
                          setSecondaryColor("#FFFFFF")
                          setTextColor("#1F2937")
                          setAccentColor("#60A5FA")
                          setSuccessColor("#22C55E")
                          setWarningColor("#F59E0B")
                          setErrorColor("#EF4444")
                        }}
                        className="p-4 rounded-xl border-2 border-transparent hover:border-primary transition-all"
                        style={{ background: "linear-gradient(135deg, #3B82F6 0%, #FFFFFF 100%)" }}
                      >
                        <span className="text-gray-800 font-semibold text-sm">Azul Claro</span>
                      </button>
                      <button
                        onClick={() => {
                          setPrimaryColor("#FBBF24")
                          setSecondaryColor("#0A0A0A")
                          setTextColor("#FAFAFA")
                          setAccentColor("#FCD34D")
                          setSuccessColor("#4ADE80")
                          setWarningColor("#FB923C")
                          setErrorColor("#F87171")
                        }}
                        className="p-4 rounded-xl border-2 border-transparent hover:border-primary transition-all"
                        style={{ background: "linear-gradient(135deg, #FBBF24 0%, #0A0A0A 100%)" }}
                      >
                        <span className="text-white font-semibold text-sm">Dourado Premium</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Imagens */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Imagens e Logos
                    </CardTitle>
                    <CardDescription>Configure as imagens da sua plataforma</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Logo Principal (URL)</Label>
                        <Input
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        {logoUrl && (
                          <img src={logoUrl} alt="Logo" className="mt-2 h-12 object-contain rounded" />
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
                          <img src={mascotUrl} alt="Mascote" className="mt-2 h-12 object-contain rounded" />
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
                          <img src={faviconUrl} alt="Favicon" className="mt-2 h-8 object-contain rounded" />
                        )}
                      </div>
                      <div>
                        <Label>Badge/Selo (URL)</Label>
                        <Input
                          value={badgeUrl}
                          onChange={(e) => setBadgeUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        {badgeUrl && (
                          <img src={badgeUrl} alt="Badge" className="mt-2 h-12 object-contain rounded" />
                        )}
                      </div>
                      <div>
                        <Label>Banner Principal (URL)</Label>
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
                        <Label>Fundo do Login (URL)</Label>
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
                  </CardContent>
                </Card>

                {/* Cores Personalizadas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      Cores Personalizadas
                    </CardTitle>
                    <CardDescription>Ajuste as cores manualmente ou use um tema acima</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Cor Primaria</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cor de Fundo</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cor do Texto</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cor de Destaque</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cor de Sucesso</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={successColor}
                            onChange={(e) => setSuccessColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={successColor}
                            onChange={(e) => setSuccessColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cor de Aviso</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={warningColor}
                            onChange={(e) => setWarningColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={warningColor}
                            onChange={(e) => setWarningColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cor de Erro</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={errorColor}
                            onChange={(e) => setErrorColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={errorColor}
                            onChange={(e) => setErrorColor(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Completo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      Preview ao Vivo
                    </CardTitle>
                    <CardDescription>Visualize como sua plataforma vai ficar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="rounded-xl overflow-hidden border"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {/* Header Preview */}
                      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: `${textColor}20` }}>
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-8" />
                          ) : (
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: primaryColor }} />
                          )}
                          <span style={{ color: textColor }} className="font-bold text-lg">
                            {name || customTexts.site_name || "Sua Plataforma"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: successColor }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: warningColor }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: errorColor }} />
                        </div>
                      </div>
                      
                      {/* Content Preview */}
                      <div className="p-6">
                        <h3 style={{ color: textColor }} className="text-xl font-bold mb-2">
                          {customTexts.dashboard_welcome || "Bem-vindo ao seu painel"}
                        </h3>
                        <p style={{ color: `${textColor}80` }} className="mb-4">
                          {customTexts.site_slogan || "Sua plataforma de pagamentos"}
                        </p>
                        
                        {/* Cards Preview */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
                            <p style={{ color: `${textColor}80` }} className="text-sm">Saldo</p>
                            <p style={{ color: primaryColor }} className="text-2xl font-bold">R$ 1.250,00</p>
                          </div>
                          <div className="p-4 rounded-lg" style={{ backgroundColor: `${successColor}20` }}>
                            <p style={{ color: `${textColor}80` }} className="text-sm">Entradas</p>
                            <p style={{ color: successColor }} className="text-2xl font-bold">R$ 3.420,00</p>
                          </div>
                          <div className="p-4 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                            <p style={{ color: `${textColor}80` }} className="text-sm">Pendente</p>
                            <p style={{ color: accentColor }} className="text-2xl font-bold">R$ 890,00</p>
                          </div>
                        </div>
                        
                        {/* Buttons Preview */}
                        <div className="flex gap-2 flex-wrap">
                          <button style={{ backgroundColor: primaryColor, color: "#fff" }} className="px-4 py-2 rounded-lg font-semibold">
                            {customTexts.btn_save || "Salvar"}
                          </button>
                          <button style={{ backgroundColor: accentColor, color: "#fff" }} className="px-4 py-2 rounded-lg font-semibold">
                            {customTexts.btn_confirm || "Confirmar"}
                          </button>
                          <button style={{ backgroundColor: successColor, color: "#fff" }} className="px-4 py-2 rounded-lg font-semibold">
                            Sucesso
                          </button>
                          <button style={{ backgroundColor: warningColor, color: "#000" }} className="px-4 py-2 rounded-lg font-semibold">
                            Aviso
                          </button>
                          <button style={{ backgroundColor: errorColor, color: "#fff" }} className="px-4 py-2 rounded-lg font-semibold">
                            Erro
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={saveTenant} disabled={saving} className="w-full">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Salvar Configuracoes Visuais
                </Button>
              </div>
            </TabsContent>

            {/* Aba Textos */}
            <TabsContent value="textos">
              <div className="space-y-6">
                {/* Identidade */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Identidade da Marca
                    </CardTitle>
                    <CardDescription>Nome, slogan e descricao da sua plataforma</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Plataforma</Label>
                      <Input
                        value={customTexts.site_name}
                        onChange={(e) => updateText("site_name", e.target.value)}
                        placeholder="Minha Plataforma Pay"
                      />
                    </div>
                    <div>
                      <Label>Slogan</Label>
                      <Input
                        value={customTexts.site_slogan}
                        onChange={(e) => updateText("site_slogan", e.target.value)}
                        placeholder="Pagamentos simples e rapidos"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Descricao do Site</Label>
                      <Textarea
                        value={customTexts.site_description}
                        onChange={(e) => updateText("site_description", e.target.value)}
                        placeholder="A melhor plataforma de pagamentos do Brasil. Receba via PIX de forma rapida e segura."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pagina de Login */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" />
                      Pagina de Login
                    </CardTitle>
                    <CardDescription>Textos exibidos na tela de login</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Titulo</Label>
                      <Input
                        value={customTexts.login_title}
                        onChange={(e) => updateText("login_title", e.target.value)}
                        placeholder="Bem-vindo de volta"
                      />
                    </div>
                    <div>
                      <Label>Subtitulo</Label>
                      <Input
                        value={customTexts.login_subtitle}
                        onChange={(e) => updateText("login_subtitle", e.target.value)}
                        placeholder="Acesse sua conta para continuar"
                      />
                    </div>
                    <div>
                      <Label>Botao de Login</Label>
                      <Input
                        value={customTexts.login_button}
                        onChange={(e) => updateText("login_button", e.target.value)}
                        placeholder="Entrar"
                      />
                    </div>
                    <div>
                      <Label>Esqueci a Senha</Label>
                      <Input
                        value={customTexts.login_forgot_password}
                        onChange={(e) => updateText("login_forgot_password", e.target.value)}
                        placeholder="Esqueceu sua senha?"
                      />
                    </div>
                    <div>
                      <Label>Nao tem conta?</Label>
                      <Input
                        value={customTexts.login_no_account}
                        onChange={(e) => updateText("login_no_account", e.target.value)}
                        placeholder="Nao tem uma conta?"
                      />
                    </div>
                    <div>
                      <Label>Link Cadastro</Label>
                      <Input
                        value={customTexts.login_register_link}
                        onChange={(e) => updateText("login_register_link", e.target.value)}
                        placeholder="Cadastre-se"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pagina de Registro */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Pagina de Cadastro
                    </CardTitle>
                    <CardDescription>Textos exibidos na tela de registro</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Titulo</Label>
                      <Input
                        value={customTexts.register_title}
                        onChange={(e) => updateText("register_title", e.target.value)}
                        placeholder="Criar conta"
                      />
                    </div>
                    <div>
                      <Label>Subtitulo</Label>
                      <Input
                        value={customTexts.register_subtitle}
                        onChange={(e) => updateText("register_subtitle", e.target.value)}
                        placeholder="Comece a receber pagamentos hoje"
                      />
                    </div>
                    <div>
                      <Label>Botao de Cadastro</Label>
                      <Input
                        value={customTexts.register_button}
                        onChange={(e) => updateText("register_button", e.target.value)}
                        placeholder="Criar minha conta"
                      />
                    </div>
                    <div>
                      <Label>Ja tem conta?</Label>
                      <Input
                        value={customTexts.register_has_account}
                        onChange={(e) => updateText("register_has_account", e.target.value)}
                        placeholder="Ja tem uma conta?"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Texto de Termos</Label>
                      <Input
                        value={customTexts.register_terms_text}
                        onChange={(e) => updateText("register_terms_text", e.target.value)}
                        placeholder="Ao criar sua conta, voce concorda com nossos"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Dashboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      Dashboard e Painel
                    </CardTitle>
                    <CardDescription>Textos exibidos no painel do usuario</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Mensagem de Boas-vindas</Label>
                      <Input
                        value={customTexts.dashboard_welcome}
                        onChange={(e) => updateText("dashboard_welcome", e.target.value)}
                        placeholder="Bem-vindo ao seu painel"
                      />
                    </div>
                    <div>
                      <Label>Subtitulo do Dashboard</Label>
                      <Input
                        value={customTexts.dashboard_subtitle}
                        onChange={(e) => updateText("dashboard_subtitle", e.target.value)}
                        placeholder="Acompanhe suas transacoes"
                      />
                    </div>
                    <div>
                      <Label>Titulo Saldo Disponivel</Label>
                      <Input
                        value={customTexts.dashboard_balance_title}
                        onChange={(e) => updateText("dashboard_balance_title", e.target.value)}
                        placeholder="Saldo Disponivel"
                      />
                    </div>
                    <div>
                      <Label>Titulo Saldo Pendente</Label>
                      <Input
                        value={customTexts.dashboard_pending_title}
                        onChange={(e) => updateText("dashboard_pending_title", e.target.value)}
                        placeholder="Saldo Pendente"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Checkout */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Checkout e Pagamento
                    </CardTitle>
                    <CardDescription>Textos exibidos nas telas de pagamento</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Titulo do Checkout</Label>
                      <Input
                        value={customTexts.checkout_title}
                        onChange={(e) => updateText("checkout_title", e.target.value)}
                        placeholder="Pagamento"
                      />
                    </div>
                    <div>
                      <Label>Subtitulo</Label>
                      <Input
                        value={customTexts.checkout_subtitle}
                        onChange={(e) => updateText("checkout_subtitle", e.target.value)}
                        placeholder="Finalize sua compra"
                      />
                    </div>
                    <div>
                      <Label>Titulo PIX</Label>
                      <Input
                        value={customTexts.checkout_pix_title}
                        onChange={(e) => updateText("checkout_pix_title", e.target.value)}
                        placeholder="Pagar com PIX"
                      />
                    </div>
                    <div>
                      <Label>Instrucao PIX</Label>
                      <Input
                        value={customTexts.checkout_pix_instruction}
                        onChange={(e) => updateText("checkout_pix_instruction", e.target.value)}
                        placeholder="Escaneie o QR Code ou copie o codigo"
                      />
                    </div>
                    <div>
                      <Label>Titulo Sucesso</Label>
                      <Input
                        value={customTexts.checkout_success_title}
                        onChange={(e) => updateText("checkout_success_title", e.target.value)}
                        placeholder="Pagamento Confirmado!"
                      />
                    </div>
                    <div>
                      <Label>Mensagem Sucesso</Label>
                      <Input
                        value={customTexts.checkout_success_message}
                        onChange={(e) => updateText("checkout_success_message", e.target.value)}
                        placeholder="Seu pagamento foi processado"
                      />
                    </div>
                    <div>
                      <Label>Titulo Pendente</Label>
                      <Input
                        value={customTexts.checkout_pending_title}
                        onChange={(e) => updateText("checkout_pending_title", e.target.value)}
                        placeholder="Aguardando Pagamento"
                      />
                    </div>
                    <div>
                      <Label>Mensagem Pendente</Label>
                      <Input
                        value={customTexts.checkout_pending_message}
                        onChange={(e) => updateText("checkout_pending_message", e.target.value)}
                        placeholder="Aguardando confirmacao"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Botoes e Mensagens */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Botoes e Mensagens do Sistema
                    </CardTitle>
                    <CardDescription>Textos de botoes e mensagens gerais</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Salvar</Label>
                      <Input
                        value={customTexts.btn_save}
                        onChange={(e) => updateText("btn_save", e.target.value)}
                        placeholder="Salvar"
                      />
                    </div>
                    <div>
                      <Label>Cancelar</Label>
                      <Input
                        value={customTexts.btn_cancel}
                        onChange={(e) => updateText("btn_cancel", e.target.value)}
                        placeholder="Cancelar"
                      />
                    </div>
                    <div>
                      <Label>Confirmar</Label>
                      <Input
                        value={customTexts.btn_confirm}
                        onChange={(e) => updateText("btn_confirm", e.target.value)}
                        placeholder="Confirmar"
                      />
                    </div>
                    <div>
                      <Label>Voltar</Label>
                      <Input
                        value={customTexts.btn_back}
                        onChange={(e) => updateText("btn_back", e.target.value)}
                        placeholder="Voltar"
                      />
                    </div>
                    <div>
                      <Label>Proximo</Label>
                      <Input
                        value={customTexts.btn_next}
                        onChange={(e) => updateText("btn_next", e.target.value)}
                        placeholder="Proximo"
                      />
                    </div>
                    <div>
                      <Label>Copiar</Label>
                      <Input
                        value={customTexts.btn_copy}
                        onChange={(e) => updateText("btn_copy", e.target.value)}
                        placeholder="Copiar"
                      />
                    </div>
                    <div className="md:col-span-3 border-t pt-4 mt-2">
                      <Label className="text-muted-foreground">Mensagens do Sistema</Label>
                    </div>
                    <div>
                      <Label>Carregando</Label>
                      <Input
                        value={customTexts.msg_loading}
                        onChange={(e) => updateText("msg_loading", e.target.value)}
                        placeholder="Carregando..."
                      />
                    </div>
                    <div>
                      <Label>Sucesso</Label>
                      <Input
                        value={customTexts.msg_success}
                        onChange={(e) => updateText("msg_success", e.target.value)}
                        placeholder="Operacao realizada com sucesso!"
                      />
                    </div>
                    <div>
                      <Label>Erro</Label>
                      <Input
                        value={customTexts.msg_error}
                        onChange={(e) => updateText("msg_error", e.target.value)}
                        placeholder="Ocorreu um erro. Tente novamente."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contatos e Redes Sociais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      Contatos e Redes Sociais
                    </CardTitle>
                    <CardDescription>Informacoes de contato e links de redes sociais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Email de Suporte</Label>
                        <Input
                          value={customTexts.support_email}
                          onChange={(e) => updateText("support_email", e.target.value)}
                          placeholder="suporte@minhaplatforma.com"
                        />
                      </div>
                      <div>
                        <Label>Telefone de Suporte</Label>
                        <Input
                          value={customTexts.support_phone}
                          onChange={(e) => updateText("support_phone", e.target.value)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <Label>Horario de Atendimento</Label>
                        <Input
                          value={customTexts.support_hours}
                          onChange={(e) => updateText("support_hours", e.target.value)}
                          placeholder="Seg a Sex, 9h as 18h"
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <Label className="text-muted-foreground mb-3 block">Redes Sociais</Label>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>WhatsApp</Label>
                          <Input
                            value={customTexts.whatsapp_number}
                            onChange={(e) => updateText("whatsapp_number", e.target.value)}
                            placeholder="5511999999999"
                          />
                        </div>
                        <div>
                          <Label>Canal Telegram</Label>
                          <Input
                            value={customTexts.telegram_channel}
                            onChange={(e) => updateText("telegram_channel", e.target.value)}
                            placeholder="@meucanal"
                          />
                        </div>
                        <div>
                          <Label>Instagram</Label>
                          <Input
                            value={customTexts.instagram_url}
                            onChange={(e) => updateText("instagram_url", e.target.value)}
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div>
                          <Label>Facebook</Label>
                          <Input
                            value={customTexts.facebook_url}
                            onChange={(e) => updateText("facebook_url", e.target.value)}
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div>
                          <Label>YouTube</Label>
                          <Input
                            value={customTexts.youtube_url}
                            onChange={(e) => updateText("youtube_url", e.target.value)}
                            placeholder="https://youtube.com/..."
                          />
                        </div>
                        <div>
                          <Label>TikTok</Label>
                          <Input
                            value={customTexts.tiktok_url}
                            onChange={(e) => updateText("tiktok_url", e.target.value)}
                            placeholder="https://tiktok.com/..."
                          />
                        </div>
                        <div>
                          <Label>Twitter / X</Label>
                          <Input
                            value={customTexts.twitter_url}
                            onChange={(e) => updateText("twitter_url", e.target.value)}
                            placeholder="https://x.com/..."
                          />
                        </div>
                        <div>
                          <Label>LinkedIn</Label>
                          <Input
                            value={customTexts.linkedin_url}
                            onChange={(e) => updateText("linkedin_url", e.target.value)}
                            placeholder="https://linkedin.com/..."
                          />
                        </div>
                        <div>
                          <Label>Discord</Label>
                          <Input
                            value={customTexts.discord_url}
                            onChange={(e) => updateText("discord_url", e.target.value)}
                            placeholder="https://discord.gg/..."
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Paginas Legais e Rodape */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Paginas Legais e Rodape
                    </CardTitle>
                    <CardDescription>Links para termos e texto do rodape</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>URL Termos de Uso</Label>
                      <Input
                        value={customTexts.terms_url}
                        onChange={(e) => updateText("terms_url", e.target.value)}
                        placeholder="https://minhaplatforma.com/termos"
                      />
                    </div>
                    <div>
                      <Label>URL Politica de Privacidade</Label>
                      <Input
                        value={customTexts.privacy_url}
                        onChange={(e) => updateText("privacy_url", e.target.value)}
                        placeholder="https://minhaplatforma.com/privacidade"
                      />
                    </div>
                    <div>
                      <Label>Texto do Rodape</Label>
                      <Input
                        value={customTexts.footer_text}
                        onChange={(e) => updateText("footer_text", e.target.value)}
                        placeholder="Sua plataforma de pagamentos confiavel"
                      />
                    </div>
                    <div>
                      <Label>Copyright</Label>
                      <Input
                        value={customTexts.footer_copyright}
                        onChange={(e) => updateText("footer_copyright", e.target.value)}
                        placeholder="Todos os direitos reservados"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={saveTenant} disabled={saving} className="w-full">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Salvar Todas as Configuracoes de Texto
                </Button>
              </div>
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

            {/* Aba Recursos/Features */}
            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle>Recursos da Plataforma</CardTitle>
                  <CardDescription>Ative ou desative funcionalidades especificas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(features).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium text-foreground">{value.label}</p>
                          <p className="text-sm text-muted-foreground">{value.description}</p>
                        </div>
                        <Switch
                          checked={value.enabled}
                          onCheckedChange={() => toggleFeature(key)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button onClick={saveTenant} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Salvar Configuracoes
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                            placeholder="app.seudominio.com"
                          />
                          <Button
                            onClick={() => addDomain("app")}
                            disabled={addingDomain === "app"}
                          >
                            {addingDomain === "app" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
                          </Button>
                        </div>
                        {tenant?.domain_app && (
                          <div className="mt-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-500">Dominio configurado</span>
                            <Button variant="ghost" size="sm" onClick={() => removeDomain("app")}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Dominio do Admin (CEO)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={domainAdmin}
                            onChange={(e) => setDomainAdmin(e.target.value)}
                            placeholder="admin.seudominio.com"
                          />
                          <Button
                            onClick={() => addDomain("admin")}
                            disabled={addingDomain === "admin"}
                          >
                            {addingDomain === "admin" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
                          </Button>
                        </div>
                        {tenant?.domain_admin && (
                          <div className="mt-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-500">Dominio configurado</span>
                            <Button variant="ghost" size="sm" onClick={() => removeDomain("admin")}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/20 border">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        Como configurar o DNS
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-2">
                        <li>1. Acesse o painel do seu provedor de dominio</li>
                        <li>2. Adicione um registro CNAME:</li>
                        <li className="ml-4 font-mono bg-background p-2 rounded">
                          Tipo: CNAME<br />
                          Nome: app (ou admin)<br />
                          Valor: cname.vercel-dns.com
                        </li>
                        <li>3. Aguarde a propagacao (ate 48h)</li>
                        <li>4. O SSL sera gerado automaticamente</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Banco de Dados */}
            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <CardTitle>Banco de Dados</CardTitle>
                  <CardDescription>Configure o banco de dados da sua plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-semibold mb-2 text-blue-400">Como criar seu banco de dados</h4>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      <li>1. Acesse <a href="https://neon.tech" target="_blank" className="text-blue-400 underline">neon.tech</a> e crie uma conta gratuita</li>
                      <li>2. Crie um novo projeto</li>
                      <li>3. Copie a Connection String (URL do banco)</li>
                      <li>4. Cole abaixo e clique em Testar Conexao</li>
                    </ol>
                  </div>

                  <div>
                    <Label>URL do Banco de Dados (PostgreSQL)</Label>
                    <Input
                      value={databaseUrl}
                      onChange={(e) => setDatabaseUrl(e.target.value)}
                      placeholder="postgresql://user:pass@host/database"
                      type="password"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={testDatabase} disabled={testingDb} variant="outline">
                      {testingDb && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Testar Conexao
                    </Button>
                    <Button onClick={setupDatabase} disabled={settingUpDb}>
                      {settingUpDb && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Criar Tabelas
                    </Button>
                  </div>

                  {tenant?.database_configured && (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Banco de dados configurado!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba SEO */}
            <TabsContent value="seo">
              <Card>
                <CardHeader>
                  <CardTitle>SEO e Analytics</CardTitle>
                  <CardDescription>Configure otimizacao para buscadores e rastreamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Meta Title</Label>
                      <Input
                        value={seoConfig.meta_title}
                        onChange={(e) => updateSeo("meta_title", e.target.value)}
                        placeholder="Minha Plataforma - Pagamentos Online"
                      />
                    </div>
                    <div>
                      <Label>Meta Description</Label>
                      <Input
                        value={seoConfig.meta_description}
                        onChange={(e) => updateSeo("meta_description", e.target.value)}
                        placeholder="A melhor plataforma para receber pagamentos..."
                      />
                    </div>
                    <div>
                      <Label>Meta Keywords</Label>
                      <Input
                        value={seoConfig.meta_keywords}
                        onChange={(e) => updateSeo("meta_keywords", e.target.value)}
                        placeholder="pagamentos, pix, checkout"
                      />
                    </div>
                    <div>
                      <Label>OG Image (URL)</Label>
                      <Input
                        value={seoConfig.og_image}
                        onChange={(e) => updateSeo("og_image", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Analytics e Tracking</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Google Analytics ID</Label>
                        <Input
                          value={seoConfig.google_analytics}
                          onChange={(e) => updateSeo("google_analytics", e.target.value)}
                          placeholder="G-XXXXXXXXXX"
                        />
                      </div>
                      <div>
                        <Label>Facebook Pixel ID</Label>
                        <Input
                          value={seoConfig.facebook_pixel}
                          onChange={(e) => updateSeo("facebook_pixel", e.target.value)}
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <Label>Google Tag Manager ID</Label>
                        <Input
                          value={seoConfig.gtm_id}
                          onChange={(e) => updateSeo("gtm_id", e.target.value)}
                          placeholder="GTM-XXXXXXX"
                        />
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
          </Tabs>
        )}
      </div>
    </div>
  )
}
