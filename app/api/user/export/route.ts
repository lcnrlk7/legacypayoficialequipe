import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

function escapeCSV(value: string | null | undefined): string {
  if (!value) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "transactions";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    let csv = "";
    let filename = "";

    if (type === "transactions") {
      // Exportar transacoes
      let query = sql`
        SELECT 
          id, external_id, type, amount, fee, net_amount, status,
          payer_name, payer_document, payer_email, description,
          created_at, paid_at
        FROM transactions
        WHERE user_id = ${user.id}
      `;

      if (startDate) {
        query = sql`${query} AND created_at >= ${startDate}`;
      }
      if (endDate) {
        query = sql`${query} AND created_at <= ${endDate}`;
      }
      if (status && status !== "all") {
        query = sql`${query} AND status = ${status}`;
      }

      const transactions = await sql`
        SELECT 
          id, external_id, type, amount, fee, net_amount, status,
          payer_name, payer_document, payer_email, description,
          created_at, paid_at
        FROM transactions
        WHERE user_id = ${user.id}
        ${startDate ? sql`AND created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND created_at <= ${endDate}::date + interval '1 day'` : sql``}
        ${status && status !== "all" ? sql`AND status = ${status}` : sql``}
        ORDER BY created_at DESC
      `;

      // Header CSV
      csv = "ID,ID Externo,Tipo,Valor Bruto,Taxa,Valor Liquido,Status,Nome Pagador,Documento,Email,Descricao,Data Criacao,Data Pagamento\n";

      // Linhas
      for (const tx of transactions) {
        const tipo = tx.type === "pix_in" ? "Entrada PIX" : tx.type === "withdrawal" ? "Saque" : tx.type;
        const statusLabel = tx.status === "paid" ? "Pago" : tx.status === "pending" ? "Pendente" : tx.status === "expired" ? "Expirado" : tx.status;
        
        csv += [
          escapeCSV(tx.id as string),
          escapeCSV(tx.external_id as string),
          escapeCSV(tipo as string),
          formatCurrency(Number(tx.amount)),
          formatCurrency(Number(tx.fee || 0)),
          formatCurrency(Number(tx.net_amount || tx.amount)),
          escapeCSV(statusLabel as string),
          escapeCSV(tx.payer_name as string),
          escapeCSV(tx.payer_document as string),
          escapeCSV(tx.payer_email as string),
          escapeCSV(tx.description as string),
          formatDate(tx.created_at as string),
          tx.paid_at ? formatDate(tx.paid_at as string) : "",
        ].join(",") + "\n";
      }

      filename = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
    } 
    else if (type === "withdrawals") {
      // Exportar saques
      const withdrawals = await sql`
        SELECT 
          id, amount, fee, net_amount, pix_key, pix_key_type, 
          status, rejection_reason, created_at, processed_at
        FROM withdrawals
        WHERE user_id = ${user.id}
        ${startDate ? sql`AND created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND created_at <= ${endDate}::date + interval '1 day'` : sql``}
        ${status && status !== "all" ? sql`AND status = ${status}` : sql``}
        ORDER BY created_at DESC
      `;

      csv = "ID,Valor Solicitado,Taxa,Valor Liquido,Chave PIX,Tipo Chave,Status,Motivo Rejeicao,Data Solicitacao,Data Processamento\n";

      for (const w of withdrawals) {
        const statusLabel = w.status === "completed" ? "Concluido" : w.status === "processing" ? "Processando" : w.status === "pending" ? "Pendente" : w.status === "cancelled" ? "Cancelado" : w.status;
        
        csv += [
          escapeCSV(w.id as string),
          formatCurrency(Number(w.amount)),
          formatCurrency(Number(w.fee || 0)),
          formatCurrency(Number(w.net_amount || w.amount)),
          escapeCSV(w.pix_key as string),
          escapeCSV(w.pix_key_type as string),
          escapeCSV(statusLabel as string),
          escapeCSV(w.rejection_reason as string),
          formatDate(w.created_at as string),
          w.processed_at ? formatDate(w.processed_at as string) : "",
        ].join(",") + "\n";
      }

      filename = `saques_${new Date().toISOString().split("T")[0]}.csv`;
    }
    else if (type === "commissions") {
      // Exportar comissoes de afiliado
      const commissions = await sql`
        SELECT 
          ac.id, ac.amount, ac.source_type, ac.status, ac.created_at,
          p.name as referred_name, p.email as referred_email
        FROM affiliate_commissions ac
        LEFT JOIN profiles p ON p.id = ac.source_user_id
        WHERE ac.user_id = ${user.id}
        ${startDate ? sql`AND ac.created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND ac.created_at <= ${endDate}::date + interval '1 day'` : sql``}
        ORDER BY ac.created_at DESC
      `;

      csv = "ID,Valor,Tipo,Status,Nome Indicado,Email Indicado,Data\n";

      for (const c of commissions) {
        const sourceType = c.source_type === "transaction" ? "Transacao" : c.source_type === "registration" ? "Cadastro" : c.source_type;
        const statusLabel = c.status === "paid" ? "Pago" : c.status === "pending" ? "Pendente" : c.status;
        
        csv += [
          escapeCSV(c.id as string),
          formatCurrency(Number(c.amount)),
          escapeCSV(sourceType as string),
          escapeCSV(statusLabel as string),
          escapeCSV(c.referred_name as string),
          escapeCSV(c.referred_email as string),
          formatDate(c.created_at as string),
        ].join(",") + "\n";
      }

      filename = `comissoes_${new Date().toISOString().split("T")[0]}.csv`;
    }
    else {
      return NextResponse.json({ error: "Tipo de exportacao invalido" }, { status: 400 });
    }

    // Adicionar BOM para Excel reconhecer UTF-8
    const bom = "\uFEFF";
    const csvWithBom = bom + csv;

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    return NextResponse.json(
      { error: "Erro ao exportar dados" },
      { status: 500 }
    );
  }
}
