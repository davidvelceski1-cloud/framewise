import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CommandPalette } from "@/components/command-palette";
import { AssistantWidget } from "@/components/assistant";
import { getSearchIndex } from "@/lib/db";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const display = Inter_Tight({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "FRAMEWISE — The Game Performance Atlas", template: "%s · FRAMEWISE" },
  description: "Every game. Every platform. Every frame. Credits, PC specs and cross-platform performance comparisons for consoles, handhelds and PC.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D11" },
  ],
};

// Applies the saved theme before paint to avoid a flash of the wrong edition.
const themeScript = `try{var t=JSON.parse(localStorage.getItem("fw:theme"));if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const index = await getSearchIndex();
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <CommandPalette index={index} />
          <AssistantWidget />
        </Providers>
      </body>
    </html>
  );
}
