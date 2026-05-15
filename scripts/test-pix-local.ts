import { neon } from '@neondatabase/serverless'

async function testPixGeneration() {
  const sql = neon(process.env.DATABASE_URL!)
  
  console.log('1. Buscando usuario hazertiktok@gmail.com...')
  const users = await sql`SELECT id, name, email, mp_access_token, kyc_status FROM profiles WHERE email = 'hazertiktok@gmail.com'`
  
  if (!users.length) {
    console.log('Usuario nao encontrado!')
    return
  }
  
  const user = users[0]
  console.log('Usuario:', user.name)
  console.log('KYC Status:', user.kyc_status)
  console.log('Tem MP Token:', user.mp_access_token ? 'Sim (' + user.mp_access_token.substring(0, 20) + '...)' : 'Nao')
  
  if (!user.mp_access_token) {
    console.log('ERRO: Usuario nao tem token do Mercado Pago!')
    return
  }
  
  console.log('\n2. Gerando PIX de R$ 1500...')
  
  const payload = {
    transaction_amount: 1500,
    description: 'Teste Split Payment - Parcela 1/7',
    payment_method_id: 'pix',
    payer: {
      email: 'cliente@teste.com',
      first_name: 'Cliente',
      last_name: 'Teste',
      identification: { type: 'CPF', number: '12345678909' }
    }
  }
  
  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.mp_access_token}`,
      'X-Idempotency-Key': `test-split-${Date.now()}`
    },
    body: JSON.stringify(payload)
  })
  
  const data = await response.json()
  console.log('\n3. Resposta MP (status HTTP:', response.status + '):')
  
  if (data.id) {
    console.log('PIX GERADO COM SUCESSO!')
    console.log('ID:', data.id)
    console.log('Status:', data.status)
    const qrData = data.point_of_interaction?.transaction_data
    console.log('QR Code Base64:', qrData?.qr_code_base64 ? 'SIM (gerado)' : 'NAO')
    console.log('Copy Paste:', qrData?.qr_code ? qrData.qr_code.substring(0, 80) + '...' : 'NAO')
  } else {
    console.log('ERRO:', JSON.stringify(data, null, 2))
  }
}

testPixGeneration().catch(console.error)
