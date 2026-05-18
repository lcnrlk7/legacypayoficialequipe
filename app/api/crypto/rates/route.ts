import { NextResponse } from "next/server"
import { SUPPORTED_COINS, getCoinRate } from "@/lib/coinremitter"

// GET - Obter cotacoes atuais
export async function GET() {
  try {
    const rates = await Promise.all(
      SUPPORTED_COINS.map(async (coin) => {
        try {
          const rate = await getCoinRate(coin.id, "BRL")
          return {
            ...coin,
            rate,
            formatted: `R$ ${rate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          }
        } catch {
          return {
            ...coin,
            rate: 0,
            formatted: "Indisponivel",
            error: true,
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      rates,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Crypto] Erro ao obter cotacoes:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao obter cotacoes" },
      { status: 500 }
    )
  }
}
