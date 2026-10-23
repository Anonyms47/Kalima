import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kalima",
    template: "%s · Kalima",
  },
  description: "Kalima, application web construite avec Next.js et Supabase.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-foreground/10">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Kalima
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="hover:underline">
                Tableau de bord
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-foreground px-4 py-2 text-background hover:opacity-90"
              >
                Connexion
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-foreground/10 py-6 text-center text-sm text-foreground/60">
          © Kalima
        </footer>
      </body>
    </html>
  );
}
