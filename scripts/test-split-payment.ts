import { neon } from '@neondatabase/serverless';

async function testSplitPayment() {
  const sql = neon(process.env.DATABASE_URL!);
  
  // 1. Buscar usuario
  console.log('1. Buscando usuario hazertiktok@gmail.com...');
  const users = await sql`SELECT id, name, email, api_key, mp_access_token, kyc_status FROM profiles WHERE email = 'hazertiktok@gmail.com'`;
  
  if (!users.length) {
    console.log('Usuario nao encontrado!');
    return;
  }
  
  const user = users[0] as any;
  console.log('Usuario:', user.name, '| KYC:', user.kyc_status);
  console.log('Tem MP Token:', user.mp_access_token ? 'Sim (' + user.mp_access_token.substring(0, 20) + '...)' : 'Nao');
  
  if (!user.mp_access_token) {
    console.log('ERRO: Usuario nao tem token do Mercado Pago configurado!');
    return;
  }
  
  // 2. Testar geracao de PIX com valor de 1500 (primeira parcela de 10000)
  console.log('\n2. Testando geracao de PIX de R$ 1500...');
  
  const amount = 1500;
  const description = 'Teste Pagamento Dividido - Parcela 1/7';
  
  const payload = {
    transaction_amount: amount,
    description: description,
    payment_method_id: 'pix',
    payer: {
      email: 'cliente@teste.com',
      first_name: 'Cliente',
      last_name: 'Teste',
      identification: {
        type: 'CPF',
        number: '12345678909'
      }
    }
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + user.mp_access_token,
      'X-Idempotency-Key': 'split-test-' + Date.now()
    },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json() as any;
  console.log('\n3. Resposta do Mercado Pago:');
  console.log('Status HTTP:', response.status);
  
  if (data.id) {
    console.log('PIX gerado com sucesso!');
    console.log('ID:', data.id);
    console.log('Status:', data.status);
    console.log('QR Code Base64:', data.point_of_interaction?.transaction_data?.qr_code_base64 ? 'Sim (gerado)' : 'Nao');
    console.log('Copy Paste:', data.point_of_interaction?.transaction_data?.qr_code ? 'Sim' : 'Nao');
    
    if (data.point_of_interaction?.transaction_data?.qr_code) {
      console.log('\nChave PIX Copia e Cola:');
      console.log(data.point_of_interaction.transaction_data.qr_code.substring(0, 100) + '...');
    }
  } else {
    console.log('Erro:', JSON.stringify(data, null, 2));
  }
}

testSplitPayment().catch(console.error);
