import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches data from a dynamic PIX QR Code URL
 * Dynamic QR codes store the actual payment data (amount, recipient, etc) at a URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    console.log("[API] PIX QR Data - Received URL:", url);

    if (!url) {
      return NextResponse.json({ error: "URL obrigatoria", found: false }, { status: 400 });
    }

    // Add https if not present
    let fullUrl = url;
    if (!url.startsWith("http")) {
      fullUrl = `https://${url}`;
    }
    
    console.log("[API] PIX QR Data - Full URL:", fullUrl);

    try {
      // First, try to fetch as JSON (some PSPs return JSON directly)
      const jsonResponse = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json, text/html, */*",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        redirect: "follow",
      });

      console.log("[API] PIX QR Data - Response status:", jsonResponse.status);
      console.log("[API] PIX QR Data - Content-Type:", jsonResponse.headers.get("content-type"));

      const contentType = jsonResponse.headers.get("content-type") || "";
      const responseText = await jsonResponse.text();
      
      console.log("[API] PIX QR Data - Response length:", responseText.length);
      console.log("[API] PIX QR Data - Response preview:", responseText.substring(0, 500));

      let amount: number | undefined;
      let name: string | undefined;
      let description: string | undefined;

      // Try to parse as JSON first
      if (contentType.includes("application/json") || responseText.startsWith("{")) {
        try {
          const data = JSON.parse(responseText);
          console.log("[API] PIX QR Data - Parsed JSON:", JSON.stringify(data, null, 2).substring(0, 500));
          
          // Extract from various JSON structures
          amount = parseFloat(
            data.amount || 
            data.valor || 
            data.value || 
            data.transaction?.amount ||
            data.payment?.amount ||
            data.pix?.amount ||
            data.cobranca?.valor?.original ||
            data.data?.amount ||
            "0"
          );
          
          name = 
            data.name || 
            data.nome || 
            data.merchant || 
            data.merchantName ||
            data.recebedor ||
            data.receiver?.name ||
            data.transaction?.merchantName ||
            data.devedor?.nome ||
            data.calendario?.criacao;
            
          description =
            data.description ||
            data.descricao ||
            data.message ||
            data.infoAdicional ||
            data.solicitacaoPagador;
            
        } catch (parseError) {
          console.log("[API] PIX QR Data - JSON parse failed, trying HTML");
        }
      }
      
      // If no amount from JSON, try HTML extraction
      if (!amount || amount <= 0) {
        // Various patterns for amount extraction
        const amountPatterns = [
          /R\$\s*([\d]+[.,][\d]{2})/gi,
          /valor[^>]*>\s*R?\$?\s*([\d]+[.,][\d]{2})/gi,
          /"amount"\s*:\s*"?([\d.]+)"?/gi,
          /"valor"\s*:\s*"?([\d.]+)"?/gi,
          /data-amount="([\d.]+)"/gi,
          /class="[^"]*amount[^"]*"[^>]*>([\d.,]+)/gi,
          /class="[^"]*value[^"]*"[^>]*>R?\$?\s*([\d.,]+)/gi,
          /class="[^"]*price[^"]*"[^>]*>R?\$?\s*([\d.,]+)/gi,
          />([\d]+,[\d]{2})</g,
        ];
        
        for (const pattern of amountPatterns) {
          const matches = [...responseText.matchAll(pattern)];
          for (const match of matches) {
            if (match[1]) {
              // Clean and parse amount
              let cleanAmount = match[1].trim();
              // Handle Brazilian format (1.234,56) vs US format (1,234.56)
              if (cleanAmount.includes(",") && cleanAmount.includes(".")) {
                // Has both - check which is decimal
                const lastComma = cleanAmount.lastIndexOf(",");
                const lastDot = cleanAmount.lastIndexOf(".");
                if (lastComma > lastDot) {
                  // Brazilian format: 1.234,56
                  cleanAmount = cleanAmount.replace(/\./g, "").replace(",", ".");
                } else {
                  // US format: 1,234.56
                  cleanAmount = cleanAmount.replace(/,/g, "");
                }
              } else if (cleanAmount.includes(",")) {
                // Only comma - likely Brazilian decimal
                cleanAmount = cleanAmount.replace(",", ".");
              }
              
              const parsed = parseFloat(cleanAmount);
              console.log("[API] PIX QR Data - Found amount candidate:", match[1], "->", parsed);
              
              if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
                amount = parsed;
                break;
              }
            }
          }
          if (amount && amount > 0) break;
        }
      }
      
      // Extract name from HTML if not found
      if (!name) {
        const namePatterns = [
          /nome[^>]*>\s*([^<]+)</gi,
          /"name"\s*:\s*"([^"]+)"/gi,
          /"merchant"\s*:\s*"([^"]+)"/gi,
          /recebedor[^>]*>\s*([^<]+)</gi,
          /class="[^"]*name[^"]*"[^>]*>([^<]+)</gi,
          /class="[^"]*merchant[^"]*"[^>]*>([^<]+)</gi,
        ];
        
        for (const pattern of namePatterns) {
          const match = responseText.match(pattern);
          if (match && match[1] && match[1].trim().length > 2) {
            name = match[1].trim();
            console.log("[API] PIX QR Data - Found name:", name);
            break;
          }
        }
      }

      if (amount && amount > 0) {
        console.log("[API] PIX QR Data - Returning:", { amount, name, description });
        return NextResponse.json({
          found: true,
          amount,
          name,
          description,
          source: contentType.includes("json") ? "json" : "html",
        });
      }

      console.log("[API] PIX QR Data - No amount found");
      return NextResponse.json({ found: false, reason: "no_amount_found" });
      
    } catch (fetchError) {
      console.error("[API] PIX QR Data - Fetch error:", fetchError);
      return NextResponse.json({ 
        found: false, 
        error: "fetch_failed",
        message: fetchError instanceof Error ? fetchError.message : "Unknown error"
      });
    }
  } catch (error) {
    console.error("[API] PIX QR Data - General error:", error);
    return NextResponse.json(
      { error: "Erro ao processar", found: false },
      { status: 500 }
    );
  }
}
