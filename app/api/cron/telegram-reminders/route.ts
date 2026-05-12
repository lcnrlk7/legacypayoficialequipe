import { NextResponse } from "next/server";
import {
  getPendingBotTransactions,
  markReminderSent,
  sendPendingPixReminder,
  sendPixExpiringWarning,
  getInactiveBotUsers,
  markInactivityReminderSent,
  sendInactivityReminder,
  getLowBalanceUsers,
  markLowBalanceAlertSent,
  sendLowBalanceAlert,
} from "@/lib/telegram/notify";

// Verificar autorizacao do cron
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error("[Cron Reminders] CRON_SECRET nao configurado");
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  // Verificar autorizacao
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }
  
  const results = {
    pixReminders: { sent: 0, errors: 0 },
    expiringReminders: { sent: 0, errors: 0 },
    inactivityReminders: { sent: 0, errors: 0 },
    lowBalanceAlerts: { sent: 0, errors: 0 },
  };
  
  try {
    // ========================================
    // 1. LEMBRETES DE PIX PENDENTE (5-10 min)
    // ========================================
    console.log("[Cron Reminders] Buscando PIX pendentes (5+ minutos)...");
    
    const pendingTransactions = await getPendingBotTransactions(5);
    
    for (const tx of pendingTransactions) {
      try {
        const minutesPending = Math.floor(
          (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60)
        );
        
        // Se passou mais de 25 minutos, enviar aviso de expiracao
        if (minutesPending >= 25 && minutesPending < 30) {
          const sent = await sendPixExpiringWarning(
            tx.telegram_id,
            parseFloat(tx.amount),
            tx.pix_code || "",
            30 - minutesPending
          );
          
          if (sent) {
            await markReminderSent(tx.id);
            results.expiringReminders.sent++;
          } else {
            results.expiringReminders.errors++;
          }
        }
        // Se passou entre 5 e 15 minutos, enviar lembrete normal
        else if (minutesPending >= 5 && minutesPending < 15) {
          const sent = await sendPendingPixReminder(
            tx.telegram_id,
            parseFloat(tx.amount),
            tx.pix_code || "",
            minutesPending
          );
          
          if (sent) {
            await markReminderSent(tx.id);
            results.pixReminders.sent++;
          } else {
            results.pixReminders.errors++;
          }
        }
      } catch (error) {
        console.error("[Cron Reminders] Erro ao enviar lembrete PIX:", error);
        results.pixReminders.errors++;
      }
    }
    
    // ========================================
    // 2. LEMBRETES DE INATIVIDADE (7+ dias)
    // ========================================
    console.log("[Cron Reminders] Buscando usuarios inativos (7+ dias)...");
    
    const inactiveUsers = await getInactiveBotUsers(7);
    
    for (const user of inactiveUsers) {
      try {
        const daysSinceActivity = Math.floor(
          (Date.now() - new Date(user.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const sent = await sendInactivityReminder(
          user.telegram_id,
          user.first_name || user.username || "",
          daysSinceActivity
        );
        
        if (sent) {
          await markInactivityReminderSent(user.id);
          results.inactivityReminders.sent++;
        } else {
          results.inactivityReminders.errors++;
        }
      } catch (error) {
        console.error("[Cron Reminders] Erro ao enviar lembrete inatividade:", error);
        results.inactivityReminders.errors++;
      }
    }
    
    // ========================================
    // 3. ALERTAS DE SALDO BAIXO (< R$10)
    // ========================================
    console.log("[Cron Reminders] Buscando usuarios com saldo baixo...");
    
    const lowBalanceUsers = await getLowBalanceUsers(10);
    
    for (const user of lowBalanceUsers) {
      try {
        const sent = await sendLowBalanceAlert(
          user.telegram_id,
          parseFloat(user.balance),
          10
        );
        
        if (sent) {
          await markLowBalanceAlertSent(user.id);
          results.lowBalanceAlerts.sent++;
        } else {
          results.lowBalanceAlerts.errors++;
        }
      } catch (error) {
        console.error("[Cron Reminders] Erro ao enviar alerta saldo baixo:", error);
        results.lowBalanceAlerts.errors++;
      }
    }
    
    console.log("[Cron Reminders] Concluido:", results);
    
    return NextResponse.json({
      success: true,
      message: "Lembretes processados com sucesso",
      results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("[Cron Reminders] Erro geral:", error);
    return NextResponse.json(
      { error: "Erro ao processar lembretes", details: String(error) },
      { status: 500 }
    );
  }
}
