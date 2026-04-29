// Script para testar a API de PIX via integração
// Usa Basic Auth com Client ID e Client Secret

const CLIENT_ID = "lp_8d27e9433c67408cb6b2e71a";
const CLIENT_SECRET = "sk_09b8449b7104aca8ad6ea48a9254e2512f2f73e8265a66b9a50b8322bd1bd0d6";

// URL base - usar localhost para teste local
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function testPixCreation() {
  console.log("=== Teste de Criação de PIX via API de Integração ===\n");
  
  // Criar Basic Auth header
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  console.log("1. Credenciais configuradas");
  console.log(`   - Client ID: ${CLIENT_ID}`);
  console.log(`   - Basic Auth: Basic ${credentials.substring(0, 20)}...`);
  
  // Payload de teste - mesmo formato que você enviou
  const payload = {
    amount: 4,
    external_id: `test_${Date.now()}`,
    description: "Acesso VIP - Teste"
  };
  
  console.log("\n2. Payload de teste:");
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    console.log(`\n3. Enviando requisição para ${BASE_URL}/api/v1/integration/pix ...`);
    
    const response = await fetch(`${BASE_URL}/api/v1/integration/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`\n4. Resposta (status ${response.status}):`);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log("\n✓ PIX criado com sucesso!");
      console.log(`  - Transaction ID: ${data.transaction_id || data.data?.transaction_id}`);
      console.log(`  - QR Code: ${data.qr_code ? "OK" : "VAZIO"}`);
      console.log(`  - Copy Paste: ${data.copy_paste ? data.copy_paste.substring(0, 50) + "..." : "VAZIO"}`);
    } else {
      console.log("\n✗ Erro ao criar PIX:");
      console.log(`  - Error: ${data.error}`);
      console.log(`  - Code: ${data.code}`);
    }
    
  } catch (error) {
    console.error("\n✗ Erro na requisição:");
    console.error(error.message);
  }
}

// Teste adicional: Com dados do pagador
async function testPixWithPayer() {
  console.log("\n\n=== Teste de Criação de PIX COM dados do pagador ===\n");
  
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  const payload = {
    amount: 5,
    external_id: `test_payer_${Date.now()}`,
    description: "Acesso VIP - Com Pagador",
    payer: {
      name: "João Teste",
      document: "12345678900",
      email: "joao@teste.com"
    }
  };
  
  console.log("Payload com pagador:");
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/integration/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`\nResposta (status ${response.status}):`);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log("\n✓ PIX com pagador criado com sucesso!");
    } else {
      console.log("\n✗ Erro ao criar PIX com pagador:");
      console.log(`  - Error: ${data.error}`);
    }
    
  } catch (error) {
    console.error("\n✗ Erro na requisição:");
    console.error(error.message);
  }
}

// Executar testes
testPixCreation()
  .then(() => testPixWithPayer())
  .catch(console.error);
