import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Seguro",
  description: "Pagamento seguro e rapido",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
