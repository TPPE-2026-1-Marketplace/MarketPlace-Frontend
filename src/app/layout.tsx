import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DK Fashion — Vestidos de Festa no Distrito Federal",
    template: "%s | DK Fashion",
  },
  description:
    "Encontre o vestido perfeito para debutantes, formandas, madrinhas e convidadas. Loja especializada em vestidos de festa com entrega para todo o Brasil.",
  keywords: [
    "vestidos de festa",
    "vestido debutante",
    "vestido formatura",
    "vestido casamento",
    "vestido madrinha",
    "moda festa",
    "DK Fashion",
    "Distrito Federal",
    "Brasília",
  ],
  authors: [{ name: "DK Fashion" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "DK Fashion",
    title: "DK Fashion — Vestidos de Festa",
    description:
      "Vestidos de festa exclusivos para debutantes, formandas e convidadas. Entrega para todo o Brasil.",
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Header />
        <div className="min-h-screen">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
