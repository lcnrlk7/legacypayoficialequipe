import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Seguro",
  description: "Pagamento seguro e rapido",
  icons: {
    icon: [
      { url: "/checkout-favicon.png", type: "image/png" },
      { url: "/checkout-favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/checkout-favicon.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/checkout-favicon.png",
    apple: "/checkout-favicon.png",
    other: [
      { rel: "icon", url: "/checkout-favicon.png" },
    ],
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
