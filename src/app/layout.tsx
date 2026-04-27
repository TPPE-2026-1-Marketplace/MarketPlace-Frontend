import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DK Fashion",
  description: "Sua loja de vestidos no Distrito Federal.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
