import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Faz uma requisição para um serviço externo que retorna o IP de origem
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    
    // Também tenta outro serviço para confirmar
    const response2 = await fetch("https://httpbin.org/ip");
    const data2 = await response2.json();
    
    return NextResponse.json({
      success: true,
      ip_ipify: data.ip,
      ip_httpbin: data2.origin,
      message: "Use estes IPs na configuração da VenoPag",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 });
  }
}
