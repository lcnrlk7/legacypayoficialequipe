/**
 * Script para adicionar a adquirente Venopag ao banco de dados
 * 
 * Venopag - Rota White
 * Taxa real: 1% deposito, 1% saque
 * Margem LegacyPay: 2% deposito (total 3%), 3% saque (total 4%)
 * 
 * Executar com: npx tsx scripts/add-venopag-acquirer.ts
 */

import { sql } from "@/lib/db";

async function addVenopagAcquirer() {
  console.log("[Venopag] Adicionando adquirente ao banco de dados...");

  try {
    // Verificar se ja existe
    const existing = await sql`
      SELECT id FROM acquirers WHERE code = 'venopag'
    `;

    if (existing.length > 0) {
      console.log("[Venopag] Adquirente ja existe, atualizando...");
      
      await sql`
        UPDATE acquirers SET
          name = 'Venopag',
          api_url = 'https://venopag.com',
          api_key = 'np_56f1e77f0183e5f933312005',
          api_secret = 'npsec_238d95c8e8b5463b229652f7468bc138b91f0b82644211fd',
          is_active = true,
          fee_percentage = 3.0,
          withdrawal_fee = 4.0,
          min_deposit = 1.00,
          min_withdrawal = 10.00,
          route_type = 'white',
          updated_at = NOW()
        WHERE code = 'venopag'
      `;
      
      console.log("[Venopag] Adquirente atualizada com sucesso!");
    } else {
      // Buscar proxima prioridade
      const maxPriority = await sql`
        SELECT COALESCE(MAX(priority), 0) as max_priority FROM acquirers
      `;
      const nextPriority = (maxPriority[0]?.max_priority || 0) + 1;

      await sql`
        INSERT INTO acquirers (
          name,
          code,
          api_url,
          api_key,
          api_secret,
          is_active,
          priority,
          fee_percentage,
          withdrawal_fee,
          min_deposit,
          min_withdrawal,
          route_type,
          health_status,
          created_at,
          updated_at
        ) VALUES (
          'Venopag',
          'venopag',
          'https://venopag.com',
          'np_56f1e77f0183e5f933312005',
          'npsec_238d95c8e8b5463b229652f7468bc138b91f0b82644211fd',
          true,
          ${nextPriority},
          3.0,
          4.0,
          1.00,
          10.00,
          'white',
          'online',
          NOW(),
          NOW()
        )
      `;
      
      console.log("[Venopag] Adquirente criada com sucesso!");
    }

    // Listar todas as adquirentes
    const acquirers = await sql`
      SELECT name, code, route_type, fee_percentage, withdrawal_fee, is_active
      FROM acquirers
      ORDER BY priority ASC
    `;

    console.log("\n[Adquirentes] Lista atual:");
    console.table(acquirers);

    console.log("\n[Venopag] Configuracao completa!");
    console.log("Taxa deposito: 3% (1% Venopag + 2% margem)");
    console.log("Taxa saque: 4% (1% Venopag + 3% margem)");

  } catch (error) {
    console.error("[Venopag] Erro ao adicionar adquirente:", error);
    throw error;
  }
}

// Executar
addVenopagAcquirer()
  .then(() => {
    console.log("\n[Script] Concluido com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Script] Falhou:", error);
    process.exit(1);
  });
