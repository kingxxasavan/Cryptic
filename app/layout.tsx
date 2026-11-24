import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Cryptic Parts · Design every part with AI", template: "%s · Cryptic Parts" },
  description:
    "Describe what you're building. Cryptic Parts researches real sizes, designs every part in 3D, and lets you explode, edit, color and export them for printing.",
  openGraph: { title: "Cryptic Parts", description: "Design every part of your project in 3D with AI.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#07070a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh">
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{ style: { background: "#14141b", border: "1px solid rgb(255 255 255 / 0.1)", color: "#ececf2", borderRadius: 14 } }}
        />
      </body>
    </html>
  );
}
