import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "LegacyPay - Sua Carteira Digital",
  description:
    "Receba e envie PIX de forma anônima, sem MED ou bloqueios e sem KYC. Infraestrutura completa para você operar com tranquilidade.",
  keywords: ["PIX", "pagamentos", "carteira digital", "fintech", "gateway"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LegacyPay",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6a00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <head>
        <link rel="icon" type="image/png" href="/logo-lp.png" />
        <link rel="apple-touch-icon" href="/logo-lp.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
