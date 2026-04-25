import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Simulated PIX key lookup - In production, this would call the PSP/Bank API
// to get the real beneficiary data from BACEN DICT
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { pixKey, keyType } = await request.json();

    if (!pixKey) {
      return NextResponse.json({ error: "Chave PIX obrigatoria" }, { status: 400 });
    }

    // In production, this would be a real API call to the PSP
    // For now, we'll generate realistic mock data based on key type
    const beneficiaryData = await lookupPixKey(pixKey, keyType);

    return NextResponse.json(beneficiaryData);
  } catch (error) {
    console.error("[PIX Lookup] Error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar chave PIX" },
      { status: 500 }
    );
  }
}

async function lookupPixKey(pixKey: string, keyType: string) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate beneficiary data based on key type
  const cleanKey = pixKey.replace(/\D/g, "");

  // For CPF keys, generate a name
  if (keyType === "CPF" || (cleanKey.length === 11 && /^\d+$/.test(cleanKey))) {
    const names = [
      "Maria Silva",
      "Joao Santos",
      "Ana Oliveira",
      "Carlos Souza",
      "Julia Costa",
      "Pedro Ferreira",
      "Lucia Rodrigues",
      "Fernando Lima",
    ];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const maskedCpf = `***.${cleanKey.substring(3, 6)}.${cleanKey.substring(6, 9)}-**`;

    return {
      found: true,
      name: randomName,
      document: maskedCpf,
      documentType: "CPF",
      keyType: "CPF",
      key: pixKey,
      bank: "Banco do Brasil",
      bankCode: "001",
    };
  }

  // For CNPJ keys
  if (keyType === "CNPJ" || (cleanKey.length === 14 && /^\d+$/.test(cleanKey))) {
    const companies = [
      "Comercio Ltda",
      "Servicos ME",
      "Distribuidora SA",
      "Tech Solutions",
      "Mercado Express",
    ];
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    const maskedCnpj = `${cleanKey.substring(0, 2)}.***.***/****-${cleanKey.substring(12, 14)}`;

    return {
      found: true,
      name: randomCompany,
      document: maskedCnpj,
      documentType: "CNPJ",
      keyType: "CNPJ",
      key: pixKey,
      bank: "Itau Unibanco",
      bankCode: "341",
    };
  }

  // For email keys
  if (keyType === "EMAIL" || pixKey.includes("@")) {
    const namePart = pixKey.split("@")[0];
    const formattedName = namePart
      .replace(/[._]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return {
      found: true,
      name: formattedName || "Usuario",
      document: "***.***.***-**",
      documentType: "CPF",
      keyType: "EMAIL",
      key: pixKey,
      bank: "Nubank",
      bankCode: "260",
    };
  }

  // For phone keys
  if (keyType === "TELEFONE" || /^\+?55?\d{10,11}$/.test(cleanKey)) {
    const maskedPhone = pixKey.length > 4 
      ? `****${pixKey.slice(-4)}`
      : pixKey;

    return {
      found: true,
      name: "Titular da Conta",
      document: "***.***.***-**",
      documentType: "CPF",
      keyType: "TELEFONE",
      key: maskedPhone,
      bank: "Bradesco",
      bankCode: "237",
    };
  }

  // For random keys (EVP/UUID)
  if (keyType === "ALEATORIA" || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pixKey)) {
    return {
      found: true,
      name: "Conta Verificada",
      document: "***.***.***-**",
      documentType: "CPF",
      keyType: "ALEATORIA",
      key: `${pixKey.substring(0, 8)}...${pixKey.substring(pixKey.length - 4)}`,
      bank: "Caixa Economica",
      bankCode: "104",
    };
  }

  // Default case
  return {
    found: true,
    name: "Destinatario",
    document: "***.***.***-**",
    documentType: "CPF",
    keyType: keyType || "PIX",
    key: pixKey.length > 20 ? `${pixKey.substring(0, 10)}...` : pixKey,
    bank: "Instituicao Financeira",
    bankCode: "000",
  };
}
