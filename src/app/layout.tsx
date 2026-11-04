import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Bolão dos Cria - Palpites de Futebol",
  description:
    "Participe dos bolões do Bolão dos Cria. Envie seus palpites nos jogos decisivos e dispute a premiação no Pix com ranking em tempo real!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#080c0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-arena-950 text-slate-100 flex flex-col min-h-screen selection:bg-pitch-green selection:text-arena-950">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-8">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
