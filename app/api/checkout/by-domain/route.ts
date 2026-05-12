import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "Dominio nao informado" },
        { status: 400 }
      );
    }

    // Busca checkout pelo dominio personalizado
    const checkouts = await sql`
      SELECT c.*, 
        COALESCE(
          (SELECT json_agg(p.*)
           FROM checkout_product_items cpi
           JOIN checkout_products p ON p.id = cpi.product_id
           WHERE cpi.checkout_id = c.id AND p.active = true),
          '[]'::json
        ) as products
      FROM checkouts c
      WHERE c.custom_domain = ${domain}
        AND c.active = true
      LIMIT 1
    `;

    if (checkouts.length === 0) {
      return NextResponse.json(
        { error: "Checkout nao encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(checkouts[0]);
  } catch (error) {
    console.error("[API] Error fetching checkout by domain:", error);
    return NextResponse.json(
      { error: "Erro ao buscar checkout" },
      { status: 500 }
    );
  }
}
