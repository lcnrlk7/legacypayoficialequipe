import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MisticPay } from "@/lib/acquirers/misticpay";

// Mapeamento de status da Medusa para status interno
const MEDUSA_STATUS_MAP: Record<string, string> = {
  // Status de sucesso
  approved: "completed",
  paid: "completed",
  completed: "completed",
  finalizado: "completed",
  
  // Status de falha
  refused: "failed",
  cancelled: "failed",
  failed: "failed",
  cancelado: "failed",
  
  // Status pendente
  pending: "processing",
  processing: "processing",
  waiting_payment: "processing",
};

interface MedusaWithdrawal {
  id: number;
  status: string;
  amount?: number | string;
  pixKey?: string;
  created?: string;
  createdAt?: string;
}

interface MedusaListResponse {
  withdrawals?: MedusaWithdrawal[];
  transfers?: MedusaWithdrawal[];
  data?: MedusaWithdrawal[];
  total?: number;
  [key: string]: unknown;
}

export async function GET(request: Request) {
  const dbSql = sql;
  
  try {
    // Verificar autorização
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const { searchParams } = new URL(request.url);
    const isInternal = searchParams.get("internal") === "true";

    if (!isInternal && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Sync Withdrawals] Iniciando sincronização de saques...");

    // Buscar saques em processamento com acquirer_withdrawal_id
    const pendingWithdrawals = await sql`
      SELECT id, user_id, amount, net_amount, pix_key, acquirer_withdrawal_id, status, created_at
      FROM withdrawals
      WHERE status = 'processing'
        AND acquirer_withdrawal_id IS NOT NULL
        AND acquirer_withdrawal_id != ''
      ORDER BY created_at DESC
      LIMIT 50
    `;

    if (pendingWithdrawals.length === 0) {
      console.log("[Sync Withdrawals] Nenhum saque pendente para sincronizar");
      return NextResponse.json({ success: true, message: "Nenhum saque pendente", synced: 0 });
    }

    console.log(`[Sync Withdrawals] ${pendingWithdrawals.length} saques pendentes encontrados`);

    // Buscar configuração da Medusa (inclui medusa e medusa_white)
    const acquirers = await sql`
      SELECT code, api_key, api_secret FROM acquirers WHERE code IN ('medusa', 'medusa_white') AND is_active = true
    `;

    if (acquirers.length === 0) {
      console.log("[Sync Withdrawals] Nenhuma Medusa configurada");
      return NextResponse.json({ error: "Medusa não configurada" }, { status: 500 });
    }

    // Usar a primeira Medusa para listagem (todas usam a mesma API)
    const secretKey = acquirers[0].api_key;
    
    // Tentar listar transferências da Medusa
    // Endpoint: GET /v1/all/withdrawals ou /v1/all/transfers
    const authString = Buffer.from(`x:${secretKey}`).toString("base64");
    
    let medusaWithdrawals: MedusaWithdrawal[] = [];
    
    // Tentar diferentes endpoints
    const endpoints = [
      "/v1/all/withdrawals",
      "/v1/all/transfers", 
      "/v1/withdrawals",
      "/v1/transfers"
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`https://api.medusapayments.com${endpoint}?page=1&pageSize=100`, {
          method: "GET",
          headers: {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const data: MedusaListResponse = await response.json();
          console.log(`[Sync Withdrawals] Endpoint ${endpoint} retornou:`, JSON.stringify(data).substring(0, 200));
          
          medusaWithdrawals = data.withdrawals || data.transfers || data.data || 
            (Array.isArray(data) ? data : []);
          
          if (medusaWithdrawals.length > 0) {
            console.log(`[Sync Withdrawals] ${medusaWithdrawals.length} transferências encontradas na Medusa`);
            break;
          }
        } else {
          console.log(`[Sync Withdrawals] Endpoint ${endpoint} retornou ${response.status}`);
        }
      } catch (error) {
        console.log(`[Sync Withdrawals] Erro ao tentar ${endpoint}:`, error);
      }
    }

    let syncedCount = 0;
    const results: Array<{ id: string; medusaId: string; oldStatus: string; newStatus: string }> = [];

    // Se não conseguiu listar, aguardar webhook da Medusa
    if (medusaWithdrawals.length === 0) {
      console.log("[Sync Withdrawals] Não conseguiu listar transferências da Medusa, aguardando webhook...");
      console.log(`[Sync Withdrawals] ${pendingWithdrawals.length} saques pendentes aguardando confirmação`);
    } else {
      // Criar mapa por ID
      const medusaMap = new Map<string, MedusaWithdrawal>();
      for (const w of medusaWithdrawals) {
        if (w.id) {
          medusaMap.set(String(w.id), w);
        }
      }

      for (const withdrawal of pendingWithdrawals) {
        const medusaW = medusaMap.get(withdrawal.acquirer_withdrawal_id);
        
        if (!medusaW) continue;

        const medusaStatus = (medusaW.status || "").toLowerCase();
        const internalStatus = MEDUSA_STATUS_MAP[medusaStatus] || "processing";

        if (internalStatus === withdrawal.status) continue;

        console.log(`[Sync Withdrawals] Saque ${withdrawal.id}: Medusa=${medusaStatus}, interno=${internalStatus}`);

        // Atualizar status
        await sql`
          UPDATE withdrawals 
          SET status = ${internalStatus}, processed_at = NOW()
          WHERE id = ${withdrawal.id}
        `;

        if (internalStatus === "completed") {
          await sql`
            INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
            VALUES (
              ${crypto.randomUUID()},
              ${withdrawal.user_id},
              'Saque Concluído!',
              ${`Seu saque de R$ ${Number(withdrawal.net_amount).toFixed(2)} foi enviado para sua chave PIX.`},
              'success',
              NOW()
            )
          `;
        } else if (internalStatus === "failed") {
          // Devolver saldo
          await sql`
            UPDATE profiles SET balance = balance + ${Number(withdrawal.amount)}
            WHERE id = ${withdrawal.user_id}
          `;
          
          await sql`
            INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
            VALUES (
              ${crypto.randomUUID()},
              ${withdrawal.user_id},
              'Saque Falhou',
              ${`Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} falhou. O valor foi devolvido ao seu saldo.`},
              'error',
              NOW()
            )
          `;
        }

        results.push({
          id: withdrawal.id,
          medusaId: withdrawal.acquirer_withdrawal_id,
          oldStatus: withdrawal.status,
          newStatus: internalStatus,
        });
        syncedCount++;
      }
    }

    console.log(`[Sync Withdrawals] Medusa: ${syncedCount} saques sincronizados.`);

    // ========== SINCRONIZAR SAQUES DA MISTICPAY ==========
    let misticSyncedCount = 0;
    
    try {
      // Buscar credenciais da MisticPay
      const misticAcquirer = await sql`
        SELECT api_key, api_secret 
        FROM acquirers 
        WHERE code = 'misticpay' AND is_active = true 
        LIMIT 1
      `;

      if (misticAcquirer.length > 0) {
        const { api_key, api_secret } = misticAcquirer[0];
        const misticClient = new MisticPay({ clientId: api_key, clientSecret: api_secret });

        // Buscar saques em processamento (UUID indica MisticPay, numérico indica Medusa)
        const misticWithdrawals = await sql`
          SELECT id, user_id, amount, net_amount, pix_key, acquirer_withdrawal_id, status
          FROM withdrawals
          WHERE status = 'processing'
            AND acquirer_withdrawal_id IS NOT NULL
            AND acquirer_withdrawal_id LIKE '%-%'
          ORDER BY created_at DESC
          LIMIT 50
        `;

        console.log(`[Sync Withdrawals] MisticPay: ${misticWithdrawals.length} saques pendentes`);

        for (const withdrawal of misticWithdrawals) {
          try {
            const result = await misticClient.checkTransaction(withdrawal.acquirer_withdrawal_id);
            console.log(`[Sync MisticPay] Resposta para saque ${withdrawal.id}:`, JSON.stringify(result));
            
            if (result.success && result.data) {
              // MisticPay retorna status em result.data.status (que e mapeado de transactionState)
              const state = (result.data.status || "").toUpperCase();
              console.log(`[Sync MisticPay] Saque ${withdrawal.id}: estado=${state}`);

              if (state === "COMPLETO" || state === "COMPLETED" || state === "PAID") {
                // Saque concluído com sucesso
                await sql`
                  UPDATE withdrawals 
                  SET status = 'completed'
                  WHERE id = ${withdrawal.id}
                `;
                
                // Notificar usuário
                await sql`
                  INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
                  VALUES (
                    ${crypto.randomUUID()},
                    ${withdrawal.user_id},
                    'Saque Concluído!',
                    ${`Seu saque de R$ ${Number(withdrawal.net_amount).toFixed(2)} foi enviado para sua chave PIX.`},
                    'success',
                    NOW()
                  )
                `;
                
                misticSyncedCount++;
                results.push({
                  id: withdrawal.id,
                  medusaId: withdrawal.acquirer_withdrawal_id,
                  oldStatus: "processing",
                  newStatus: "completed",
                });

              } else if (state === "FALHOU" || state === "FAILED" || state === "CANCELLED" || state === "CANCELADO") {
                // Saque falhou - devolver saldo
                await sql`
                  UPDATE withdrawals 
                  SET status = 'failed'
                  WHERE id = ${withdrawal.id}
                `;
                
                // Devolver saldo ao usuário
                await sql`
                  UPDATE profiles 
                  SET balance = balance + ${Number(withdrawal.amount)}
                  WHERE id = ${withdrawal.user_id}
                `;
                
                // Notificar usuário
                await sql`
                  INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
                  VALUES (
                    ${crypto.randomUUID()},
                    ${withdrawal.user_id},
                    'Saque Falhou',
                    ${`Seu saque de R$ ${Number(withdrawal.amount).toFixed(2)} falhou. O valor foi devolvido ao seu saldo.`},
                    'error',
                    NOW()
                  )
                `;
                
                misticSyncedCount++;
                results.push({
                  id: withdrawal.id,
                  medusaId: withdrawal.acquirer_withdrawal_id,
                  oldStatus: "processing",
                  newStatus: "failed",
                });
              }
            }
          } catch (err) {
            console.error(`[Sync MisticPay] Erro ao verificar saque ${withdrawal.id}:`, err);
          }
        }
      }
    } catch (misticError) {
      console.error("[Sync Withdrawals] Erro ao sincronizar MisticPay:", misticError);
    }

    console.log(`[Sync Withdrawals] Concluído. Medusa: ${syncedCount}, MisticPay: ${misticSyncedCount}`);

    return NextResponse.json({
      success: true,
      synced: syncedCount + misticSyncedCount,
      medusaSynced: syncedCount,
      misticPaySynced: misticSyncedCount,
      results,
    });
  } catch (error) {
    console.error("[Sync Withdrawals] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar saques", details: String(error) },
      { status: 500 }
    );
  }
}
