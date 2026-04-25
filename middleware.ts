import { handleAuth } from '@/lib/middleware-auth'
import { type NextRequest, NextResponse } from 'next/server'

// Lista de dominios principais do sistema (nao sao checkouts)
const MAIN_DOMAINS = [
  'localhost',
  'legacypay.site',
  'legacypay.com.br',
  'vercel.app',
]

// Dominio dedicado para todos os checkouts
const CHECKOUT_DOMAIN = 'pay-checkout-pagamentoseguros.online'

function isMainDomain(hostname: string): boolean {
  return MAIN_DOMAINS.some(domain => 
    hostname === domain || 
    hostname.endsWith(`.${domain}`) ||
    hostname.includes('localhost')
  )
}

function isCheckoutDomain(hostname: string): boolean {
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  return cleanHostname === CHECKOUT_DOMAIN || cleanHostname === `www.${CHECKOUT_DOMAIN}`
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
  // Se for dominio principal, segue fluxo normal de auth
  if (isMainDomain(hostname)) {
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
