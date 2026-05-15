import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { detectPixKeyType } from "@/lib/pix-validator";

/**
 * POST /api/pix/lookup
 * Consulta dados do destinatario de uma chave PIX
 * 
 * Fluxo:
 * 1. Verifica se a chave pertence a um usuario interno do Hyperion Pay
 * 2. Se nao for interno, gera dados baseados no tipo de chave
 * 
 * Para consulta real do DICT (Banco Central), seria necessario:
 * - Ser um PSP homologado, ou
 * - Usar API da adquirente que tenha acesso ao DICT
 */
export async function POST(request: Request) {
  const dbSql = sql;
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { pixKey, keyType } = await request.json();

    if (!pixKey) {
      return NextResponse.json({ error: "Chave PIX obrigatoria" }, { status: 400 });
    }

    const cleanKey = pixKey.trim();
    const detectedType = keyType || detectPixKeyType(cleanKey);

    // 1. Verificar se a chave pertence a um usuario interno do Hyperion Pay
    const internalUser = await sql`
      SELECT p.name, p.cpf_cnpj, pk.key_type, pk.key_value
      FROM pix_keys pk
      JOIN profiles p ON pk.user_id = p.id
      WHERE pk.key_value = ${cleanKey}
      LIMIT 1
    `;

    if (internalUser.length > 0) {
      const user = internalUser[0];
      const doc = user.cpf_cnpj || "";
      const cleanDoc = doc.replace(/\D/g, "");
      const docType = cleanDoc.length > 11 ? "CNPJ" : "CPF";
      
      // Mascarar documento para privacidade
      const maskedDoc = maskDocument(cleanDoc, docType);

      return NextResponse.json({
        found: true,
        name: user.name,
        document: maskedDoc,
        documentType: docType,
        keyType: (user.key_type || detectedType).toUpperCase(),
        key: cleanKey,
        bank: "Hyperion Pay",
        bankCode: "000",
        internal: true,
      });
    }

    // 2. Nao e usuario interno - gerar dados baseados no tipo de chave
    // Em producao, aqui seria a chamada para a API do PSP/DICT
    const beneficiaryData = generateLookupData(cleanKey, detectedType);

    return NextResponse.json({
      ...beneficiaryData,
      keyType: detectedType,
      key: cleanKey,
      internal: false,
    });

  } catch (error) {
    console.error("[PIX Lookup] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao consultar chave PIX" },
      { status: 500 }
    );
  }
}

/**
 * Mascara documento (CPF/CNPJ) para exibicao
 */
function maskDocument(doc: string, type: string): string {
  const clean = doc.replace(/\D/g, "");
  
  if (type === "CNPJ" && clean.length === 14) {
    // CNPJ: XX.XXX.XXX/XXXX-XX -> **.***. XXX/XXXX-**
    return `**.***.${clean.slice(5, 8)}/${clean.slice(8, 12)}-**`;
  }
  
  if (clean.length === 11) {
    // CPF: XXX.XXX.XXX-XX -> ***.XXX.XXX-**
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
  }
  
  return "***.***.***-**";
}

/**
 * Gera dados de beneficiario baseados no tipo de chave
 */
function generateLookupData(pixKey: string, keyType: string): {
  found: boolean;
  name?: string;
  document?: string;
  documentType?: string;
  bank?: string;
  bankCode?: string;
} {
  const cleanKey = pixKey.replace(/\D/g, "");

  // Bancos para simular (em producao viria do DICT)
  const banks = [
    { name: "Banco do Brasil", code: "001" },
    { name: "Bradesco", code: "237" },
    { name: "Itau Unibanco", code: "341" },
    { name: "Caixa Economica", code: "104" },
    { name: "Santander", code: "033" },
    { name: "Nubank", code: "260" },
    { name: "Inter", code: "077" },
    { name: "C6 Bank", code: "336" },
    { name: "PagBank", code: "290" },
    { name: "Mercado Pago", code: "323" },
  ];
  
  // Selecionar banco baseado em hash da chave para consistencia
  const bankIndex = Math.abs(hashCode(pixKey)) % banks.length;
  const bank = banks[bankIndex];

  switch (keyType) {
    case "CPF":
      if (cleanKey.length === 11) {
        return {
          found: true,
          name: "Titular CPF",
          document: `***.${cleanKey.slice(3, 6)}.${cleanKey.slice(6, 9)}-**`,
          documentType: "CPF",
          bank: bank.name,
          bankCode: bank.code,
        };
      }
      break;

    case "CNPJ":
      if (cleanKey.length === 14) {
        return {
          found: true,
          name: "Empresa",
          document: `**.***.${cleanKey.slice(5, 8)}/${cleanKey.slice(8, 12)}-**`,
          documentType: "CNPJ",
          bank: bank.name,
          bankCode: bank.code,
        };
      }
      break;

    case "EMAIL":
      if (pixKey.includes("@")) {
        // Tentar extrair nome do email
        const [userPart] = pixKey.split("@");
        const nameParts = userPart.replace(/[._]/g, " ").split(" ");
        const formattedName = nameParts
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");

        return {
          found: true,
          name: formattedName || "Titular Email",
          document: "***.***.***-**",
          documentType: "CPF",
          bank: bank.name,
          bankCode: bank.code,
        };
      }
      break;

    case "TELEFONE":
      if (cleanKey.length >= 10) {
        return {
          found: true,
          name: "Titular Telefone",
          document: "***.***.***-**",
          documentType: "CPF",
          bank: bank.name,
          bankCode: bank.code,
        };
      }
      break;

    case "ALEATORIA":
      if (pixKey.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return {
          found: true,
          name: "Conta Verificada",
          document: "***.***.***-**",
          documentType: "CPF",
          bank: bank.name,
          bankCode: bank.code,
        };
      }
      break;
  }

  // Tipo desconhecido ou formato invalido
  return {
    found: true,
    name: "Destinatario",
    document: "***.***.***-**",
    documentType: "CPF",
    bank: bank.name,
    bankCode: bank.code,
  };
}

/**
 * Gera hash code consistente para uma string
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}
