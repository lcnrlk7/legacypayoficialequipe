/**
 * Script para recalcular e corrigir taxas em transacoes pendentes
 * baseado nas taxas individuais configuradas para cada usuario
 */

const { neon } = require('@neondatabase/serverless');

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('=== Corrigindo taxas de transacoes pendentes ===\n');
  
  // Buscar transacoes pendentes com as taxas dos usuarios
  const pendingTransactions = await sql`
    SELECT 
      t.id, t.user_id, t.amount, t.fee, t.net_amount, t.status, t.created_at,
      p.email, p.route_type, p.fee_percentage, p.fixed_fee
    FROM transactions t
    JOIN profiles p ON t.user_id = p.id
    WHERE t.status = 'pending' AND t.type = 'pix_in'
    ORDER BY t.created_at DESC
  `;
  
  console.log(`Encontradas ${pendingTransactions.length} transacoes pendentes\n`);
  
  let corrected = 0;
  let skipped = 0;
  
  for (const t of pendingTransactions) {
    const amount = Number(t.amount);
    const currentFee = Number(t.fee);
    
    // Determinar taxas do usuario
    let feePercentage, fixedFee;
    
    if (t.fee_percentage !== null && t.fee_percentage !== undefined && String(t.fee_percentage).trim() !== '') {
      feePercentage = Number(t.fee_percentage);
    } else {
      // Padrao da rota
      feePercentage = t.route_type === 'white' ? 0 : 5;
    }
    
    if (t.fixed_fee !== null && t.fixed_fee !== undefined && String(t.fixed_fee).trim() !== '') {
      fixedFee = Number(t.fixed_fee);
    } else {
      // Padrao da rota
      fixedFee = t.route_type === 'white' ? 1.50 : 1.00;
    }
    
    // Calcular taxa correta
    const correctFee = (amount * feePercentage / 100) + fixedFee;
    const correctNetAmount = amount - correctFee;
    
    // Verificar se precisa corrigir
    const feeDiff = Math.abs(currentFee - correctFee);
    
    if (feeDiff > 0.01) { // Tolerancia de 1 centavo
      console.log(`Transacao ${t.id} (${t.email}):`);
      console.log(`  Valor: R$ ${amount.toFixed(2)}`);
      console.log(`  Taxa atual: R$ ${currentFee.toFixed(2)} -> Taxa correta: R$ ${correctFee.toFixed(2)} (${feePercentage}% + R$ ${fixedFee})`);
      console.log(`  Liquido atual: R$ ${Number(t.net_amount).toFixed(2)} -> Liquido correto: R$ ${correctNetAmount.toFixed(2)}`);
      
      // Atualizar a transacao
      await sql`
        UPDATE transactions 
        SET fee = ${correctFee}, net_amount = ${correctNetAmount}
        WHERE id = ${t.id}
      `;
      
      console.log(`  ✓ CORRIGIDO\n`);
      corrected++;
    } else {
      skipped++;
    }
  }
  
  console.log(`\n=== Resumo ===`);
  console.log(`Transacoes corrigidas: ${corrected}`);
  console.log(`Transacoes ja corretas: ${skipped}`);
}

run().catch(console.error);
