/**
 * Script para testar a criação de PIX via API de integração
 * Uso: node --env-file-if-exists=/vercel/share/.env.project scripts/test-pix-integration.mjs
 */

// Configuração - substitua pelos valores reais
const CONFIG = {
  // URL da API
  apiUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Credenciais da integração (Client ID e Client Secret)
  // IMPORTANTE: Substitua pelos valores reais ou passe via env
  clientId: process.env.TEST_CLIENT_ID || "",
  clientSecret: process.env.TEST_CLIENT_SECRET || "",
};

async function testPixCreation() {
  console.log("=".repeat(60));
  console.log("Teste de Criação de PIX via API de Integração");
  console.log("=".repeat(60));
  
  if (!CONFIG.clientId || !CONFIG.clientSecret) {
    console.log("\n⚠️  Credenciais não configuradas!");
    console.log("   Configure TEST_CLIENT_ID e TEST_CLIENT_SECRET nas variáveis de ambiente");
    console.log("   ou edite o script diretamente.");
    console.log("\n   Exemplo:");
    console.log("   TEST_CLIENT_ID=xxx TEST_CLIENT_SECRET=yyy node scripts/test-pix-integration.mjs");
    return;
  }

  // Criar Basic Auth
  const basicAuth = Buffer.from(`${CONFIG.clientId}:${CONFIG.clientSecret}`).toString("base64");
  
  // Payload de teste
  const payload = {
    amount: 4,
    external_id: `test_${Date.now()}`,
    description: "Teste de PIX via Script"
  };

  console.log("\n📋 Configuração:");
  console.log(`   URL: ${CONFIG.apiUrl}/api/v1/integration/pix`);
  console.log(`   Client ID: ${CONFIG.clientId.substring(0, 8)}...`);
  console.log(`   Payload: ${JSON.stringify(payload)}`);
  
  try {
    console.log("\n🚀 Enviando requisição...");
    
    const response = await fetch(`${CONFIG.apiUrl}/api/v1/integration/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    console.log(`\n📥 Status HTTP: ${response.status}`);
    console.log("\n📄 Resposta:");
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log("\n✅ PIX criado com sucesso!");
      console.log(`   Transaction ID: ${data.data?.transaction_id}`);
      console.log(`   External ID: ${data.data?.external_id}`);
      console.log(`   Valor: R$ ${data.data?.amount}`);
      console.log(`   Taxa: R$ ${data.data?.fee}`);
      console.log(`   Líquido: R$ ${data.data?.net_amount}`);
      console.log(`   Copy & Paste: ${data.data?.pix?.copy_paste ? 'Disponível' : 'Não disponível'}`);
    } else {
      console.log("\n❌ Erro ao criar PIX:");
      console.log(`   Mensagem: ${data.error}`);
      console.log(`   Código: ${data.code}`);
    }
  } catch (error) {
    console.log("\n❌ Erro na requisição:");
    console.log(`   ${error.message}`);
  }
  
  console.log("\n" + "=".repeat(60));
}

// Executar teste
testPixCreation();
