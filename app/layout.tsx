import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = {
  metadataBase: new URL("https://cryptic.vercel.app"),
  title: { default: "Cryptic · The marketplace for AI craft", template: "%s · Cryptic" },
  description:
    "Buy and sell Claude Skills, GPTs, prompt packs, context engineering guides and AI courses from the best creators.",
  openGraph: { title: "Cryptic", description: "The marketplace for AI craft.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#060608" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${serif.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
