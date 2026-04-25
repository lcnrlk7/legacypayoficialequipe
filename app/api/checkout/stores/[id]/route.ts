import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const checkout = await sql`
      SELECT * FROM checkouts
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (checkout.length === 0) {
      return NextResponse.json({ error: "Checkout nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ checkout: checkout[0] });
  } catch (error) {
    console.error("[API] Error fetching checkout:", error);
    return NextResponse.json({ error: "Erro ao buscar checkout" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check slug uniqueness if changing
    if (body.slug) {
      const existing = await sql`
        SELECT id FROM checkouts WHERE slug = ${body.slug} AND id != ${id}
      `;
      if (existing.length > 0) {
        return NextResponse.json({ error: "Este slug ja esta em uso" }, { status: 400 });
      }
    }

    const checkout = await sql`
      UPDATE checkouts
      SET 
        name = COALESCE(${body.name}, name),
        slug = COALESCE(${body.slug}, slug),
        description = ${body.description},
        logo_url = ${body.logo_url},
        banner_url = ${body.banner_url},
        primary_color = COALESCE(${body.primary_color}, primary_color),
        secondary_color = COALESCE(${body.secondary_color}, secondary_color),
        text_color = COALESCE(${body.text_color}, text_color),
        bg_color = COALESCE(${body.bg_color}, bg_color),
        pix_enabled = COALESCE(${body.pix_enabled}, pix_enabled),
        card_enabled = COALESCE(${body.card_enabled}, card_enabled),
        boleto_enabled = COALESCE(${body.boleto_enabled}, boleto_enabled),
        show_timer = COALESCE(${body.show_timer}, show_timer),
        timer_minutes = COALESCE(${body.timer_minutes}, timer_minutes),
        show_stock = COALESCE(${body.show_stock}, show_stock),
        show_testimonials = COALESCE(${body.show_testimonials}, show_testimonials),
        require_phone = COALESCE(${body.require_phone}, require_phone),
        require_cpf = COALESCE(${body.require_cpf}, require_cpf),
        headline = ${body.headline},
        subheadline = ${body.subheadline},
        cta_text = COALESCE(${body.cta_text}, cta_text),
        success_message = COALESCE(${body.success_message}, success_message),
        facebook_pixel = ${body.facebook_pixel},
        google_analytics = ${body.google_analytics},
        tiktok_pixel = ${body.tiktok_pixel},
        status = COALESCE(${body.status}, status),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    if (checkout.length === 0) {
      return NextResponse.json({ error: "Checkout nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ checkout: checkout[0] });
  } catch (error) {
    console.error("[API] Error updating checkout:", error);
    return NextResponse.json({ error: "Erro ao atualizar checkout" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    await sql`
      DELETE FROM checkouts
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting checkout:", error);
    return NextResponse.json({ error: "Erro ao excluir checkout" }, { status: 500 });
  }
}
