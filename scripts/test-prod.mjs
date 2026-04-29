const CLIENT_ID = "cli_632c4d9030384eefab762159";
const CLIENT_SECRET = "sec_eb83880229bf8fa6c3d039cf83073e5a37a2cca0cdb3e62bc2d04af4b082050c";
const BASE_URL = "https://legacypay.site";

async function testAPI() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  console.log("=== TESTE API PRODUCAO ===");
  console.log("URL:", `${BASE_URL}/api/v1/integration/pix`);
  console.log("Auth:", `Basic ${credentials.substring(0, 20)}...`);
  console.log("");

  try {
    const response = await fetch(`${BASE_URL}/api/v1/integration/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`
      },
      body: JSON.stringify({
        amount: 10,
        description: "Teste API Producao",
        external_id: `teste_${Date.now()}`
      })
    });

    const data = await response.json();
    
    console.log("Status:", response.status);
    console.log("Resposta:", JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log("\n=== SUCESSO! PIX CRIADO ===");
      console.log("Transaction ID:", data.data?.transaction_id);
      console.log("QR Code presente:", data.data?.pix?.qr_code ? "SIM" : "NAO");
      console.log("Copy/Paste presente:", data.data?.pix?.copy_paste ? "SIM" : "NAO");
    } else {
      console.log("\n=== ERRO ===");
      console.log("Mensagem:", data.error);
      console.log("Codigo:", data.code);
    }
  } catch (error) {
    console.error("Erro na requisicao:", error.message);
  }
}

testAPI();
