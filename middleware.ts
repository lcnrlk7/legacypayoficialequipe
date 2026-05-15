import { handleAuth } from '@/lib/middleware-auth'
import { type NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Cache de IPs bloqueados (atualiza a cada 60 segundos)
let blockedIpsCache: Set<string> = new Set()
let lastCacheUpdate = 0
const CACHE_TTL = 60000 // 60 segundos

async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false
  
  // Verifica cache primeiro
  const now = Date.now()
  if (now - lastCacheUpdate < CACHE_TTL && blockedIpsCache.size > 0) {
    return blockedIpsCache.has(ip)
  }
  
  // Atualiza cache - só tenta se DATABASE_URL estiver disponível
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    // Em Edge Runtime, a variável pode não estar disponível
    // Retorna cache existente ou false
    return blockedIpsCache.has(ip)
  }
  
  try {
    const sql = neon(databaseUrl)
    const blockedIps = await sql`SELECT ip_address FROM blocked_ips`
    blockedIpsCache = new Set(blockedIps.map((row: { ip_address: string }) => row.ip_address))
    lastCacheUpdate = now
    return blockedIpsCache.has(ip)
  } catch (error) {
    // Silencia erro em produção, apenas loga se for erro diferente de conexão
    if (error instanceof Error && !error.message.includes('database connection')) {
      console.error('[Middleware] Erro ao verificar IP bloqueado:', error)
    }
    return blockedIpsCache.has(ip)
  }
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') ||
         'unknown'
}

// Lista de dominios principais do sistema (nao sao checkouts)
const MAIN_DOMAINS = [
  'localhost',
  'hyperionpay.site',
  'hyperionpay.com.br',
  'vercel.app',
]

// Dominio dedicado para todos os checkouts
const CHECKOUT_DOMAIN = 'pay-checkout-pagamentoseguros.online'

// Dominio do app (dashboard de usuario)
const APP_DOMAIN = 'app.hyperionpay.site'

// Dominio do painel CEO/Admin
const CEO_DOMAIN = 'ceo.hyperionpay.site'

function isMainDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  
  // Exclui dominios especificos (app e ceo) da verificacao de dominio principal
  if (cleanHostname === APP_DOMAIN || cleanHostname === CEO_DOMAIN) {
    return false
  }
  
  return MAIN_DOMAINS.some(domain => 
    cleanHostname === domain || 
    cleanHostname === `www.${domain}` ||
    cleanHostname.endsWith(`.${domain}`) ||
    cleanHostname.includes('localhost')
  )
}

function isAppDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  return cleanHostname === APP_DOMAIN || cleanHostname === `www.${APP_DOMAIN}`
}

function isCeoDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  return cleanHostname === CEO_DOMAIN || cleanHostname === `www.${CEO_DOMAIN}`
}

function isCheckoutDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  return cleanHostname === CHECKOUT_DOMAIN || cleanHostname === `www.${CHECKOUT_DOMAIN}`
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
  // Ignorar a pagina de bloqueado para evitar loop
  if (pathname === '/blocked') {
    const response = NextResponse.next()
    // Adicionar headers de seguranca
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    return response
  }
  
  // Ignorar webhooks do Telegram e PIX do bot (nao precisa de auth)
  if (pathname.startsWith('/api/telegram') || pathname.startsWith('/api/webhooks/telegram-pix')) {
    return NextResponse.next()
  }
  
  // Verificar se IP esta bloqueado
  const clientIp = getClientIp(request)
  const blocked = await isIpBlocked(clientIp)
  
  if (blocked) {
    const url = request.nextUrl.clone()
    url.pathname = '/blocked'
    return NextResponse.rewrite(url)
  }
  
  // Se for dominio principal (www.hyperionpay.site) - APENAS landing page
  if (isMainDomain(hostname)) {
    // Ignora arquivos estaticos e API
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.') // arquivos com extensao
    ) {
      return await handleAuth(request)
    }
    
    // Redireciona rotas de auth para app.hyperionpay.site
    if (pathname.startsWith('/auth/')) {
      const url = new URL(`https://app.hyperionpay.site${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(url)
    }
    
    // Redireciona dashboard para app.hyperionpay.site
    if (pathname.startsWith('/dashboard')) {
      const url = new URL(`https://app.hyperionpay.site${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(url)
    }
    
    // Redireciona painel admin para ceo.hyperionpay.site
    if (pathname.startsWith('/lp-x7k9m2-internal')) {
      const url = new URL(`https://ceo.hyperionpay.site${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(url)
    }
    
    // Outras rotas da landing page seguem normalmente
    return await handleAuth(request)
  }
  
  // Se for dominio do CEO (ceo.hyperionpay.site) - painel admin exclusivo
  if (isCeoDomain(hostname)) {
    // Ignora arquivos estaticos
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.') // arquivos com extensao
    ) {
      return await handleAuth(request)
    }
    
    // Se acessar a raiz, redireciona para login da equipe ou painel CEO
    if (pathname === '/' || pathname === '') {
      const teamUser = request.cookies.get('team_session')?.value
      
      if (teamUser) {
        // Se tem sessao de equipe, vai para o painel CEO
        const url = request.nextUrl.clone()
        url.pathname = '/lp-x7k9m2-internal/ceo'
        return NextResponse.redirect(url)
      } else {
        // Se nao tem sessao, vai para login da equipe
        const url = request.nextUrl.clone()
        url.pathname = '/lp-x7k9m2-internal/team-login'
        return NextResponse.redirect(url)
      }
    }
    
    // Para outras rotas no CEO domain, segue fluxo normal de auth
    return await handleAuth(request)
  }
  
  // Se for dominio do app (app.hyperionpay.site) - dashboard de usuario
  if (isAppDomain(hostname)) {
    // Ignora arquivos estaticos
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.') // arquivos com extensao
    ) {
      return await handleAuth(request)
    }
    
    // Se acessar a raiz do app, redireciona para login ou dashboard
    if (pathname === '/' || pathname === '') {
      const user = request.cookies.get('auth-token')?.value
      
      if (user) {
        // Se tem sessao de usuario, vai para dashboard
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      } else {
        // Se nao tem sessao, vai para login
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }
    }
    
    // Para outras rotas no app domain, segue fluxo normal de auth
    return await handleAuth(request)
  }
  
  // Se for dominio de checkout (pay-checkout-pagamentoseguros.online)
  if (isCheckoutDomain(hostname)) {
    // Ignora arquivos estaticos e API
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.') // arquivos com extensao
    ) {
      return NextResponse.next()
    }
    
    // Se acessar a raiz, mostra pagina inicial do checkout
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/checkout-home'
      return NextResponse.rewrite(url)
    }
    
    // Pega o slug do path (ex: /meu-produto -> meu-produto)
    const slug = pathname.replace(/^\//, '').split('/')[0]
    
    if (slug) {
      // Reescreve para /pay/[slug]
      const url = request.nextUrl.clone()
      url.pathname = `/pay/${slug}`
      return NextResponse.rewrite(url)
    }
    
    return NextResponse.next()
  }
  
  // Outro dominio desconhecido - segue fluxo normal
  return await handleAuth(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
