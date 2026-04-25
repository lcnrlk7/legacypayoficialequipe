import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches data from a dynamic PIX QR Code URL
 * Dynamic QR codes store the actual payment data (amount, recipient, etc) at a URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL obrigatoria" }, { status: 400 });
    }

    // Ensure the URL is a valid PIX URL
    if (!url.includes("pix") && !url.includes("bcb")) {
      return NextResponse.json({ error: "URL invalida" }, { status: 400 });
    }

    // Try to fetch the QR code data from the URL
    // Most PSPs return JSON with the payment details
    try {
      // Add https if not present
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "LegacyPay/1.0",
        },
      });

      if (!response.ok) {
        // Try to get HTML content for scraping
        const htmlResponse = await fetch(fullUrl, {
          method: "GET",
          headers: {
            Accept: "text/html",
            "User-Agent": "LegacyPay/1.0",
          },
        });
        
        if (htmlResponse.ok) {
          const html = await htmlResponse.text();
          
          // Try to extract amount from HTML
          // Common patterns in PIX payment pages
          const amountPatterns = [
            /R\$\s*([\d.,]+)/i,
            /valor["\s:]+R?\$?\s*([\d.,]+)/i,
            /"amount":\s*"?([\d.]+)"?/i,
            /"valor":\s*"?([\d.]+)"?/i,
            /data-amount="([\d.]+)"/i,
          ];
          
          let amount: number | undefined;
          for (const pattern of amountPatterns) {
            const match = html.match(pattern);
            if (match) {
              const cleanAmount = match[1].replace(/\./g, "").replace(",", ".");
              const parsed = parseFloat(cleanAmount);
              if (!isNaN(parsed) && parsed > 0) {
                amount = parsed;
                break;
              }
            }
          }
          
          // Try to extract name
          const namePatterns = [
            /nome["\s:]+["']?([^"'<\n]+)/i,
            /"name":\s*"([^"]+)"/i,
            /"merchant":\s*"([^"]+)"/i,
            /recebedor["\s:]+["']?([^"'<\n]+)/i,
          ];
          
          let name: string | undefined;
          for (const pattern of namePatterns) {
            const match = html.match(pattern);
            if (match && match[1].trim()) {
              name = match[1].trim();
              break;
            }
          }
          
          if (amount || name) {
            return NextResponse.json({
              found: true,
              amount,
              name,
              source: "html",
            });
          }
        }
        
        return NextResponse.json({ found: false });
      }

      const data = await response.json();
      
      // Extract data from common JSON structures
      const amount = 
        data.amount || 
        data.valor || 
        data.value || 
        data.transaction?.amount ||
        data.payment?.amount;
        
      const name = 
        data.name || 
        data.nome || 
        data.merchant || 
        data.merchantName ||
        data.recebedor ||
        data.receiver?.name ||
        data.transaction?.merchantName;
        
      const description =
        data.description ||
        data.descricao ||
        data.message ||
        data.infoAdicional;

      return NextResponse.json({
        found: true,
        amount: amount ? parseFloat(amount) : undefined,
        name,
        description,
        source: "json",
      });
    } catch (fetchError) {
      console.error("[API] Error fetching QR data:", fetchError);
      return NextResponse.json({ found: false });
    }
  } catch (error) {
    console.error("[API] Error processing QR data request:", error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
