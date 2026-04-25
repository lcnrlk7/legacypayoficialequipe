import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckoutPage } from "./checkout-page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCheckout(slug: string) {
  try {
    // Get checkout with products
    const checkouts = await sql`
      SELECT * FROM checkouts WHERE slug = ${slug} AND status = 'active'
    `;

    if (checkouts.length === 0) return null;

    const checkout = checkouts[0];

    // Get products for this checkout
    const products = await sql`
      SELECT 
        p.*,
        cpi.custom_price,
        cpi.sort_order
      FROM checkout_product_items cpi
      JOIN checkout_products p ON cpi.product_id = p.id
      WHERE cpi.checkout_id = ${checkout.id}
      AND p.status = 'active'
      ORDER BY cpi.sort_order ASC
    `;

    // Increment visits
    await sql`
      UPDATE checkouts SET visits = visits + 1 WHERE id = ${checkout.id}
    `;

    return { ...checkout, products };
  } catch (error) {
    console.error("Error fetching checkout:", error);
    return null;
  }
}

export default async function PayPage({ params }: PageProps) {
  const { slug } = await params;
  const checkout = await getCheckout(slug);

  if (!checkout) {
    notFound();
  }

  return <CheckoutPage checkout={checkout as any} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const checkout = await getCheckout(slug);

  if (!checkout) {
    return { title: "Checkout nao encontrado" };
  }

  const data = checkout as any;
  
  // Usar titulo customizado se existir, senao usa o padrao
  const title = data.seo_title || `LegacyPay - ${data.name || "Checkout"}`;
  
  // Configurar favicon customizado se existir
  const icons = data.favicon_url 
    ? {
        icon: [
          { url: data.favicon_url, type: "image/png" },
          { url: data.favicon_url, sizes: "32x32", type: "image/png" },
        ],
        shortcut: data.favicon_url,
        apple: data.favicon_url,
      }
    : {
        icon: "/checkout-favicon.png",
        shortcut: "/checkout-favicon.png",
        apple: "/checkout-favicon.png",
      };

  return {
    title,
    description: data.description || `Checkout - ${data.name}`,
    icons,
  };
}
