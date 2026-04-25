import { handleAuth } from '@/lib/middleware-auth'
import { type NextRequest, NextResponse } from 'next/server'

// Lista de dominios principais do sistema (nao sao checkouts)
const MAIN_DOMAINS = [
  'localhost',
  'legacypay.site',
  'legacypay.com.br',
  'vercel.app',
]

function isMainDomain(hostname: string): boolean {
  return MAIN_DOMAINS.some(domain => 
    hostname === domain || 
    hostname.endsWith(`.${domain}`) ||
    hostname.includes('localhost')
  )
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
  // Se for dominio principal, segue fluxo normal
  if (isMainDomain(hostname)) {
    return await handleAuth(request)
  }
  
  // Se for dominio de checkout personalizado
  // Reescreve para /pay/[domain] 
  // onde [domain] e o hostname sem www
  const cleanHostname = hostname.replace(/^www\./, '').split(':')[0]
  
  // Se ja esta em /pay/, nao reescreve novamente
  if (pathname.startsWith('/pay/')) {
    return await handleAuth(request)
  }
  
  // Ignora arquivos estaticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // arquivos com extensao
  ) {
    return NextResponse.next()
  }
  
  // Reescreve a URL para a pagina de checkout do dominio
  const url = request.nextUrl.clone()
  url.pathname = `/checkout-domain/${cleanHostname}${pathname}`
  
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
