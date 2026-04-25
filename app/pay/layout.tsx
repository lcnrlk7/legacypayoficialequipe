import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Seguro",
  description: "Pagamento seguro e rapido",
  icons: {
    icon: "/checkout-favicon.png",
    shortcut: "/checkout-favicon.png",
    apple: "/checkout-favicon.png",
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
