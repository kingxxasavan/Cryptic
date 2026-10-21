import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
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
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-ink">
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{ style: { background: "#121218", border: "1px solid rgb(255 255 255 / 0.1)", color: "#ededf1", borderRadius: 16 } }}
        />
      </body>
    </html>
  );
}
