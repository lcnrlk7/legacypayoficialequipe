import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Get checkouts with order stats
    const checkouts = await sql`
      SELECT 
        c.*,
        COALESCE(o.orders_count, 0) as orders_count,
        COALESCE(o.revenue, 0) as revenue
      FROM checkouts c
      LEFT JOIN (
        SELECT 
          checkout_id,
          COUNT(*) as orders_count,
          SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as revenue
        FROM checkout_orders
        GROUP BY checkout_id
      ) o ON c.id = o.checkout_id
      WHERE c.user_id = ${user.id}
      ORDER BY c.created_at DESC
    `;

    return NextResponse.json({ checkouts });
  } catch (error) {
    console.error("[API] Error fetching checkouts:", error);
    return NextResponse.json({ error: "Erro ao buscar checkouts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      slug, 
      description, 
      primary_color, 
      custom_domain,
      theme,
      require_name,
      require_email,
      require_phone,
      require_cpf,
      require_address,
      timer_enabled,
      timer_minutes,
      success_url,
      seo_title,
      show_visitor_counter
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug sao obrigatorios" }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await sql`
      SELECT id FROM checkouts WHERE slug = ${slug}
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: "Este slug ja esta em uso" }, { status: 400 });
    }

    // Check if custom domain already exists
    if (custom_domain) {
      const domainExists = await sql`
        SELECT id FROM checkouts WHERE custom_domain = ${custom_domain}
      `;
      if (domainExists.length > 0) {
        return NextResponse.json({ error: "Este dominio ja esta em uso" }, { status: 400 });
      }
    }

    const checkout = await sql`
      INSERT INTO checkouts (
        user_id, name, slug, description, primary_color, custom_domain,
        theme, require_name, require_email, require_phone, require_cpf,
        timer_enabled, timer_minutes, success_url, seo_title, 
        show_visitor_counter, status
      ) VALUES (
        ${user.id}, ${name}, ${slug}, ${description || null}, ${primary_color || '#f97316'}, 
        ${custom_domain || null}, ${theme || 'dark'}, ${require_name !== false}, 
        ${require_email !== false}, ${require_phone || false}, ${require_cpf || false},
        ${timer_enabled || false}, ${timer_minutes || 15}, ${success_url || null},
        ${seo_title || null}, ${show_visitor_counter || false}, 'active'
      )
      RETURNING *
    `;

    return NextResponse.json({ checkout: checkout[0] });
  } catch (error) {
    console.error("[API] Error creating checkout:", error);
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 });
  }
}
