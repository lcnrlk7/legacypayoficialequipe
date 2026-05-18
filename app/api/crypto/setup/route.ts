import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Tabela de enderecos de deposito crypto
    await sql`
      CREATE TABLE IF NOT EXISTS crypto_addresses (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        coin VARCHAR(10) NOT NULL,
        address TEXT NOT NULL,
        label TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Tabela de depositos crypto
    await sql`
      CREATE TABLE IF NOT EXISTS crypto_deposits (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        coin VARCHAR(10) NOT NULL,
        address TEXT NOT NULL,
        amount_crypto DECIMAL(20, 8),
        amount_brl DECIMAL(10, 2),
        rate DECIMAL(20, 2),
        tx_hash TEXT,
        external_id TEXT,
        confirmations INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        confirmed_at TIMESTAMP
      )
    `

    // Tabela de saques crypto
    await sql`
      CREATE TABLE IF NOT EXISTS crypto_withdrawals (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        coin VARCHAR(10) NOT NULL,
        address TEXT NOT NULL,
        amount_brl DECIMAL(10, 2) NOT NULL,
        amount_crypto DECIMAL(20, 8) NOT NULL,
        fee_brl DECIMAL(10, 2) DEFAULT 0,
        rate DECIMAL(20, 2),
        txid TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `

    // Indices
    await sql`CREATE INDEX IF NOT EXISTS idx_crypto_addresses_user ON crypto_addresses(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user ON crypto_deposits(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_crypto_deposits_address ON crypto_deposits(address)`
    await sql`CREATE INDEX IF NOT EXISTS idx_crypto_withdrawals_user ON crypto_withdrawals(user_id)`

    return NextResponse.json({
      success: true,
      message: "Tabelas crypto criadas com sucesso",
      tables: ["crypto_addresses", "crypto_deposits", "crypto_withdrawals"],
    })
  } catch (error) {
    console.error("[Crypto Setup] Erro:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
